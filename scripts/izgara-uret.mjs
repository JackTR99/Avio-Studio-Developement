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

/**
 * ÇİFT KODLAMA ONARIMI
 * geoBoundaries'in bazı dosyalarında isimler iki kez UTF-8'e çevrilmiş:
 * "Región" → "RegiÃ³n", "Marañón" → "MaraÃ±on". Kaynak verinin hatası.
 *
 * Düzeltme: baytları latin-1 gibi geri okuyup tekrar UTF-8 çözmek.
 * Sadece çift kodlama İMZASI olan dizelerde uygulanır — yoksa "Åland",
 * "Äänekoski" gibi gerçekten doğru İskandinav adları bozulurdu.
 */
function kodlamaOnar(s) {
  if (!/[À-ÿ][-¿]/.test(s)) return s
  try {
    const d = Buffer.from(s, 'latin1').toString('utf8')
    return d.includes('�') ? s : d
  } catch {
    return s
  }
}

/**
 * İSİM TEMİZLİĞİ
 * Kaynak veride isimler kirli geliyor: satır sonu karakteri ("Warduj\n"),
 * çift boşluk ("Zanda  Jan"), veri seti eki ("Camden LEA-1"), dil eki
 * ("Åseral nor"). Ekranda bunlar göze batıyor.
 */
function isimTemizle(s) {
  return kodlamaOnar(s)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+(nor|swe|dnk|fin)$/i, '')
    .replace(/\s+LEA-\d+$/i, '')
    .replace(/^["']|["']$/g, '')
    .trim()
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

    bolgeler.push({
      ad: isimTemizle(String(ad)),
      kod: String(kod),
      poligonlar,
      kutu: sinirKutusu(poligonlar),
    })
  }
  return bolgeler
}


/**
 * Bir bölgenin İÇİNDEN bir nokta bulur.
 * Sınır kutusunun ortası denize/komşuya düşebilir (hilal biçimli bölgeler),
 * o yüzden tutmazsa giderek sıklaşan bir taramayla iç nokta aranır.
 */
function icNokta(b) {
  const [x1, y1, x2, y2] = b.kutu
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  for (const p of b.poligonlar) if (poligonIcinde(mx, my, p)) return [mx, my]

  for (const n of [3, 5, 9, 17]) {
    const dx = (x2 - x1) / (n + 1)
    const dy = (y2 - y1) / (n + 1)
    for (let i = 1; i <= n; i++)
      for (let j = 1; j <= n; j++) {
        const x = x1 + i * dx
        const y = y1 + j * dy
        for (const p of b.poligonlar) if (poligonIcinde(x, y, p)) return [x, y]
      }
  }
  return [mx, my] // son çare: kutu ortası
}

/* ---------------------------------------------------------------- IZGARA */

/**
 * Bölgelerin üstüne ızgara geçirir.
 * hedefNokta: yaklaşık kaç nokta çıksın (adım buna göre hesaplanır)
 */
function izgaraCiz(bolgeler, hedefNokta, kutuElle, adimElle) {
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
  let adim = adimElle ?? Math.sqrt((en * boy * 0.35) / hedefNokta)
  adim = Number(adim.toFixed(5))

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

  /**
   * KÜÇÜK BÖLGE GARANTİSİ
   * Izgara çözünürlüğünün altında kalan bölgeler hiç hücre almıyor ve
   * haritadan tamamen kayboluyordu (Türkiye'de 999 ilçenin 26'sı böyle
   * düşmüştü). Böyle bir bölge için içinden bir nokta bulunup o hücre
   * zorla bu bölgeye yazılır — bir noktayla da olsa tıklanabilir kalır.
   */
  const hucreSahibi = new Map()
  noktalar.forEach(([sx, sy], i) => hucreSahibi.set(sy * sutun + sx, i))

  for (const b of bolgeler) {
    if (kullanilan.has(b.kod)) continue
    const [ix, iy] = icNokta(b)
    const sx = Math.min(sutun - 1, Math.max(0, Math.floor((ix - x1) / adim)))
    const sy = Math.min(satir - 1, Math.max(0, Math.floor((y2 - iy) / adim)))
    kullanilan.set(b.kod, { i: kullanilan.size, ad: b.ad })
    const anahtar = sy * sutun + sx
    const eskiIndeks = hucreSahibi.get(anahtar)
    if (eskiIndeks !== undefined) noktalar[eskiIndeks] = [sx, sy, kullanilan.get(b.kod).i]
    else {
      hucreSahibi.set(anahtar, noktalar.length)
      noktalar.push([sx, sy, kullanilan.get(b.kod).i])
    }
  }

  const bolgeListesi = [...kullanilan.entries()].map(([kod, v]) => ({ kod, ad: v.ad }))
  return { adim, sutun, satir, x1, y1, x2, y2, noktalar, bolgeler: bolgeListesi }
}

/**
 * Hedef nokta sayısına YAKLAŞARAK çizer.
 *
 * `izgaraCiz` adımı "kara oranı ~%35" varsayımıyla seçer. Gerçek oran ülkeden
 * ülkeye çok değişir: Şili ince bir şerittir (1.228 nokta çıkmıştı), Svaziland
 * kutusunu neredeyse doldurur (18.851 nokta). Sonuç: bazı haritalar seyrek,
 * bazıları gereksiz ağır. Burada ölçüp adımı düzeltiyoruz.
 */
function izgaraCizHedefli(bolgeler, hedef, kutu, tavan = 900) {
  let t = izgaraCiz(bolgeler, hedef, kutu)
  const en = (kutu ?? t)[2] - (kutu ?? t)[0] || t.sutun * t.adim
  const boy = (kutu ?? t)[3] - (kutu ?? t)[1] || t.satir * t.adim

  for (let deneme = 0; deneme < 4; deneme++) {
    const n = t.noktalar.length
    if (n >= hedef * 0.65 && n <= hedef * 1.6) break
    const oran = Math.max(0.3, Math.min(3, Math.sqrt(Math.max(1, n) / hedef)))
    const yeniAdim = t.adim * oran
    const sutun = Math.ceil(en / yeniAdim)
    const satir = Math.ceil(boy / yeniAdim)
    if (sutun > tavan || satir > tavan || sutun < 4 || satir < 4) break
    t = izgaraCiz(bolgeler, hedef, kutu ?? [t.x1, t.y1, t.x2, t.y2], yeniAdim)
  }
  return t
}

/* ---------------------------------------------------------------- PARÇALI HARİTA */

/**
 * 180. MERİDYEN DÜZELTMESİ
 * Fiji 177°D ile 178°B arasına yayılır. Boylam orada +180'den -180'e atladığı
 * için sınır kutusu "dünyanın tamamı" gibi çıkar ve harita 91:1 oranında ezilir.
 * Çözüm: böyle ülkelerde negatif boylamlar +360 kaydırılır, ülke bütün hâle gelir.
 */
function meridyenDuzelt(bolgeler) {
  let x1 = Infinity
  let x2 = -Infinity
  for (const b of bolgeler) {
    x1 = Math.min(x1, b.kutu[0])
    x2 = Math.max(x2, b.kutu[2])
  }
  if (x2 - x1 <= 180) return bolgeler

  return bolgeler.map((b) => {
    const poligonlar = b.poligonlar.map((p) =>
      p.map((halka) => halka.map(([x, y]) => [x < 0 ? x + 360 : x, y])),
    )
    return { ...b, poligonlar, kutu: sinirKutusu(poligonlar) }
  })
}

/** Bir halkanın alanı (ayakkabı bağı formülü) — işaretsiz. */
function halkaAlani(halka) {
  let t = 0
  for (let i = 0, j = halka.length - 1; i < halka.length; j = i++)
    t += (halka[j][0] + halka[i][0]) * (halka[j][1] - halka[i][1])
  return Math.abs(t / 2)
}

/** Bölgelerin gerçek KARA alanı — sınır kutusu alanı değil. */
function karaAlani(bolgeler) {
  let t = 0
  for (const b of bolgeler)
    for (const p of b.poligonlar) {
      t += halkaAlani(p[0])
      for (let i = 1; i < p.length; i++) t -= halkaAlani(p[i])
    }
  return t
}

/** İki sınır kutusu arasındaki mesafe (derece). Kesişiyorsa 0. */
function kutuMesafesi(a, b) {
  const dx = a[0] > b[2] ? a[0] - b[2] : b[0] > a[2] ? b[0] - a[2] : 0
  const dy = a[1] > b[3] ? a[1] - b[3] : b[1] > a[3] ? b[1] - a[3] : 0
  return Math.hypot(dx, dy)
}

/**
 * Bölgeleri coğrafi kümelere ayırır.
 * Birbirine `esik` dereceden yakın olanlar aynı kümededir.
 * ABD'de kıta / Alaska / Hawaii üç ayrı küme olur.
 */
function kumele(bolgeler, esik = 4) {
  // Kümeleme POLİGON bazında yapılır, il bazında değil. Çünkü uzak ada çoğu
  // zaman bir ilin parçasıdır: Paskalya Adası Şili'nin Valparaíso iline,
  // Hawaii'nin uzak atolleri Hawaii eyaletine aittir. İl bazında bakarsak
  // ada ana karadan ayrılamaz ve haritayı ezmeye devam eder.
  const parcacik = []
  bolgeler.forEach((b, bi) => {
    for (const p of b.poligonlar) parcacik.push({ bi, poligon: p, kutu: sinirKutusu([p]) })
  })

  const ata = parcacik.map((_, i) => i)
  const bul = (i) => (ata[i] === i ? i : (ata[i] = bul(ata[i])))

  for (let i = 0; i < parcacik.length; i++)
    for (let j = i + 1; j < parcacik.length; j++) {
      if (bul(i) === bul(j)) continue
      if (kutuMesafesi(parcacik[i].kutu, parcacik[j].kutu) <= esik) ata[bul(i)] = bul(j)
    }

  const gruplar = new Map()
  parcacik.forEach((p, i) => {
    const k = bul(i)
    if (!gruplar.has(k)) gruplar.set(k, [])
    gruplar.get(k).push(p)
  })

  return [...gruplar.values()]
    .map((g) => {
      // Aynı ile ait poligonları tek bölge hâlinde topla
      const ileGore = new Map()
      for (const p of g) {
        if (!ileGore.has(p.bi)) ileGore.set(p.bi, [])
        ileGore.get(p.bi).push(p.poligon)
      }
      const kumeBolgeleri = [...ileGore.entries()].map(([bi, poligonlar]) => ({
        ad: bolgeler[bi].ad,
        kod: bolgeler[bi].kod,
        poligonlar,
        kutu: sinirKutusu(poligonlar),
      }))

      const kutu = kumeBolgeleri.reduce(
        (a, b) => [
          Math.min(a[0], b.kutu[0]),
          Math.min(a[1], b.kutu[1]),
          Math.max(a[2], b.kutu[2]),
          Math.max(a[3], b.kutu[3]),
        ],
        [Infinity, Infinity, -Infinity, -Infinity],
      )
      return {
        bolgeler: kumeBolgeleri,
        kutu,
        alan: (kutu[2] - kutu[0]) * (kutu[3] - kutu[1]),
        // Kutu sıralaması KARA alanına göre yapılır. Sınır kutusu alanı
        // yanıltıcı: Hawaii'nin ıssız kuzeybatı atolleri kocaman bir kutu
        // kaplar ama içinde neredeyse kara yoktur.
        karaAlan: karaAlani(kumeBolgeleri),
        poligonSayisi: g.length,
      }
    })
    .sort((a, b) => b.alan - a.alan)
}

const EN_FAZLA_KUTU = 5 // ana harita + en fazla 5 küçük kutu
const KUTU_NOKTA = 900 // her uzak toprak kutusu için hedef nokta

/**
 * Bir ülkeyi ana harita + uzak toprak kutuları olarak çizer.
 * (ABD haritalarındaki Alaska/Hawaii kutuları gibi.)
 *
 * Bölge indeksleri TÜM parçalarda ortaktır — renklendirme ve tıklama
 * tek bir bölge listesi üzerinden çalışır.
 */
function parcaliIzgaraCiz(hamBolgeler, hedefNokta) {
  const bolgeler = meridyenDuzelt(hamBolgeler)
  let kumeler = kumele(bolgeler)

  // Tek parçaysa eski davranış — gereksiz karmaşa yok
  if (kumeler.length === 1) {
    const t = izgaraCizHedefli(bolgeler, hedefNokta, kumeler[0].kutu)
    return { parcalar: [{ ...t, bolgeler: undefined }], bolgeler: t.bolgeler, atlanan: [] }
  }

  // Ana parça = en çok il içeren küme (en geniş kutu değil; Alaska devasa
  // ama tek eyalet, kıta ABD daha kalabalık)
  const anaIndeks = kumeler.reduce(
    (en, k, i) => (k.bolgeler.length > kumeler[en].bolgeler.length ? i : en),
    0,
  )
  const ana = kumeler[anaIndeks]
  let adaylar = kumeler.filter((_, i) => i !== anaIndeks)

  // 1) Ana haritayı fazla büyütmeyen kümeler ana haritaya katılır.
  //    (Ege adaları Yunanistan'ın yanı başında — ayrı kutu saçma olurdu.)
  const anaAlan = () => (ana.kutu[2] - ana.kutu[0]) * (ana.kutu[3] - ana.kutu[1])
  const kalan = []
  for (const k of adaylar) {
    const yeniKutu = [
      Math.min(ana.kutu[0], k.kutu[0]),
      Math.min(ana.kutu[1], k.kutu[1]),
      Math.max(ana.kutu[2], k.kutu[2]),
      Math.max(ana.kutu[3], k.kutu[3]),
    ]
    const yeniAlan = (yeniKutu[2] - yeniKutu[0]) * (yeniKutu[3] - yeniKutu[1])
    if (yeniAlan <= anaAlan() * 1.25) {
      ana.bolgeler.push(...k.bolgeler)
      ana.kutu = yeniKutu
    } else kalan.push(k)
  }
  adaylar = kalan

  // 2) Kutu hakkı: yalnızca ana haritada HİÇ görünmeyen il taşıyan kümeler.
  //    Paskalya Adası Valparaíso iline aittir, o il ana haritada zaten var —
  //    ayrı kutu açmak bilgi katmaz, sadece yer kaplar.
  const temsilEdilen = new Set(ana.bolgeler.map((b) => b.kod))
  const atlanan = []
  const kutuAdaylari = []

  // Büyükten küçüğe dolaşılır ve her seçimden sonra "temsil edilenler"
  // güncellenir — yoksa Hawaii'nin iki ada kümesi iki ayrı kutu açardı.
  for (const k of [...adaylar].sort((a, b) => b.karaAlan - a.karaAlan)) {
    const yeni = k.bolgeler.filter((b) => !temsilEdilen.has(b.kod))
    if (!yeni.length || kutuAdaylari.length >= EN_FAZLA_KUTU) {
      atlanan.push(...k.bolgeler.map((b) => b.ad))
      continue
    }
    for (const b of k.bolgeler) temsilEdilen.add(b.kod)
    kutuAdaylari.push(k)
  }

  const sira = [ana, ...kutuAdaylari]
  if (sira.length === 1) {
    const t = izgaraCizHedefli(ana.bolgeler, hedefNokta, ana.kutu)
    return { parcalar: [{ ...t, ad: null, bolgeler: undefined }], bolgeler: t.bolgeler, atlanan }
  }

  // Ortak bölge listesi
  const indeks = new Map()
  const ortakBolgeler = []
  for (const k of sira)
    for (const b of k.bolgeler)
      if (!indeks.has(b.kod)) {
        indeks.set(b.kod, ortakBolgeler.length)
        ortakBolgeler.push({ kod: b.kod, ad: b.ad })
      }

  // Nokta bütçesi: ana haritaya çoğu. Küçük kutular ekranda benzer boyutta
  // çizildiği için her birine EŞİT pay verilir — alana göre bölünürse
  // Alaska bütçeyi yer, Hawaii 6 noktaya düşerdi.
  const parcalar = sira.map((k, i) => {
    const hedef = i === 0 ? Math.round(hedefNokta * 0.85) : KUTU_NOKTA
    // Kutular ekranda küçük çizilir; sütun tavanı da düşük tutulur
    const t = izgaraCizHedefli(k.bolgeler, hedef, k.kutu, i === 0 ? 900 : 400)
    // izgaraCiz kendi yerel indekslerini üretir — ortak indekse çeviriyoruz
    const yerelSira = t.bolgeler.map((b) => indeks.get(b.kod) ?? 0)
    return {
      ad:
        i === 0
          ? null
          : k.bolgeler.length === 1
            ? k.bolgeler[0].ad
            : `${k.bolgeler[0].ad} +${k.bolgeler.length - 1}`,
      adim: t.adim,
      sutun: t.sutun,
      satir: t.satir,
      x1: t.x1,
      y1: t.y1,
      x2: t.x2,
      y2: t.y2,
      noktalar: t.noktalar.map(([sx, sy, bi]) => [sx, sy, yerelSira[bi]]),
    }
  })

  // Hiç nokta çıkmayan kutuyu hiç yazma (ana parça her zaman kalır)
  const dolu = parcalar.filter((p, i) => i === 0 || p.noktalar.length > 0)

  // Hiç nokta almayan bölgeleri listeden çıkar, indeksleri sıkıştır
  const kullanildi = new Set()
  for (const p of dolu) for (const [, , bi] of p.noktalar) kullanildi.add(bi)
  const yeni = new Map()
  const temizBolgeler = []
  ortakBolgeler.forEach((b, i) => {
    if (!kullanildi.has(i)) return
    yeni.set(i, temizBolgeler.length)
    temizBolgeler.push(b)
  })
  for (const p of dolu) p.noktalar = p.noktalar.map(([sx, sy, bi]) => [sx, sy, yeni.get(bi)])

  return { parcalar: dolu, bolgeler: temizBolgeler, atlanan }
}

/* ---------------------------------------------------------------- YAZ */

async function yaz(dosyaAdi, veri) {
  await mkdir(CIKTI, { recursive: true })
  const yol = path.join(CIKTI, dosyaAdi)
  const json = JSON.stringify(veri)
  await writeFile(yol, json)
  const kb = (Buffer.byteLength(json) / 1024).toFixed(1)
  const nokta = veri.parcalar
    ? veri.parcalar.reduce((t, p) => t + p.noktalar.length, 0)
    : veri.noktalar.length
  console.log(`  ✓ ${dosyaAdi}  ${nokta} nokta · ${veri.bolgeler.length} bölge · ${kb} KB`)
}

/* ---------------------------------------------------------------- İŞLER */

async function dunyaUret(hedef = 7500) {
  console.log(`DÜNYA (ülkeler) — hedef ~${hedef} nokta`)
  const gj = await geoJsonAl(CGAZ('ADM0'))
  const bolgeler = bolgeleriHazirla(gj, ['shapeName'], ['shapeGroup', 'shapeISO'])
  console.log(`  ${bolgeler.length} ülke bulundu, ızgara çiziliyor…`)
  // Antarktika haritayı ezmesin: -60 güney sınırı
  const sonuc = izgaraCiz(bolgeler, hedef, [-180, -60, 180, 84])
  // Diğer haritalarla aynı biçim: tek parçalı da olsa `parcalar` dizisi
  await yaz('dunya.json', {
    ad: 'Dünya',
    kademe: 0,
    kademeAdi: 'Ülkeler',
    maskeli: false,
    yaprak: false,
    parcalar: [
      { ad: null, sutun: sonuc.sutun, satir: sonuc.satir, noktalar: sonuc.noktalar },
    ],
    bolgeler: sonuc.bolgeler,
  })
}

async function ulkeUret(iso) {
  console.log(`ÜLKE: ${iso} (iller)`)
  const gj = await geoJsonAl(ULKE(iso, 'ADM1'))
  const bolgeler = bolgeleriHazirla(gj, ['shapeName'], ['shapeID', 'shapeName'])
  console.log(`  ${bolgeler.length} il bulundu, ızgara çiziliyor…`)
  const sonuc = parcaliIzgaraCiz(bolgeler, HEDEF_ULKE)
  if (sonuc.parcalar.length > 1)
    console.log(`  uzak toprak kutusu: ${sonuc.parcalar.length - 1} adet`)
  if (sonuc.atlanan.length) console.log(`  ⚠️ atlanan: ${sonuc.atlanan.join(', ')}`)
  await yaz(`${iso}.json`, { ad: iso, seviye: 'il', ...sonuc })
}

/** Sadece ülke (ADM1) haritalarını yeniden üretir — ilçe dosyalarına dokunmaz. */
async function ulkeleriYenile() {
  const dunya = JSON.parse(await readFile(path.join(CIKTI, 'dunya.json'), 'utf8'))
  const isoListesi = [...new Set(dunya.bolgeler.map((b) => b.kod))].filter((k) =>
    /^[A-Z]{3}$/.test(k),
  )
  console.log(`${isoListesi.length} ülke haritası yenilenecek (ilçelere dokunulmaz)\n`)

  let parcali = 0
  const atlananlar = []
  for (let i = 0; i < isoListesi.length; i++) {
    const iso = isoListesi[i]
    try {
      const gj = await geoJsonAl(ULKE(iso, 'ADM1'))
      const bolgeler = bolgeleriHazirla(gj, ['shapeName'], ['shapeID', 'shapeName'])
      if (!bolgeler.length) continue
      const sonuc = parcaliIzgaraCiz(bolgeler, HEDEF_ULKE)
      await yaz(`${iso}.json`, { ad: iso, seviye: 'il', ...sonuc })
      if (sonuc.parcalar.length > 1) {
        parcali++
        console.log(`   └─ ${sonuc.parcalar.length - 1} uzak toprak kutusu`)
      }
      if (sonuc.atlanan.length) atlananlar.push(`${iso}: ${sonuc.atlanan.join(', ')}`)
    } catch (e) {
      console.log(`[${i + 1}/${isoListesi.length}] ${iso} atlandı — ${e.message}`)
    }
  }
  console.log(`\nBİTTİ — ${parcali} ülke parçalı haritaya çevrildi`)
  if (atlananlar.length) {
    console.log('\nHaritaya sığmayan uzak topraklar (en fazla 5 kutu kuralı):')
    for (const a of atlananlar) console.log('  ' + a)
  }
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

  const eslesme = altlariUstlereAta(iller, hepsi)
  const sonuc = altIzgarasiCiz(hedefIl, eslesme.get(hedefIl.kod) ?? [], HEDEF_ILCE)
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

/* ---------------------------------------------------------------- ALT → ÜST EŞLEME */

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
function altlariUstlereAta(ustler, tumAltlar) {
  const harita = new Map() // üst.kod → alt[]
  for (const ust of ustler) harita.set(ust.kod, [])

  for (const alt of tumAltlar) {
    const [x1, y1, x2, y2] = alt.kutu
    const adim = Math.max((x2 - x1) / 7, (y2 - y1) / 7, 1e-6)

    // Aday üstler: kutusu altınkiyle kesişenler
    const adaylar = ustler.filter(
      (u) => !(u.kutu[2] < x1 || u.kutu[0] > x2 || u.kutu[3] < y1 || u.kutu[1] > y2),
    )
    if (!adaylar.length) continue
    if (adaylar.length === 1) {
      harita.get(adaylar[0].kod).push(alt)
      continue
    }

    const oy = new Map()
    for (let y = y1 + adim / 2; y < y2; y += adim) {
      for (let x = x1 + adim / 2; x < x2; x += adim) {
        // Nokta gerçekten alt bölgenin içinde mi?
        let altIcinde = false
        for (const p of alt.poligonlar)
          if (poligonIcinde(x, y, p)) {
            altIcinde = true
            break
          }
        if (!altIcinde) continue

        for (const ust of adaylar) {
          if (x < ust.kutu[0] || x > ust.kutu[2] || y < ust.kutu[1] || y > ust.kutu[3]) continue
          let icinde = false
          for (const p of ust.poligonlar)
            if (poligonIcinde(x, y, p)) {
              icinde = true
              break
            }
          if (icinde) {
            oy.set(ust.kod, (oy.get(ust.kod) ?? 0) + 1)
            break
          }
        }
      }
    }

    if (!oy.size) {
      // Hiç iç nokta yakalanamadı (çok küçük bölge) — kutu ortasıyla son deneme
      const mx = (x1 + x2) / 2
      const my = (y1 + y2) / 2
      const ust = adaylar.find((u) => u.poligonlar.some((p) => poligonIcinde(mx, my, p)))
      harita.get((ust ?? adaylar[0]).kod).push(alt)
      continue
    }

    let enIyi = null
    let enCok = -1
    for (const [kod, sayi] of oy)
      if (sayi > enCok) {
        enCok = sayi
        enIyi = kod
      }
    harita.get(enIyi).push(alt)
  }

  return harita
}

/** Noktanın bir dikdörtgene uzaklığı (içindeyse 0) */
function kutuyaUzaklik(x, y, [x1, y1, x2, y2]) {
  const dx = x < x1 ? x1 - x : x > x2 ? x - x2 : 0
  const dy = y < y1 ? y1 - y : y > y2 ? y - y2 : 0
  return dx * dx + dy * dy
}

/* ---------------------------------------------------------------- ALT KADEME IZGARASI */

/**
 * Bir üst bölgenin, alt bölgelerini gösteren ızgarası.
 * (Türkiye'de bir ilin ilçeleri; İtalya'da bir ilin belediyeleri; her kademede aynı.)
 *
 * ⚠️ ESKİ YÖNTEM HATALIYDI: Alt bölgenin sınır kutusunun ORTASI ile "bu üstteki
 * bölgeye ait mi" diye test ediliyordu. Kıyı ve yarımada ilçelerinde (Kuşadası,
 * Fethiye, Datça…) bu nokta DENİZE düşüyor ve ilçe tamamen atılıyordu.
 *
 * YENİ YÖNTEM: Izgara üst bölgenin sınırı üstüne kurulur. Her nokta için önce
 * "üst bölgenin içinde mi", sonra "hangi alt bölgede" sorulur. Karar tamamen
 * geometriye ait — hiçbir alt bölge tahminle elenmez.
 */
function altIzgarasiCiz(ust, altlar, hedefNokta) {
  const [x1, y1, x2, y2] = ust.kutu
  const en = x2 - x1
  const boy = y2 - y1

  // Üst bölgenin alanı sınır kutusunun ~%60'ı varsayımıyla adım
  let adim = Math.sqrt((en * boy * 0.6) / hedefNokta)
  adim = Number(adim.toFixed(5))

  const sutun = Math.ceil(en / adim)
  const satir = Math.ceil(boy / adim)

  // Alt bölgeler önceden oylamayla belirlendi — burada tahmin yok
  const adaylar = altlar
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

      // 1) Üst bölgenin içinde mi?
      let ustIcinde = false
      for (const p of ust.poligonlar)
        if (poligonIcinde(x, y, p)) {
          ustIcinde = true
          break
        }
      if (!ustIcinde) continue

      // 2) Hangi alt bölgede?
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
      else bosHucreler.push([sx, sy, x, y]) // üstün içinde ama hiçbir alta düşmedi
    }
  }

  // Sınır boşluklarını doldur: üst bölgedeki her hücre bir alt bölgeye ait olmalı.
  // (Kademeler ayrı ayrı sadeleştirildiği için kıyı ve sınır şeritlerinde ince
  //  boşluklar kalıyor — en yakın alt bölgeye verilir.)
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
      const eslesme = altlariUstlereAta(iller, tumIlceler)

      let uretilen = 0
      for (const il of iller) {
        const dosya = `${iso}-${slug(il.ad)}.json`
        if (await varMi(path.join(CIKTI, dosya))) {
          liste.iller[`${iso}-${slug(il.ad)}`] = true
          continue
        }
        // Izgara ilin üstüne kurulur, her nokta hangi ilçedeyse ona yazılır
        const sonuc = altIzgarasiCiz(il, eslesme.get(il.kod) ?? [], HEDEF_ILCE)
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

/* ================================================================ DERİN ÜRETİM
 *
 * Kademe sayısı ülkeden ülkeye değişir: Türkiye'de 2 (il→ilçe), İtalya'da 4
 * (makro bölge→bölge→il→belediye). Aşağıdaki akış kademe sayısını envanterden
 * okur ve kaç tane varsa o kadar iner.
 *
 * DOSYA DÜZENİ — dosya adı, bölgeye giden zincirdir:
 *   ITA/ulke.json                     → İtalya'nın makro bölgeleri
 *   ITA/nord-ovest.json               → o makro bölgenin bölgeleri
 *   ITA/nord-ovest--lombardia.json    → Lombardia'nın illeri
 *
 * GÖMME — en alttaki kademe ayrı dosya olmaz, üstündekinin içine `alt` alanına
 * yazılır. Böylece dosya sayısı barındırma limitinin altında kalır ve kullanıcı
 * en dibe inerken ek indirme yapmaz.
 */

const ONBELLEK = path.join(process.cwd(), '.izgara-onbellek')

/** Aynı ülkenin dosyasını iki kez indirmemek için diske alır. */
async function geoJsonAlOnbellekli(url) {
  await mkdir(ONBELLEK, { recursive: true })
  const yol = path.join(ONBELLEK, url.split('/').pop())
  if (await varMi(yol)) return JSON.parse(await readFile(yol, 'utf8'))
  const c = await fetch(url)
  if (!c.ok) throw new Error(`İndirilemedi (${c.status})`)
  const metin = await c.text()
  await writeFile(yol, metin)
  return JSON.parse(metin)
}

/** Bir ülkenin bütün kademelerini indirir. Yoksa o kademede durur. */
async function kademeleriAl(iso, enFazla) {
  const kademeler = {}
  for (let n = 1; n <= enFazla; n++) {
    try {
      const gj = await geoJsonAlOnbellekli(ULKE(iso, 'ADM' + n))
      const b = bolgeleriHazirla(gj, ['shapeName'], ['shapeID', 'shapeName'])
      if (!b.length) break
      kademeler[n] = b
    } catch {
      break
    }
  }
  return kademeler
}

/**
 * Bir ülkeyi kademe kademe üretir.
 *
 * ayar.enFazlaKademe : bu kademeden aşağısı üretilmez
 * ayar.gomme         : en alt kademe üst dosyaya gömülsün mü
 * ayar.kademeAdlari  : { 1: 'İller', 2: 'İlçeler', … } ekranda görünecek adlar
 */
async function ulkeyiDerinUret(iso, ayar = {}) {
  const enFazla = ayar.enFazlaKademe ?? 4
  const kademeler = await kademeleriAl(iso, enFazla)
  let derin = Math.max(...Object.keys(kademeler).map(Number).filter(Number.isFinite), 0)
  if (!derin) return { dosya: 0, uyari: 'ADM1 yok' }

  /**
   * KOPYA KADEME AYIKLAMA
   *
   * Bazı ülkelerde bir kademe, bir üstünün birebir kopyası: İngiltere'de
   * ADM3 = ADM2 (216 = 216, isimler aynı), Jamaika'da ADM3 ≈ ADM2 (829 ≈ 827),
   * Cezayir'de ADM2 = ADM1. Bunu üretirsek kullanıcı aynı listeye iki kez iner.
   *
   * Sayı yakınlığı tek başına yetmez (yanlış eleyebilir) — İSİM ÖRTÜŞMESİNE
   * bakılır. Alt kademenin adlarının %90'ından fazlası üst kademede de varsa
   * o kademe kopyadır, oradan aşağısı üretilmez.
   */
  const sade = (s) => s.toLocaleLowerCase('tr').replace(/[^a-z0-9çğıöşü]/g, '')
  let kopyaKademe = null
  for (let n = 2; n <= derin; n++) {
    const ustAdlar = new Set(kademeler[n - 1].map((b) => sade(b.ad)))
    const ortak = kademeler[n].filter((b) => ustAdlar.has(sade(b.ad))).length
    if (kademeler[n].length && ortak / kademeler[n].length > 0.9) {
      kopyaKademe = n
      derin = n - 1
      for (let k = n; k <= 4; k++) delete kademeler[k]
      break
    }
  }

  // Her kademenin bir üstteki bölgelere dağılımı
  const eslesme = {}
  for (let n = 2; n <= derin; n++) eslesme[n] = altlariUstlereAta(kademeler[n - 1], kademeler[n])

  // Bir bölgeye giden zincir: kod → "nord-ovest--lombardia"
  const zincir = new Map()
  for (const b of kademeler[1]) zincir.set(b.kod, slug(b.ad))
  for (let n = 2; n <= derin; n++)
    for (const ust of kademeler[n - 1])
      for (const alt of eslesme[n].get(ust.kod) ?? [])
        zincir.set(alt.kod, `${zincir.get(ust.kod)}--${slug(alt.ad)}`)

  /**
   * GÖMME HER YERDE UYGUN DEĞİL.
   * Gömünce üst dosya, altındaki her bölgenin ızgarasını da taşır. Türkiye'de
   * ülke dosyasına 81 ilin ilçe ızgarası girerdi → 2,2 MB tek dosya. Ziyaretçi
   * tek harita için bunu indirmemeli.
   *
   * Ölçü: gömülecek ızgara sayısı. Bir ızgara ~28 KB; tavan 15 ≈ 420 KB.
   */
  const gomulecekIzgara = derin >= 2 ? kademeler[derin - 1].length / (kademeler[derin - 2]?.length ?? 1) : 0
  const gomulenKademe =
    ayar.gomme && derin >= 2 && gomulecekIzgara <= (ayar.gommeTavani ?? 15) ? derin : null
  const klasor = path.join(CIKTI, iso)
  await mkdir(klasor, { recursive: true })
  let yazilan = 0

  /**
   * Bir üst bölgenin çocuklarının haritası.
   *
   * ⚠️ ESKİDEN tek parça çiziliyordu ve bu ciddi hatalara yol açıyordu:
   * Tokyo prefektürü 1.000 km güneydeki Ogasawara adalarını da içerdiği için
   * sınır kutusu devleşiyor, ızgara kabalaşıyor ve şehirdeki 62 belediyenin
   * hepsi tek hücrenin altında kalıp kayboluyordu. Fiji'de oran 352:1 çıkıyordu.
   *
   * Artık ülke haritasında zaten çalışan parçalı çizim burada da kullanılıyor:
   * uzak topraklar ayrı kutuya alınıyor, 180. meridyen sarması düzeltiliyor,
   * nokta sayısı hedefe oturtuluyor.
   *
   * Nokta hedefi bölge sayısına göre ölçekleniyor — 400 belediyeli bir ile
   * 12 ilçeli bir il aynı nokta bütçesiyle çizilemez.
   */
  function altHaritasiCiz(cocuklar) {
    const hedef = Math.max(HEDEF_ILCE, Math.min(12000, cocuklar.length * 45))
    return parcaliIzgaraCiz(cocuklar, hedef)
  }

  /** Gömülecek kademenin ızgaralarını hazırla: üst kodu → ızgara */
  function gomulu(ustler, kademeNo) {
    if (gomulenKademe !== kademeNo) return undefined
    const paket = {}
    for (const ust of ustler) {
      const cocuklar = eslesme[kademeNo].get(ust.kod) ?? []
      // Tek çocuklu bölge de üretilir. Eskiden atlanıyordu ve bu ciddi kayba
      // yol açıyordu: İspanya'da 19 özerk bölgenin 9'u tek illi (Madrid,
      // Murcia, Navarra…) — o illerin 939 belediyesi hiç çizilmiyordu.
      if (!cocuklar.length) continue
      const g = altHaritasiCiz(cocuklar)
      if (g?.parcalar?.length)
        paket[ust.kod] = {
          parcalar: g.parcalar,
          bolgeler: g.bolgeler,
          kademeAdi: ayar.kademeAdlari?.[kademeNo] ?? 'Bölgeler',
          maskeli: kademeNo > (ayar.ilceKademesi ?? 2),
          yaprak: true, // gömülü kademe her zaman en alttır
        }
    }
    return Object.keys(paket).length ? paket : undefined
  }

  // 1. kademe: ülkenin en üst bölümü — uzak toprak kutularıyla
  const ulkeHaritasi = parcaliIzgaraCiz(kademeler[1], HEDEF_ULKE)
  await writeFile(
    path.join(klasor, 'ulke.json'),
    JSON.stringify({
      ad: iso,
      kademe: 1,
      kademeAdi: ayar.kademeAdlari?.[1] ?? 'Bölgeler',
      // Bu kademede gizlilik eşiği geçerli mi (ilçenin ALTI ise evet)
      maskeli: 1 > (ayar.ilceKademesi ?? 2),
      // Daha aşağı inilemez mi
      yaprak: derin <= 1,
      ...ulkeHaritasi,
      alt: gomulu(kademeler[1], 2),
    }),
  )
  yazilan++

  // 2..derin kademeler: her üst bölge için bir dosya
  for (let n = 2; n <= derin; n++) {
    if (n === gomulenKademe) break // bu kademe üstüne gömüldü, ayrı dosya yok
    for (const ust of kademeler[n - 1]) {
      const cocuklar = eslesme[n].get(ust.kod) ?? []
      if (!cocuklar.length) continue
      const g = altHaritasiCiz(cocuklar)
      if (!g?.parcalar?.length) continue
      await writeFile(
        path.join(klasor, `${zincir.get(ust.kod)}.json`),
        JSON.stringify({
          ad: ust.ad,
          kademe: n,
          kademeAdi: ayar.kademeAdlari?.[n] ?? 'Bölgeler',
          maskeli: n > (ayar.ilceKademesi ?? 2),
          yaprak: n >= derin,
          parcalar: g.parcalar,
          bolgeler: g.bolgeler,
          alt: gomulu(cocuklar, n + 1),
        }),
      )
      yazilan++
    }
  }

  /**
   * GERÇEK SAYILAR
   * geoBoundaries'in meta verisindeki birim sayıları indirilen dosyayla
   * uyuşmuyor (Türkiye meta'da 999 ilçe diyor, dosyada 973 var). Denetimin
   * doğru referansı meta değil, İNDİRİLEN DOSYA olmalı — buradan yazıyoruz.
   */
  const kaynakSayilari = {}
  for (let n = 1; n <= derin; n++) kaynakSayilari[n] = kademeler[n].length

  return { dosya: yazilan, derin, gomulenKademe, kopyaKademe, kaynakSayilari }
}


/* ---------------------------------------------------------------- TOPLU DERİN ÜRETİM */

/**
 * Dünyanın tamamını, her ülkenin kendi kademe derinliğine kadar üretir.
 *
 * Kademe sayısı ve kademe adları `kademeler.json` sözlüğünden gelir; sözlükte
 * olmayan ülkeler için envanterdeki derinlik kullanılır ve genel ad yazılır.
 */
async function derinHepsiUret() {
  const dunya = JSON.parse(await readFile(path.join(CIKTI, 'dunya.json'), 'utf8'))
  const envanter = JSON.parse(await readFile(path.join(CIKTI, 'envanter.json'), 'utf8'))
  let sozluk = {}
  try {
    sozluk = JSON.parse(await readFile(path.join(CIKTI, 'kademeler.json'), 'utf8'))
  } catch {
    console.log('  (kademeler.json yok — genel adlar kullanılacak)')
  }

  const isoListesi = [...new Set(dunya.bolgeler.map((b) => b.kod))].filter((k) =>
    /^[A-Z]{3}$/.test(k),
  )
  console.log(`TOPLU DERİN ÜRETİM — ${isoListesi.length} ülke\n`)

  const basla = Date.now()
  let toplamDosya = 0
  const ozet = {}
  const uyarilar = []
  const kopyaElenen = []

  for (let i = 0; i < isoListesi.length; i++) {
    const iso = isoListesi[i]
    const s = sozluk[iso]
    const onEk = `[${String(i + 1).padStart(3)}/${isoListesi.length}] ${iso}`

    // Kademe adları: sözlükteki çoğul adlar
    const kademeAdlari = {}
    for (const [n, v] of Object.entries(s?.adlar ?? {})) kademeAdlari[Number(n)] = v.cogul

    try {
      const r = await ulkeyiDerinUret(iso, {
        enFazlaKademe: s?.enFazlaKademe ?? envanter[iso]?.enDerin ?? 4,
        kademeAdlari,
        ilceKademesi: s?.ilceKademesi ?? 2,
        gomme: true,
        gommeTavani: 15,
      })
      toplamDosya += r.dosya
      ozet[iso] = { derin: r.derin, kaynak: r.kaynakSayilari, gomulen: r.gomulenKademe, kopya: r.kopyaKademe }
      if (r.kopyaKademe) kopyaElenen.push(`${iso} k${r.kopyaKademe}`)
      if (!r.dosya) uyarilar.push(`${iso}: ${r.uyari ?? 'dosya üretilmedi'}`)
      const dk = ((Date.now() - basla) / 60000).toFixed(1)
      console.log(
        `${onEk}  ${String(r.dosya).padStart(4)} dosya · ${r.derin} kademe · gömülen: ${r.gomulenKademe ?? 'yok'}${r.kopyaKademe ? ` · kopya k${r.kopyaKademe} elendi` : ''}  (${dk} dk)`,
      )
    } catch (e) {
      uyarilar.push(`${iso}: ${e.message}`)
      console.log(`${onEk}  atlandı — ${e.message}`)
    }
  }

  await writeFile(path.join(CIKTI, 'uretim-ozeti.json'), JSON.stringify(ozet))

  const dk = ((Date.now() - basla) / 60000).toFixed(1)
  console.log('\n' + '\u2501'.repeat(58))
  console.log(`BİTTİ — ${toplamDosya.toLocaleString('tr-TR')} dosya · ${dk} dakika`)
  console.log(`  Cloudflare limiti 20.000 → ${toplamDosya <= 20000 ? '\u2713 sığıyor' : '\u2717 AŞIYOR'}`)
  if (kopyaElenen.length)
    console.log(`\n  kopya kademe elenen ${kopyaElenen.length} ülke: ${kopyaElenen.join(', ')}`)
  if (uyarilar.length) {
    console.log(`\n\u26a0\ufe0f ${uyarilar.length} UYARI`)
    for (const u of uyarilar) console.log('  ' + u)
  }
}

/* ---------------------------------------------------------------- ÇALIŞTIR */

const [, , komut, a1, a2] = process.argv

try {
  if (komut === 'dunya') await dunyaUret(a1 ? Number(a1) : undefined)
  else if (komut === 'ulke') await ulkeUret(a1 ?? 'TUR')
  else if (komut === 'il') await ilUret(a1 ?? 'TUR', a2 ?? 'Manisa')
  else if (komut === 'hepsi') await hepsiniUret()
  else if (komut === 'ulkeler') await ulkeleriYenile()
  else if (komut === 'derin-hepsi') await derinHepsiUret()
  else if (komut === 'derin') {
    const iso = a1 ?? 'ITA'
    const enFazla = a2 ? Number(a2) : 4
    console.log(`DERİN ÜRETİM: ${iso} (en fazla ${enFazla} kademe)`)
    const r = await ulkeyiDerinUret(iso, { enFazlaKademe: enFazla, gomme: true })
    console.log(
      `  ${r.dosya} dosya · ${r.derin} kademe · gömülen kademe: ${r.gomulenKademe ?? 'yok'}`,
    )
  }
  else {
    console.log('Kullanım:')
    console.log('  node scripts/izgara-uret.mjs dunya [hedefNokta]')
    console.log('  node scripts/izgara-uret.mjs ulke TUR')
    console.log('  node scripts/izgara-uret.mjs il TUR Manisa')
    console.log('  node scripts/izgara-uret.mjs ulkeler   ← tüm ülke haritaları (ilçeler kalır)')
    console.log('  node scripts/izgara-uret.mjs derin TUR  ← tek ülke, tam derinlik')
    console.log('  node scripts/izgara-uret.mjs derin-hepsi ← dünyanın tamamı, tam derinlik')
    process.exit(1)
  }
} catch (e) {
  console.error('HATA:', e.message)
  process.exit(1)
}
