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

/**
 * NOKTA YOĞUNLUĞU
 * Dünya haritası ~16.000 noktayla çiziliyor ve detay seviyesi beğenildi.
 * Alt katmanlar da aynı görsel yoğunlukta olsun diye yükseltildi.
 * (eski: ülke 2.500 / il 900 → ülke ve il haritaları seyrek ve iri görünüyordu)
 */
const HEDEF_ULKE = 9000 // bir ülkenin il haritası
const HEDEF_ILCE = 3000 // bir ilin ilçe haritası

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

  const eslesme = ilceleriIlleraAta(iller, hepsi)
  const sonuc = ilceIzgarasiCiz(hedefIl, eslesme.get(hedefIl.kod) ?? [], HEDEF_ILCE)
  if (!sonuc) {
    console.log('  ⚠️ bu ile ait ilçe bulunamadı')
    return
  }
  console.log(`  ${sonuc.bolgeler.length} ilçe bulundu, ızgara çizildi`)

  await yaz(`${iso}-${slug(ilAdi)}.json`, {
    ad: ilAdi,
    seviye: 'ilce',
    ...sonuc,
  })
}

/* ---------------------------------------------------------------- İLÇE → İL EŞLEME */

/**
 * Her ilçenin GERÇEK ilini bulur.
 *
 * Neden gerek var: geoBoundaries'te ADM2 dosyasında "bu ilçe hangi ilde"
 * bilgisi yok. Sadece şekiller var. Üstelik ADM1 ve ADM2 şekilleri ayrı ayrı
 * sadeleştirildiği için sınırlar milimetrik üst üste oturmuyor — bir ilçenin
 * kenarı komşu ilin içine birkaç yüz metre taşabiliyor.
 *
 * Yöntem: İlçenin İÇİNDEN birçok nokta örneklenir, her nokta hangi ilde diye
 * sorulur, en çok oyu alan il o ilçenin ilidir. Böylece:
 *  - Kıyı/yarımada ilçeleri (merkezi denize düşenler) kaybolmaz,
 *  - Sınırdan birkaç piksel taşan ilçe komşu ilin listesine sızmaz.
 */
function ilceleriIlleraAta(iller, tumIlceler) {
  const harita = new Map() // il.kod → ilçe[]
  for (const il of iller) harita.set(il.kod, [])

  for (const ilce of tumIlceler) {
    const [x1, y1, x2, y2] = ilce.kutu
    const adim = Math.max((x2 - x1) / 7, (y2 - y1) / 7, 1e-6)

    // Aday iller: kutusu ilçenin kutusuyla kesişenler
    const adayIller = iller.filter(
      (i) => !(i.kutu[2] < x1 || i.kutu[0] > x2 || i.kutu[3] < y1 || i.kutu[1] > y2),
    )
    if (!adayIller.length) continue
    if (adayIller.length === 1) {
      harita.get(adayIller[0].kod).push(ilce)
      continue
    }

    const oy = new Map()
    for (let y = y1 + adim / 2; y < y2; y += adim) {
      for (let x = x1 + adim / 2; x < x2; x += adim) {
        // Nokta gerçekten ilçenin içinde mi?
        let ilceIcinde = false
        for (const p of ilce.poligonlar)
          if (poligonIcinde(x, y, p)) {
            ilceIcinde = true
            break
          }
        if (!ilceIcinde) continue

        for (const il of adayIller) {
          if (x < il.kutu[0] || x > il.kutu[2] || y < il.kutu[1] || y > il.kutu[3]) continue
          let icinde = false
          for (const p of il.poligonlar)
            if (poligonIcinde(x, y, p)) {
              icinde = true
              break
            }
          if (icinde) {
            oy.set(il.kod, (oy.get(il.kod) ?? 0) + 1)
            break
          }
        }
      }
    }

    if (!oy.size) {
      // Hiç iç nokta yakalanamadı (çok küçük ilçe) — kutu ortasıyla son bir deneme
      const mx = (x1 + x2) / 2
      const my = (y1 + y2) / 2
      const il = adayIller.find((i) => i.poligonlar.some((p) => poligonIcinde(mx, my, p)))
      if (il) harita.get(il.kod).push(ilce)
      else harita.get(adayIller[0].kod).push(ilce)
      continue
    }

    let enIyi = null
    let enCok = -1
    for (const [kod, sayi] of oy)
      if (sayi > enCok) {
        enCok = sayi
        enIyi = kod
      }
    harita.get(enIyi).push(ilce)
  }

  return harita
}

/** Noktanın bir dikdörtgene uzaklığı (içindeyse 0) */
function kutuyaUzaklik(x, y, [x1, y1, x2, y2]) {
  const dx = x < x1 ? x1 - x : x > x2 ? x - x2 : 0
  const dy = y < y1 ? y1 - y : y > y2 ? y - y2 : 0
  return dx * dx + dy * dy
}

/* ---------------------------------------------------------------- İLÇE IZGARASI */

/**
 * Bir ilin ilçe ızgarası.
 *
 * ⚠️ ESKİ YÖNTEM HATALIYDI: İlçenin sınır kutusunun ORTASI ile "bu ilçe bu ile
 * ait mi" diye test ediliyordu. Kıyı ve yarımada ilçelerinde (Kuşadası, Fethiye,
 * Datça, Bodrum yarımadası…) bu nokta DENİZE düşüyor ve ilçe tamamen atılıyordu.
 *
 * YENİ YÖNTEM: Izgara ilin sınırı üstüne kurulur. Her nokta için önce "il içinde
 * mi", sonra "hangi ilçede" sorulur. Karar tamamen geometriye ait — hiçbir ilçe
 * tahminle elenmez. Bir ilçe, ilin içinde alanı varsa görünür.
 */
function ilceIzgarasiCiz(il, ilceler, hedefNokta) {
  const [x1, y1, x2, y2] = il.kutu
  const en = x2 - x1
  const boy = y2 - y1

  // İl alanı sınır kutusunun ~%60'ı varsayımıyla adım
  let adim = Math.sqrt((en * boy * 0.6) / hedefNokta)
  adim = Number(adim.toFixed(5))

  const sutun = Math.ceil(en / adim)
  const satir = Math.ceil(boy / adim)

  // Bu ile ait ilçeler önceden oylamayla belirlendi — burada tahmin yok
  const adaylar = ilceler
  if (!adaylar.length) return null

  // Sıra sabit olsun ki dosya her üretimde aynı çıksın
  const sirali = [...adaylar].sort((a, b) => (a.kod < b.kod ? -1 : 1))
  const bolgeListesi = sirali.map((b) => ({ kod: b.kod, ad: b.ad }))

  const noktalar = []
  const bosHucreler = []

  for (let sy = 0; sy < satir; sy++) {
    const y = y2 - (sy + 0.5) * adim
    for (let sx = 0; sx < sutun; sx++) {
      const x = x1 + (sx + 0.5) * adim

      // 1) İlin içinde mi?
      let ilIcinde = false
      for (const p of il.poligonlar)
        if (poligonIcinde(x, y, p)) {
          ilIcinde = true
          break
        }
      if (!ilIcinde) continue

      // 2) Hangi ilçede?
      let bulundu = -1
      for (let i = 0; i < sirali.length; i++) {
        const b = sirali[i]
        const [bx1, by1, bx2, by2] = b.kutu
        if (x < bx1 || x > bx2 || y < by1 || y > by2) continue
        for (const p of b.poligonlar)
          if (poligonIcinde(x, y, p)) {
            bulundu = i
            break
          }
        if (bulundu >= 0) break
      }

      if (bulundu >= 0) noktalar.push([sx, sy, bulundu])
      else bosHucreler.push([sx, sy, x, y]) // il içinde ama hiçbir ilçeye düşmedi
    }
  }

  // Sınır boşluklarını doldur: il içindeki her hücre bir ilçeye ait olmalı.
  // (ADM1 ve ADM2 ayrı sadeleştirildiği için kıyı ve sınır şeritlerinde
  //  ince boşluklar kalıyor — en yakın ilçeye verilir.)
  for (const [sx, sy, x, y] of bosHucreler) {
    let enIyi = -1
    let enYakin = Infinity
    for (let i = 0; i < sirali.length; i++) {
      const d = kutuyaUzaklik(x, y, sirali[i].kutu)
      if (d < enYakin) {
        enYakin = d
        enIyi = i
      }
    }
    if (enIyi >= 0) noktalar.push([sx, sy, enIyi])
  }

  return { adim, sutun, satir, x1, y1, x2, y2, noktalar, bolgeler: bolgeListesi }
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
          const sonuc = izgaraCiz(iller, HEDEF_ULKE)
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

      // Hangi ilçe hangi ile ait — bir kez, oylamayla
      const eslesme = ilceleriIlleraAta(iller, tumIlceler)

      let uretilen = 0
      for (const il of iller) {
        const dosya = `${iso}-${slug(il.ad)}.json`
        if (await varMi(path.join(CIKTI, dosya))) {
          liste.iller[`${iso}-${slug(il.ad)}`] = true
          continue
        }
        // Izgara ilin üstüne kurulur, her nokta hangi ilçedeyse ona yazılır
        const sonuc = ilceIzgarasiCiz(il, eslesme.get(il.kod) ?? [], HEDEF_ILCE)
        if (!sonuc || sonuc.bolgeler.length < 2) continue // tek ilçeli il için harita anlamsız
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
