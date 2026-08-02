/**
 * IZGARA HARİTA ÜRETİCİ
 *
 * Sınır verisini (geoBoundaries, CC BY 4.0) alır, üstüne ızgara geçirir ve
 * her noktanın hangi bölgeye düştüğünü hesaplar. Sonuç küçük JSON dosyaları.
 *
 * Uygulama çalışırken HİÇ hesap yapmaz — sadece bu dosyaları okuyup çizer.
 *
 * Kullanım:
 *   node scripts/izgara-uret.mjs dunya
 *   node scripts/izgara-uret.mjs ulke TUR        (Türkiye'nin illeri)
 *   node scripts/izgara-uret.mjs il TUR Manisa   (Manisa'nın ilçeleri)
 *
 * Kaynak: geoBoundaries — https://www.geoboundaries.org  (CC BY 4.0)
 */

import { mkdir, writeFile, readFile, access } from 'node:fs/promises'
import path from 'node:path'

const CIKTI = path.join(process.cwd(), 'public', 'izgara')

/** Dosya adı için sadeleştirir: "Şanlıurfa" → "sanliurfa" */
export function slug(s) {
  return s
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function varMi(yol) {
  try {
    await access(yol)
    return true
  } catch {
    return false
  }
}

/* ---------------------------------------------------------------- KAYNAK */

// Dünya geneli tek dosya (CGAZ = küresel standartlaştırılmış set)
const CGAZ = (seviye) =>
  `https://github.com/wmgeolab/geoBoundaries/raw/main/releaseData/CGAZ/geoBoundariesCGAZ_${seviye}.geojson`

// Tek ülke için (daha detaylı)
const ULKE = (iso, seviye) =>
  `https://github.com/wmgeolab/geoBoundaries/raw/main/releaseData/gbOpen/${iso}/${seviye}/geoBoundaries-${iso}-${seviye}_simplified.geojson`

async function geoJsonAl(url) {
  process.stdout.write(`  indiriliyor: ${url.split('/').pop()}\n`)
  const c = await fetch(url)
  if (!c.ok) throw new Error(`İndirilemedi (${c.status}): ${url}`)
  return c.json()
}

/* ---------------------------------------------------------------- GEOMETRİ */

/** Bir halkanın (ring) içinde mi — ışın atma yöntemi. */
function halkaIcinde(x, y, halka) {
  let icinde = false
  for (let i = 0, j = halka.length - 1; i < halka.length; j = i++) {
    const [xi, yi] = halka[i]
    const [xj, yj] = halka[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) icinde = !icinde
  }
  return icinde
}

/** Poligon: ilk halka dış sınır, sonrakiler delik. */
function poligonIcinde(x, y, poligon) {
  if (!halkaIcinde(x, y, poligon[0])) return false
  for (let i = 1; i < poligon.length; i++) if (halkaIcinde(x, y, poligon[i])) return false
  return true
}

function sinirKutusu(poligonlar) {
  let x1 = Infinity,
    y1 = Infinity,
    x2 = -Infinity,
    y2 = -Infinity
  for (const p of poligonlar)
    for (const [x, y] of p[0]) {
      if (x < x1) x1 = x
      if (x > x2) x2 = x
      if (y < y1) y1 = y
      if (y > y2) y2 = y
    }
  return [x1, y1, x2, y2]
}

/** GeoJSON özelliğini {ad, kod, poligonlar, kutu} biçimine çevirir. */
function bolgeleriHazirla(geojson, adAlanlari, kodAlanlari) {
  const bolgeler = []
  for (const f of geojson.features) {
    const g = f.geometry
    if (!g) continue
    const poligonlar =
      g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : null
    if (!poligonlar) continue

    const p = f.properties ?? {}
    const ad = adAlanlari.map((a) => p[a]).find(Boolean) ?? 'Bilinmiyor'
    const kod = kodAlanlari.map((a) => p[a]).find(Boolean) ?? ad

    bolgeler.push({ ad: String(ad), kod: String(kod), poligonlar, kutu: sinirKutusu(poligonlar) })
  }
  return bolgeler
}

/* ---------------------------------------------------------------- IZGARA */

/**
 * Bölgelerin üstüne ızgara geçirir.
 * hedefNokta: yaklaşık kaç nokta çıksın (adım buna göre hesaplanır)
 */
function izgaraCiz(bolgeler, hedefNokta, kutuElle) {
  // Tüm bölgeleri kapsayan kutu
  let [x1, y1, x2, y2] = kutuElle ?? [Infinity, Infinity, -Infinity, -Infinity]
  if (!kutuElle)
    for (const b of bolgeler) {
      x1 = Math.min(x1, b.kutu[0])
      y1 = Math.min(y1, b.kutu[1])
      x2 = Math.max(x2, b.kutu[2])
      y2 = Math.max(y2, b.kutu[3])
    }

  const en = x2 - x1
  const boy = y2 - y1
  // Kara oranı ~%35 varsayımıyla adım seç, sonra gerçek sayıya göre düzeltilebilir
  let adim = Math.sqrt((en * boy * 0.35) / hedefNokta)
  adim = Number(adim.toFixed(4))

  const sutun = Math.ceil(en / adim)
  const satir = Math.ceil(boy / adim)

  const noktalar = []
  const kullanilan = new Map() // kod -> index

  for (let sy = 0; sy < satir; sy++) {
    const y = y2 - (sy + 0.5) * adim // yukarıdan aşağı (ekran yönü)
    for (let sx = 0; sx < sutun; sx++) {
      const x = x1 + (sx + 0.5) * adim

      for (const b of bolgeler) {
        const [bx1, by1, bx2, by2] = b.kutu
        if (x < bx1 || x > bx2 || y < by1 || y > by2) continue
        let icinde = false
        for (const p of b.poligonlar)
          if (poligonIcinde(x, y, p)) {
            icinde = true
            break
          }
        if (!icinde) continue

        if (!kullanilan.has(b.kod)) kullanilan.set(b.kod, { i: kullanilan.size, ad: b.ad })
        noktalar.push([sx, sy, kullanilan.get(b.kod).i])
        break // ilk eşleşen bölge yeter
      }
    }
  }

  const bolgeListesi = [...kullanilan.entries()].map(([kod, v]) => ({ kod, ad: v.ad }))
  return { adim, sutun, satir, x1, y1, x2, y2, noktalar, bolgeler: bolgeListesi }
}

/* ---------------------------------------------------------------- YAZ */

async function yaz(dosyaAdi, veri) {
  await mkdir(CIKTI, { recursive: true })
  const yol = path.join(CIKTI, dosyaAdi)
  const json = JSON.stringify(veri)
  await writeFile(yol, json)
  const kb = (Buffer.byteLength(json) / 1024).toFixed(1)
  console.log(`  ✓ ${dosyaAdi}  ${veri.noktalar.length} nokta · ${veri.bolgeler.length} bölge · ${kb} KB`)
}

/* ---------------------------------------------------------------- İŞLER */

async function dunyaUret(hedef = 7500) {
  console.log(`DÜNYA (ülkeler) — hedef ~${hedef} nokta`)
  const gj = await geoJsonAl(CGAZ('ADM0'))
  const bolgeler = bolgeleriHazirla(gj, ['shapeName'], ['shapeGroup', 'shapeISO'])
  console.log(`  ${bolgeler.length} ülke bulundu, ızgara çiziliyor…`)
  // Antarktika haritayı ezmesin: -60 güney sınırı
  const sonuc = izgaraCiz(bolgeler, hedef, [-180, -60, 180, 84])
  await yaz('dunya.json', { ad: 'Dünya', seviye: 'ulke', ...sonuc })
}

async function ulkeUret(iso) {
  console.log(`ÜLKE: ${iso} (iller)`)
  const gj = await geoJsonAl(ULKE(iso, 'ADM1'))
  const bolgeler = bolgeleriHazirla(gj, ['shapeName'], ['shapeID', 'shapeName'])
  console.log(`  ${bolgeler.length} il bulundu, ızgara çiziliyor…`)
  const sonuc = izgaraCiz(bolgeler, 2000)
  await yaz(`${iso}.json`, { ad: iso, seviye: 'il', ...sonuc })
}

async function ilUret(iso, ilAdi) {
  console.log(`İL: ${ilAdi} (${iso}) — ilçeler`)
  const gj = await geoJsonAl(ULKE(iso, 'ADM2'))
  const hepsi = bolgeleriHazirla(gj, ['shapeName'], ['shapeID', 'shapeName'])

  // ADM2 dosyasında il bilgisi yoksa, ilin sınır kutusuna düşenleri alırız
  const il = await geoJsonAl(ULKE(iso, 'ADM1'))
  const iller = bolgeleriHazirla(il, ['shapeName'], ['shapeID', 'shapeName'])
  const hedefIl = iller.find(
    (i) => i.ad.toLocaleLowerCase('tr') === ilAdi.toLocaleLowerCase('tr'),
  )
  if (!hedefIl) {
    console.log(`  ⚠️ "${ilAdi}" bulunamadı. Mevcut iller: ${iller.slice(0, 10).map((i) => i.ad).join(', ')}…`)
    return
  }

  // İlin sınırları içine düşen ilçeler (merkez noktası testi)
  const ilceler = hepsi.filter((b) => {
    const mx = (b.kutu[0] + b.kutu[2]) / 2
    const my = (b.kutu[1] + b.kutu[3]) / 2
    return hedefIl.poligonlar.some((p) => poligonIcinde(mx, my, p))
  })
  console.log(`  ${ilceler.length} ilçe bulundu, ızgara çiziliyor…`)
  if (!ilceler.length) return

  const sonuc = izgaraCiz(ilceler, 400)
  await yaz(`${iso}-${ilAdi.toLocaleLowerCase('tr').replace(/\s+/g, '-')}.json`, {
    ad: ilAdi,
    seviye: 'ilce',
    ...sonuc,
  })
}

/* ---------------------------------------------------------------- TOPLU ÜRETİM */

/**
 * DÜNYANIN TAMAMI: her ülkenin illeri + her ilin ilçeleri.
 * Kaldığı yerden devam eder — üretilmiş dosyayı atlar.
 * Sonuçta `liste.json` yazar: hangi bölgenin haritası var, uygulama onu okur.
 */
async function hepsiniUret() {
  console.log('TOPLU ÜRETİM — dünyadaki tüm ülke, il ve ilçeler\n')

  // Ülke listesi dünya ızgarasından (zaten ISO kodları var)
  const dunyaYol = path.join(CIKTI, 'dunya.json')
  if (!(await varMi(dunyaYol))) {
    console.log('Önce dünya ızgarası üretilmeli: node scripts/izgara-uret.mjs dunya')
    return
  }
  const dunya = JSON.parse(await readFile(dunyaYol, 'utf8'))
  const isoListesi = [...new Set(dunya.bolgeler.map((b) => b.kod))].filter(
    (k) => /^[A-Z]{3}$/.test(k),
  )
  console.log(`${isoListesi.length} ülke işlenecek\n`)

  const liste = { dunya: true, ulkeler: {}, iller: {} }
  let sayac = 0
  const basla = Date.now()

  for (const iso of isoListesi) {
    sayac++
    const onEk = `[${String(sayac).padStart(3)}/${isoListesi.length}] ${iso}`

    /* --- İLLER (ADM1) --- */
    const ulkeDosya = `${iso}.json`
    let iller = null
    try {
      if (await varMi(path.join(CIKTI, ulkeDosya))) {
        const v = JSON.parse(await readFile(path.join(CIKTI, ulkeDosya), 'utf8'))
        liste.ulkeler[iso] = v.bolgeler.length
        console.log(`${onEk} iller: atlandı (var, ${v.bolgeler.length} il)`)
      } else {
        const gj = await geoJsonAl(ULKE(iso, 'ADM1'))
        iller = bolgeleriHazirla(gj, ['shapeName'], ['shapeID', 'shapeName'])
        if (iller.length) {
          const sonuc = izgaraCiz(iller, Math.min(2500, Math.max(400, iller.length * 30)))
          await yaz(ulkeDosya, { ad: iso, seviye: 'il', ...sonuc })
          liste.ulkeler[iso] = sonuc.bolgeler.length
        } else {
          console.log(`${onEk} iller: veri yok`)
        }
      }
    } catch {
      console.log(`${onEk} iller: ADM1 bulunamadı, atlandı`)
      continue
    }

    /* --- İLÇELER (ADM2) — ülkenin dosyası bir kez inip tüm illere kullanılır --- */
    try {
      // İl sınırları lazım (ilçeleri hangi ile ait diye ayırmak için)
      if (!iller) {
        const gj1 = await geoJsonAl(ULKE(iso, 'ADM1'))
        iller = bolgeleriHazirla(gj1, ['shapeName'], ['shapeID', 'shapeName'])
      }
      const gj2 = await geoJsonAl(ULKE(iso, 'ADM2'))
      const tumIlceler = bolgeleriHazirla(gj2, ['shapeName'], ['shapeID', 'shapeName'])
      if (!tumIlceler.length) throw new Error('ADM2 boş')

      let uretilen = 0
      for (const il of iller) {
        const dosya = `${iso}-${slug(il.ad)}.json`
        if (await varMi(path.join(CIKTI, dosya))) {
          liste.iller[`${iso}-${slug(il.ad)}`] = true
          continue
        }
        // Merkezi bu ilin içine düşen ilçeler
        const ilceler = tumIlceler.filter((b) => {
          const mx = (b.kutu[0] + b.kutu[2]) / 2
          const my = (b.kutu[1] + b.kutu[3]) / 2
          if (mx < il.kutu[0] || mx > il.kutu[2] || my < il.kutu[1] || my > il.kutu[3]) return false
          return il.poligonlar.some((p) => poligonIcinde(mx, my, p))
        })
        if (ilceler.length < 2) continue // tek ilçeli il için harita anlamsız
        const sonuc = izgaraCiz(ilceler, Math.min(900, Math.max(200, ilceler.length * 25)))
        await writeFile(
          path.join(CIKTI, dosya),
          JSON.stringify({ ad: il.ad, seviye: 'ilce', ...sonuc }),
        )
        liste.iller[`${iso}-${slug(il.ad)}`] = true
        uretilen++
      }
      const gecen = Math.round((Date.now() - basla) / 60000)
      console.log(`${onEk} ilçeler: ${uretilen} il için üretildi  (${gecen} dk geçti)`)
    } catch {
      console.log(`${onEk} ilçeler: ADM2 yok, atlandı`)
    }

    // Her ülkeden sonra listeyi güncelle (yarıda kalırsa kaybolmasın)
    await writeFile(path.join(CIKTI, 'liste.json'), JSON.stringify(liste))
  }

  const dk = Math.round((Date.now() - basla) / 60000)
  console.log(
    `\nBİTTİ — ${Object.keys(liste.ulkeler).length} ülke, ${Object.keys(liste.iller).length} il haritası · ${dk} dakika`,
  )
}

/* ---------------------------------------------------------------- ÇALIŞTIR */

const [, , komut, a1, a2] = process.argv

try {
  if (komut === 'dunya') await dunyaUret(a1 ? Number(a1) : undefined)
  else if (komut === 'ulke') await ulkeUret(a1 ?? 'TUR')
  else if (komut === 'il') await ilUret(a1 ?? 'TUR', a2 ?? 'Manisa')
  else if (komut === 'hepsi') await hepsiniUret()
  else {
    console.log('Kullanım:')
    console.log('  node scripts/izgara-uret.mjs dunya [hedefNokta]')
    console.log('  node scripts/izgara-uret.mjs ulke TUR')
    console.log('  node scripts/izgara-uret.mjs il TUR Manisa')
    console.log('  node scripts/izgara-uret.mjs hepsi     ← dünyanın tamamı (saatler sürer)')
    process.exit(1)
  }
} catch (e) {
  console.error('HATA:', e.message)
  process.exit(1)
}
