/**
 * ŞEHİR MAHALLE KATMANI
 *
 * Şehir içi bölgeler (Upper East Side, Montparnasse, Milano'nun NIL'leri)
 * RESMİ İDARİ BİRİM DEĞİL — bu yüzden geoBoundaries'te yoklar. Her büyük
 * şehrin kendi açık veri portalında duruyorlar, formatları ve lisansları ayrı.
 *
 * Bu script onları indirir ve mevcut harita zincirinin doğru yerine bağlar.
 * Her kaynağın lisansı tek tek doğrulandı; doğrulanamayan eklenmedi.
 *
 * Kullanım:
 *   node scripts/sehir-mahalle.mjs            → hepsi
 *   node scripts/sehir-mahalle.mjs Paris      → tek şehir
 */

import { writeFile, readFile, mkdir, access } from 'node:fs/promises'
import path from 'node:path'

const CIKTI = path.join(process.cwd(), 'public', 'izgara')
const GECICI = path.join(process.cwd(), '.gecici-sehir')
const HEDEF_NOKTA = 3500

/**
 * ŞEHİR TANIMLARI
 *
 * hedefDosya : mahallelerin bağlanacağı üst haritanın dosyası
 * ustBolgeAd : o dosyadaki hangi bölgenin altına gelecek
 * gomulude   : üst bölge, dosyanın gömülü `alt` paketinde mi duruyor
 * uzerineYaz : ABD'de county'nin posta kodu haritası zaten var; mahalle
 *              verisi varsa onun yerine mahalle gösterilir ("Upper East Side"
 *              "10021"den anlamlıdır)
 */
const SEHIRLER = [
  {
    ad: 'New York',
    url: 'https://data.cityofnewyork.us/api/geospatial/9nt8-h7nd?method=export&format=GeoJSON',
    isimAlani: ['ntaname', 'NTAName'],
    hedefDosya: 'USA/new-york.json',
    // NYC verisi 5 borough'u birden içerir; her borough ayrı bir county'dir.
    // `boroname` alanına göre bölünüp doğru county'ye bağlanır.
    ayirAlani: 'boroname',
    ayirEsleme: {
      Manhattan: 'New York',
      Brooklyn: 'Kings',
      Queens: 'Queens',
      Bronx: 'Bronx',
      'Staten Island': 'Richmond',
    },
    kademeAdi: 'Mahalleler',
    lisans: 'NYC Open Data — kısıtlama yok',
    uzerineYaz: true,
  },
  {
    ad: 'Los Angeles',
    url: 'https://maps.lacity.org/lahub/rest/services/Boundaries/MapServer/18/query?where=1%3D1&outFields=*&f=geojson',
    isimAlani: ['NAME', 'Name'],
    hedefDosya: 'USA/california.json',
    ustBolgeAd: 'Los Angeles',
    kademeAdi: 'Mahalle Konseyleri',
    lisans: 'CC BY 4.0 — City of Los Angeles GeoHub',
    uzerineYaz: true,
  },
  {
    ad: 'Boston',
    url: 'https://gis.bostonplans.org/hosting/rest/services/Hosted/Boston_Neighborhood_Boundaries/FeatureServer/5/query?where=1%3D1&outFields=*&outSR=4326&f=geojson',
    isimAlani: ['name', 'Name'],
    hedefDosya: 'USA/massachusetts.json',
    ustBolgeAd: 'Suffolk',
    kademeAdi: 'Mahalleler',
    lisans: 'ODC PDDL v1.0 — kamu malı',
    uzerineYaz: true,
  },
  {
    ad: 'Paris',
    url: 'https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/quartier_paris/exports/geojson',
    isimAlani: ['l_qu', 'nom_quartier'],
    hedefDosya: 'FRA/ile-de-france--paris.json',
    ustBolgeAd: 'Paris',
    kademeAdi: 'Semtler',
    lisans: 'ODbL v1.0 — Ville de Paris (share-alike: üretilen dosyalar da ODbL)',
    odbl: true,
  },
  {
    ad: 'Milano',
    url: 'https://dati.comune.milano.it/dataset/e8e765fc-d882-40b8-95d8-16ff3d39eb7c/resource/9c4e0776-56fc-4f3d-8a90-f4992a3be426/download/ds964_nil_wm.geojson',
    isimAlani: ['NIL', 'nil'],
    hedefDosya: 'ITA/nord-ovest--lombardia.json',
    ustBolgeAd: 'Milano',
    gomulude: true,
    kademeAdi: 'Semtler (NIL)',
    lisans: 'CC BY 4.0 — Comune di Milano',
  },
  {
    ad: 'Roma',
    url: 'https://geoportale.comune.roma.it/geoserver/ows?service=WFS&version=2.0.0&request=GetFeature&typeNames=DIPPC:municipi&outputFormat=application/json&srsName=EPSG:4326',
    // Roma'nın municipio'larının özel adı yok, sadece Roma rakamıyla numara
    isimAlani: ['numero_rom', 'municipio'],
    isimOnEki: 'Municipio ',
    hedefDosya: 'ITA/centro--lazio.json',
    ustBolgeAd: 'Roma',
    gomulude: true,
    kademeAdi: 'Municipio’lar',
    lisans: 'CC BY 4.0 — Roma Capitale',
  },
  {
    ad: 'Madrid',
    url: 'https://sigma.madrid.es/hosted/rest/services/CARTOGRAFIA/LIMITES_ADMINISTRATIVOS/MapServer/25/query?where=1%3D1&outFields=*&f=geojson',
    isimAlani: ['NOMBRE', 'nombre'],
    hedefDosya: 'ESP/comunidad-de-madrid.json',
    ustBolgeAd: 'Madrid',
    gomulude: true,
    kademeAdi: 'Mahalleler',
    lisans: 'Ayuntamiento de Madrid — açık veri',
  },
  {
    ad: 'Barselona',
    url: 'https://raw.githubusercontent.com/martgnz/bcn-geodata/master/barris/barris.geojson',
    isimAlani: ['NOM', 'nom'],
    hedefDosya: 'ESP/cataluna-catalunya.json',
    ustBolgeAd: 'Barcelona',
    gomulude: true,
    kademeAdi: 'Mahalleler',
    lisans: 'CC BY 4.0 — Ajuntament de Barcelona',
  },
  {
    ad: 'Berlin',
    url: 'https://gdi.berlin.de/services/wfs/alkis_ortsteile?service=WFS&version=2.0.0&request=GetFeature&typeNames=alkis_ortsteile:ortsteile&outputFormat=application/json&srsName=EPSG:4326',
    isimAlani: ['nam', 'name'],
    hedefDosya: 'DEU/berlin.json',
    ustBolgeAd: 'Berlin',
    gomulude: true,
    kademeAdi: 'Semtler',
    lisans: 'Datenlizenz Deutschland Zero 2.0 — kamu malı',
  },
  {
    ad: 'Amsterdam',
    url: 'https://api.data.amsterdam.nl/v1/gebieden/wijken/?_format=geojson&_pageSize=500',
    isimAlani: ['naam', 'name'],
    hedefDosya: 'NLD/ulke.json',
    ustBolgeAd: 'Amsterdam',
    kabulBasligi: 'application/geo+json',
    gomulude: true,
    kademeAdi: 'Mahalleler',
    lisans: 'CC0 1.0 — Gemeente Amsterdam',
  },
  {
    ad: 'Viyana',
    url: 'https://data.wien.gv.at/daten/geo?service=WFS&request=GetFeature&version=1.1.0&typeName=ogdwien:BEZIRKSGRENZEOGD&srsName=EPSG:4326&outputFormat=json',
    isimAlani: ['NAMEK', 'NAMEG'],
    hedefDosya: 'AUT/wien.json',
    ustBolgeAd: 'Wien',
    gomulude: true,
    kademeAdi: 'Bezirk’ler',
    lisans: 'CC BY 4.0 — Stadt Wien',
  },
]

/* --------------------------------------------------------------- GEOMETRİ */

function halkaIcinde(x, y, h) {
  let i2 = false
  for (let i = 0, j = h.length - 1; i < h.length; j = i++) {
    const [xi, yi] = h[i]
    const [xj, yj] = h[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) i2 = !i2
  }
  return i2
}
function poligonIcinde(x, y, p) {
  if (!halkaIcinde(x, y, p[0])) return false
  for (let i = 1; i < p.length; i++) if (halkaIcinde(x, y, p[i])) return false
  return true
}
function sinirKutusu(pol) {
  let a = Infinity,
    b = Infinity,
    c = -Infinity,
    d = -Infinity
  for (const p of pol)
    for (const [x, y] of p[0]) {
      if (x < a) a = x
      if (x > c) c = x
      if (y < b) b = y
      if (y > d) d = y
    }
  return [a, b, c, d]
}
function icNokta(b) {
  const [x1, y1, x2, y2] = b.kutu
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  for (const p of b.poligonlar) if (poligonIcinde(mx, my, p)) return [mx, my]
  for (const n of [3, 5, 9]) {
    const dx = (x2 - x1) / (n + 1)
    const dy = (y2 - y1) / (n + 1)
    for (let i = 1; i <= n; i++)
      for (let j = 1; j <= n; j++) {
        const x = x1 + i * dx
        const y = y1 + j * dy
        for (const p of b.poligonlar) if (poligonIcinde(x, y, p)) return [x, y]
      }
  }
  return [mx, my]
}

function izgaraCiz(bolgeler, hedef, kutu, adimElle) {
  const [x1, y1, x2, y2] = kutu
  let adim = adimElle ?? Math.sqrt(((x2 - x1) * (y2 - y1) * 0.6) / hedef)
  adim = Number(adim.toFixed(6))
  const sutun = Math.ceil((x2 - x1) / adim)
  const satir = Math.ceil((y2 - y1) / adim)
  const noktalar = []
  const kullanilan = new Map()

  for (let sy = 0; sy < satir; sy++) {
    const y = y2 - (sy + 0.5) * adim
    for (let sx = 0; sx < sutun; sx++) {
      const x = x1 + (sx + 0.5) * adim
      for (const b of bolgeler) {
        const [bx1, by1, bx2, by2] = b.kutu
        if (x < bx1 || x > bx2 || y < by1 || y > by2) continue
        let ic = false
        for (const p of b.poligonlar)
          if (poligonIcinde(x, y, p)) {
            ic = true
            break
          }
        if (!ic) continue
        if (!kullanilan.has(b.kod)) kullanilan.set(b.kod, { i: kullanilan.size, ad: b.ad })
        noktalar.push([sx, sy, kullanilan.get(b.kod).i])
        break
      }
    }
  }

  const sahip = new Map()
  noktalar.forEach(([sx, sy], i) => sahip.set(sy * sutun + sx, i))
  for (const b of bolgeler) {
    if (kullanilan.has(b.kod)) continue
    const [ix, iy] = icNokta(b)
    const sx = Math.min(sutun - 1, Math.max(0, Math.floor((ix - x1) / adim)))
    const sy = Math.min(satir - 1, Math.max(0, Math.floor((y2 - iy) / adim)))
    kullanilan.set(b.kod, { i: kullanilan.size, ad: b.ad })
    const a = sy * sutun + sx
    const e = sahip.get(a)
    if (e !== undefined) noktalar[e] = [sx, sy, kullanilan.get(b.kod).i]
    else {
      sahip.set(a, noktalar.length)
      noktalar.push([sx, sy, kullanilan.get(b.kod).i])
    }
  }

  return {
    adim,
    sutun,
    satir,
    noktalar,
    bolgeler: [...kullanilan.entries()].map(([kod, v]) => ({ kod, ad: v.ad })),
  }
}

function izgaraCizHedefli(bolgeler, hedef, kutu) {
  let t = izgaraCiz(bolgeler, hedef, kutu)
  for (let d = 0; d < 4; d++) {
    const n = t.noktalar.length
    if (n >= hedef * 0.65 && n <= hedef * 1.6) break
    const oran = Math.max(0.3, Math.min(3, Math.sqrt(Math.max(1, n) / hedef)))
    const yeni = t.adim * oran
    if (Math.ceil((kutu[2] - kutu[0]) / yeni) > 700) break
    t = izgaraCiz(bolgeler, hedef, kutu, yeni)
  }
  return t
}

function slug(s) {
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

async function varMi(y) {
  try {
    await access(y)
    return true
  } catch {
    return false
  }
}

/** GeoJSON indir (önbellekli) */
async function geoAl(s) {
  const dosya = path.join(GECICI, slug(s.ad) + '.geojson')
  if (await varMi(dosya)) return JSON.parse(await readFile(dosya, 'utf8'))
  const c = await fetch(s.url, { headers: { accept: s.kabulBasligi ?? 'application/json' } })
  if (!c.ok) throw new Error(`HTTP ${c.status}`)
  const metin = await c.text()
  let gj
  try {
    gj = JSON.parse(metin)
  } catch {
    throw new Error('JSON değil (ilk 80: ' + metin.slice(0, 80).replace(/\s+/g, ' ') + ')')
  }
  if (!gj.features?.length) throw new Error('features boş')
  await writeFile(dosya, JSON.stringify(gj))
  return gj
}

function bolgeleriHazirla(gj, isimAlanlari, onEk = '') {
  const r = []
  for (const f of gj.features) {
    const g = f.geometry
    if (!g) continue
    const pol =
      g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : null
    if (!pol) continue
    const p = f.properties ?? {}
    const ad = isimAlanlari.map((a) => p[a]).find((x) => x != null && String(x).trim())
    if (!ad) continue
    r.push({
      ad: onEk + String(ad).replace(/\s+/g, ' ').trim(),
      kod: String(p.id ?? p.OBJECTID ?? ad),
      poligonlar: pol,
      kutu: sinirKutusu(pol),
    })
  }
  return r
}

/* ------------------------------------------------------------------- AKIŞ */

await mkdir(GECICI, { recursive: true })
const secili = process.argv[2]
const liste = secili ? SEHIRLER.filter((s) => slug(s.ad) === slug(secili)) : SEHIRLER

console.log('ŞEHİR MAHALLE KATMANI\n')
const basarili = []
const basarisiz = []

for (const s of liste) {
  process.stdout.write(`  ${s.ad.padEnd(14)}`)
  try {
    const gj = await geoAl(s)
    const mahalleler = bolgeleriHazirla(gj, s.isimAlani, s.isimOnEki ?? '')
    if (!mahalleler.length) throw new Error('isim alanı eşleşmedi')

    const hedefYol = path.join(CIKTI, s.hedefDosya)
    if (!(await varMi(hedefYol))) throw new Error(`hedef yok: ${s.hedefDosya}`)
    const hedef = JSON.parse(await readFile(hedefYol, 'utf8'))

    /* ÇOKLU BÖLGE: tek veri seti birden çok üst bölgeye bölünür (NYC → 5 borough) */
    if (s.ayirAlani) {
      const gruplar = new Map()
      for (const f of gj.features) {
        const g = String(f.properties?.[s.ayirAlani] ?? '')
        const hedefAd = s.ayirEsleme?.[g] ?? g
        if (!gruplar.has(hedefAd)) gruplar.set(hedefAd, [])
        gruplar.get(hedefAd).push(f)
      }
      const hedefYol2 = path.join(CIKTI, s.hedefDosya)
      const hedef2 = JSON.parse(await readFile(hedefYol2, 'utf8'))
      const klasor2 = s.hedefDosya.split('/')[0]
      const taban2 = s.hedefDosya.split('/')[1].replace('.json', '')
      let toplam = 0
      const parcalar = []

      for (const [hedefAd, ozellikler] of gruplar) {
        const ust = hedef2.bolgeler.find((x) => x.ad === hedefAd)
        if (!ust) continue
        const mh = bolgeleriHazirla({ features: ozellikler }, s.isimAlani, s.isimOnEki ?? '')
        if (!mh.length) continue
        const kt = mh.reduce(
          (a, m) => [
            Math.min(a[0], m.kutu[0]),
            Math.min(a[1], m.kutu[1]),
            Math.max(a[2], m.kutu[2]),
            Math.max(a[3], m.kutu[3]),
          ],
          [Infinity, Infinity, -Infinity, -Infinity],
        )
        const tt = izgaraCizHedefli(mh, HEDEF_NOKTA, kt)
        await writeFile(
          path.join(CIKTI, klasor2, `${taban2}--${slug(ust.ad)}.json`),
          JSON.stringify({
            ad: ust.ad,
            kademe: hedef2.kademe + 1,
            kademeAdi: s.kademeAdi,
            maskeli: true,
            yaprak: true,
            kaynak: s.lisans,
            parcalar: [{ ad: null, sutun: tt.sutun, satir: tt.satir, noktalar: tt.noktalar }],
            bolgeler: tt.bolgeler,
          }),
        )
        toplam += tt.bolgeler.length
        parcalar.push(`${ust.ad}:${tt.bolgeler.length}`)
      }
      hedef2.yaprak = false
      await writeFile(hedefYol2, JSON.stringify(hedef2))
      console.log(`✓ ${String(toplam).padStart(4)} bölge → ${parcalar.join(' · ')}`)
      basarili.push({ ad: s.ad, adet: toplam, dosya: `${klasor2}/${taban2}--*`, lisans: s.lisans })
      continue
    }

    // Üst bölgeyi bul (dosyada ya da gömülü pakette)
    let ustBolge = null
    let gomuluKap = null
    const adlar = [s.ustBolgeAd]
    let gomuluUstKod = null
    if (s.gomulude) {
      for (const kod of Object.keys(hedef.alt ?? {})) {
        const b = hedef.alt[kod].bolgeler?.find((x) => adlar.includes(x.ad))
        if (b) {
          ustBolge = b
          gomuluKap = hedef.alt[kod]
          gomuluUstKod = kod
          break
        }
      }
    } else {
      ustBolge = hedef.bolgeler.find((x) => adlar.includes(x.ad))
    }
    if (!ustBolge) throw new Error(`üst bölge bulunamadı: ${adlar.join('/')}`)

    // Izgarayı çiz
    const kutu = mahalleler.reduce(
      (a, m) => [
        Math.min(a[0], m.kutu[0]),
        Math.min(a[1], m.kutu[1]),
        Math.max(a[2], m.kutu[2]),
        Math.max(a[3], m.kutu[3]),
      ],
      [Infinity, Infinity, -Infinity, -Infinity],
    )
    if (!Number.isFinite(kutu[0]) || kutu[2] - kutu[0] > 30) throw new Error('sınır kutusu bozuk')
    const t = izgaraCizHedefli(mahalleler, HEDEF_NOKTA, kutu)

    // Dosya adı: hedefin zinciri + üst bölgenin slug'ı
    const klasor = s.hedefDosya.split('/')[0]
    const taban = s.hedefDosya.split('/')[1].replace('.json', '')
    /**
     * Dosya adı, arayüzün kuracağı zincirle BİREBİR aynı olmalı.
     * Gömülü adım da zincire girer — yoksa dosya bulunamaz.
     * Milano: Lombardia > Milano (il, gömülü) > Milano (belediye) > semtler
     *   → nord-ovest--lombardia--milano--milano.json
     */
    const gomuluUst = gomuluUstKod ? hedef.bolgeler.find((b) => b.kod === gomuluUstKod) : null
    const zincirParcalari = [
      ...(taban === 'ulke' ? [] : [taban]),
      ...(gomuluUst ? [slug(gomuluUst.ad)] : []),
      slug(ustBolge.ad),
    ]
    const dosyaAdi = `${zincirParcalari.join('--')}.json`

    await writeFile(
      path.join(CIKTI, klasor, dosyaAdi),
      JSON.stringify({
        ad: ustBolge.ad,
        kademe: (gomuluKap ? hedef.kademe + 1 : hedef.kademe) + 1,
        kademeAdi: s.kademeAdi,
        maskeli: true, // şehir içi kırılım — gizlilik eşiği her zaman geçerli
        yaprak: true,
        kaynak: s.lisans,
        parcalar: [{ ad: null, sutun: t.sutun, satir: t.satir, noktalar: t.noktalar }],
        bolgeler: t.bolgeler,
      }),
    )

    // Üst bölge artık yaprak değil — altına inilebilir
    if (gomuluKap) gomuluKap.yaprak = false
    else hedef.yaprak = false
    await writeFile(hedefYol, JSON.stringify(hedef))

    console.log(`✓ ${String(t.bolgeler.length).padStart(4)} bölge → ${klasor}/${dosyaAdi}`)
    basarili.push({ ad: s.ad, adet: t.bolgeler.length, dosya: `${klasor}/${dosyaAdi}`, lisans: s.lisans })
  } catch (e) {
    console.log(`✗ ${e.message}`)
    basarisiz.push({ ad: s.ad, sebep: e.message })
  }
}

console.log(`\n${'━'.repeat(58)}`)
console.log(`BAŞARILI: ${basarili.length} şehir · BAŞARISIZ: ${basarisiz.length}`)
if (basarisiz.length) {
  console.log('\nBAŞARISIZ OLANLAR')
  for (const b of basarisiz) console.log(`  ${b.ad.padEnd(14)} ${b.sebep}`)
}
if (basarili.length) {
  console.log('\nLİSANS ATIFLARI (arayüzde gösterilecek)')
  for (const b of basarili) console.log(`  ${b.ad.padEnd(14)} ${b.lisans}`)
}
