/**
 * ABD POSTA KODU KATMANI (ZCTA)
 *
 * ABD'de county'nin altında resmi bir idari kademe yok — "mahalle" resmi
 * birim olmadığı için geoBoundaries county'de biter. Ama posta kodu bölgeleri
 * (ZCTA) tüm ülkeyi kapsar, kamu malıdır ve pazarlamada zaten hedefleme
 * birimidir. Bu script onları county'lerin altına yerleştirir.
 *
 * Kaynak : US Census Bureau, 2020 Cartographic Boundary File (1:500.000)
 *          https://www2.census.gov/geo/tiger/GENZ2020/shp/cb_2020_us_zcta520_500k.zip
 * Lisans : Kamu malı. Census metadatası atıf istiyor:
 *          "These products are free to use in a product or publication,
 *           however acknowledgement must be given to the U.S. Census Bureau
 *           as the source."
 *
 * Kullanım: node scripts/abd-posta-kodu.mjs
 */

import { mkdir, writeFile, readFile, access, readdir } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import * as shapefile from 'shapefile'

const calistir = promisify(execFile)
const CIKTI = path.join(process.cwd(), 'public', 'izgara')
const GECICI = path.join(process.cwd(), '.gecici-abd')

const ZCTA_URL =
  'https://www2.census.gov/geo/tiger/GENZ2020/shp/cb_2020_us_zcta520_500k.zip'
const ADM2_URL =
  'https://github.com/wmgeolab/geoBoundaries/raw/main/releaseData/gbOpen/USA/ADM2/geoBoundaries-USA-ADM2_simplified.geojson'

const HEDEF_NOKTA = 3000

async function varMi(y) {
  try {
    await access(y)
    return true
  } catch {
    return false
  }
}

/* ------------------------------------------------------------------ İNDİR */

async function indir(url, hedef) {
  if (await varMi(hedef)) {
    console.log(`  önbellekten: ${path.basename(hedef)}`)
    return
  }
  console.log(`  indiriliyor: ${path.basename(hedef)}`)
  const c = await fetch(url)
  if (!c.ok) throw new Error(`İndirilemedi (${c.status}): ${url}`)
  await pipeline(c.body, createWriteStream(hedef))
}

/* --------------------------------------------------------------- GEOMETRİ */
/* Üretici scriptteki mantığın aynısı — bu script bağımsız çalışsın diye kopya */

function halkaIcinde(x, y, halka) {
  let icinde = false
  for (let i = 0, j = halka.length - 1; i < halka.length; j = i++) {
    const [xi, yi] = halka[i]
    const [xj, yj] = halka[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) icinde = !icinde
  }
  return icinde
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
  const en = x2 - x1
  const boy = y2 - y1
  let adim = adimElle ?? Math.sqrt((en * boy * 0.5) / hedef)
  adim = Number(adim.toFixed(5))
  const sutun = Math.ceil(en / adim)
  const satir = Math.ceil(boy / adim)

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

  // Küçük bölge garantisi
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

/** Hedefe yaklaşarak çiz */
function izgaraCizHedefli(bolgeler, hedef, kutu) {
  let t = izgaraCiz(bolgeler, hedef, kutu)
  const en = kutu[2] - kutu[0]
  const boy = kutu[3] - kutu[1]
  for (let d = 0; d < 4; d++) {
    const n = t.noktalar.length
    if (n >= hedef * 0.65 && n <= hedef * 1.6) break
    const oran = Math.max(0.3, Math.min(3, Math.sqrt(Math.max(1, n) / hedef)))
    const yeni = t.adim * oran
    if (Math.ceil(en / yeni) > 700 || Math.ceil(boy / yeni) > 700) break
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

/* ------------------------------------------------------------------- AKIŞ */

await mkdir(GECICI, { recursive: true })
console.log('ABD POSTA KODU KATMANI\n')

// 1. Kaynakları indir
const zip = path.join(GECICI, 'zcta.zip')
await indir(ZCTA_URL, zip)
const shpYol = path.join(GECICI, 'cb_2020_us_zcta520_500k.shp')
if (!(await varMi(shpYol))) {
  console.log('  arşiv açılıyor…')
  await calistir('unzip', ['-o', '-q', zip, '-d', GECICI])
}

const adm2Yol = path.join(GECICI, 'usa-adm2.geojson')
await indir(ADM2_URL, adm2Yol)

// 2. County sınırları
const gj = JSON.parse(await readFile(adm2Yol, 'utf8'))
const countyler = []
for (const f of gj.features) {
  const g = f.geometry
  if (!g) continue
  const pol = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : null
  if (!pol) continue
  const p = f.properties ?? {}
  countyler.push({
    ad: String(p.shapeName ?? '?'),
    kod: String(p.shapeID ?? p.shapeName),
    poligonlar: pol,
    kutu: sinirKutusu(pol),
  })
}
console.log(`  ${countyler.length} county yüklendi`)

// 3. ZCTA'ları oku
console.log('  posta kodu bölgeleri okunuyor…')
const zctalar = []
const kaynak = await shapefile.open(shpYol, shpYol.replace('.shp', '.dbf'))
let sonuc = await kaynak.read()
while (!sonuc.done) {
  const f = sonuc.value
  const g = f.geometry
  if (g) {
    const pol =
      g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : null
    if (pol) {
      const kod = String(f.properties?.ZCTA5CE20 ?? '')
      if (kod) zctalar.push({ ad: kod, kod, poligonlar: pol, kutu: sinirKutusu(pol) })
    }
  }
  sonuc = await kaynak.read()
}
console.log(`  ${zctalar.length.toLocaleString('tr-TR')} posta kodu bölgesi okundu`)

// 4. Her ZCTA hangi county'de — iç noktasıyla oylama
console.log('  county eşlemesi yapılıyor…')
const eslesme = new Map()
for (const c of countyler) eslesme.set(c.kod, [])

let esleseMeyen = 0
for (const z of zctalar) {
  const [x1, y1, x2, y2] = z.kutu
  const adaylar = countyler.filter(
    (c) => !(c.kutu[2] < x1 || c.kutu[0] > x2 || c.kutu[3] < y1 || c.kutu[1] > y2),
  )
  if (!adaylar.length) {
    esleseMeyen++
    continue
  }
  if (adaylar.length === 1) {
    eslesme.get(adaylar[0].kod).push(z)
    continue
  }
  // İçinden örneklenen noktalarla oy ver
  const adim = Math.max((x2 - x1) / 5, (y2 - y1) / 5, 1e-6)
  const oy = new Map()
  for (let y = y1 + adim / 2; y < y2; y += adim)
    for (let x = x1 + adim / 2; x < x2; x += adim) {
      let zIc = false
      for (const p of z.poligonlar)
        if (poligonIcinde(x, y, p)) {
          zIc = true
          break
        }
      if (!zIc) continue
      for (const c of adaylar) {
        if (x < c.kutu[0] || x > c.kutu[2] || y < c.kutu[1] || y > c.kutu[3]) continue
        let ic = false
        for (const p of c.poligonlar)
          if (poligonIcinde(x, y, p)) {
            ic = true
            break
          }
        if (ic) {
          oy.set(c.kod, (oy.get(c.kod) ?? 0) + 1)
          break
        }
      }
    }
  if (!oy.size) {
    const [ix, iy] = icNokta(z)
    const c = adaylar.find((a) => a.poligonlar.some((p) => poligonIcinde(ix, iy, p)))
    eslesme.get((c ?? adaylar[0]).kod).push(z)
    continue
  }
  let enIyi = null
  let enCok = -1
  for (const [k, s] of oy)
    if (s > enCok) {
      enCok = s
      enIyi = k
    }
  eslesme.get(enIyi).push(z)
}

const dagitilan = [...eslesme.values()].reduce((t, a) => t + a.length, 0)
console.log(`  ${dagitilan.toLocaleString('tr-TR')} posta kodu county'lere dağıtıldı (${esleseMeyen} eşleşmedi)`)

// 5. Eyalet dosyalarını bul, her county için posta kodu haritası üret
const abdKlasor = path.join(CIKTI, 'USA')
const eyaletDosyalari = (await readdir(abdKlasor)).filter(
  (f) => f.endsWith('.json') && f !== 'ulke.json' && !f.includes('--'),
)

let yazilan = 0
let atlanan = 0
for (const ed of eyaletDosyalari) {
  const yol = path.join(abdKlasor, ed)
  const v = JSON.parse(await readFile(yol, 'utf8'))
  const zincir = ed.replace('.json', '')

  for (const b of v.bolgeler) {
    const liste = eslesme.get(b.kod) ?? []
    if (!liste.length) {
      atlanan++
      continue
    }
    const kutu = liste.reduce(
      (a, z) => [
        Math.min(a[0], z.kutu[0]),
        Math.min(a[1], z.kutu[1]),
        Math.max(a[2], z.kutu[2]),
        Math.max(a[3], z.kutu[3]),
      ],
      [Infinity, Infinity, -Infinity, -Infinity],
    )
    const t = izgaraCizHedefli(liste, HEDEF_NOKTA, kutu)
    await writeFile(
      path.join(abdKlasor, `${zincir}--${slug(b.ad)}.json`),
      JSON.stringify({
        ad: b.ad,
        kademe: 3,
        kademeAdi: 'Posta Kodları',
        maskeli: true, // county'nin altı — gizlilik eşiği geçerli
        yaprak: true,
        kaynak: 'US Census Bureau',
        parcalar: [{ ad: null, sutun: t.sutun, satir: t.satir, noktalar: t.noktalar }],
        bolgeler: t.bolgeler,
      }),
    )
    yazilan++
  }

  // Eyalet dosyasında county'lerin artık alt kademesi olduğunu işaretle
  if (v.yaprak) {
    v.yaprak = false
    await writeFile(yol, JSON.stringify(v))
  }
}

console.log(`\n✓ ${yazilan.toLocaleString('tr-TR')} county için posta kodu haritası yazıldı`)
if (atlanan) console.log(`  ${atlanan} county'ye posta kodu düşmedi`)
console.log(`\nAtıf (zorunlu): "Source: U.S. Census Bureau, 2020 Census TIGER/Line Shapefile"`)
