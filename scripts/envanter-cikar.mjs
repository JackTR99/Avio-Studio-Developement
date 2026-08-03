/**
 * ENVANTER ÇIKARICI
 *
 * geoBoundaries'in meta verisinden her ülkenin kaç idari kademesi olduğunu
 * ve her kademede kaç birim bulunduğunu çıkarır.
 *
 * Neden gerekli: Kademe numaraları (ADM1, ADM2…) her ülkede AYNI ŞEYİ
 * göstermiyor. Türkiye'de ADM1 = il, İtalya'da ADM1 = makro bölge.
 * Bu yüzden hem derinliği hem anlamı bilmek zorundayız.
 *
 * Kullanım: node scripts/envanter-cikar.mjs <meta.csv yolu>
 * Çıktı   : public/izgara/envanter.json
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const CIKTI = path.join(process.cwd(), 'public', 'izgara')

/** Tırnaklı alanları da doğru ayıran basit CSV ayrıştırıcı */
function satiriAyir(s) {
  const alanlar = []
  let gecerli = ''
  let tirnakta = false
  for (const c of s) {
    if (c === '"') tirnakta = !tirnakta
    else if (c === ',' && !tirnakta) {
      alanlar.push(gecerli)
      gecerli = ''
    } else gecerli += c
  }
  alanlar.push(gecerli)
  return alanlar
}

const yol = process.argv[2]
if (!yol) {
  console.error('Kullanım: node scripts/envanter-cikar.mjs <meta.csv yolu>')
  process.exit(1)
}

const ham = await readFile(yol, 'utf8')
const satirlar = ham.split('\n').slice(1).filter(Boolean)

const ulkeler = {}
for (const s of satirlar) {
  const a = satiriAyir(s)
  const iso = a[2]
  const tip = a[4]
  const adet = Number(a[17]) || 0
  const ad = a[1]
  if (!/^[A-Z]{3}$/.test(iso) || !/^ADM[0-4]$/.test(tip)) continue
  ulkeler[iso] ??= { ad, kademe: {} }
  ulkeler[iso].kademe[tip] = adet
}

/* --- Türetilen bilgiler --- */
let toplamDosya = 1 // dunya.json
const ozet = []

for (const [iso, v] of Object.entries(ulkeler)) {
  const seviyeler = [1, 2, 3, 4].filter((n) => v.kademe['ADM' + n] > 0)
  v.enDerin = seviyeler.length ? Math.max(...seviyeler) : 0

  // Dosya sayısı: her kademe için, BİR ÜST kademedeki birim sayısı kadar dosya
  // (dünya→ülkeler zaten dunya.json'da; ülke→ADM1 için ülke başına 1 dosya)
  let dosya = 0
  if (v.enDerin >= 1) dosya += 1 // ISO.json → ADM1 haritası
  for (let n = 2; n <= v.enDerin; n++) dosya += v.kademe['ADM' + (n - 1)] ?? 0

  // A KURALI: en alttaki iki kademe tek dosyada birleşir →
  // en derin kademenin dosyaları üstüne gömülür, o satır düşer
  let dosyaGomulu = dosya
  if (v.enDerin >= 3) dosyaGomulu -= v.kademe['ADM' + (v.enDerin - 1)] ?? 0
  dosyaGomulu = Math.max(1, dosyaGomulu)

  /**
   * GÖMME HER YERDE UYGUN DEĞİL.
   * Gömünce üst dosya, altındaki her birimin ızgarasını da taşır. Çekya'da
   * bir ADM2'ye ortalama 81 ADM3 düşüyor → tek dosya ~2,5 MB olurdu.
   * Ziyaretçi tek tıklama için bunu indirmemeli.
   *
   * Ölçü: gömünce üst dosyaya kaç ızgara girer.
   * Eşiğin üstündeyse o ülkede gömme yapılmaz, ayrı dosya üretilir —
   * dosya sayısı limitinde yer varken boyutu feda etmenin anlamı yok.
   */
  const IZGARA_TAVANI = 20 // ~600 KB
  let izgaraPerDosya = 1
  if (v.enDerin >= 3) {
    const alt = v.kademe['ADM' + (v.enDerin - 1)] ?? 0
    const ust = v.kademe['ADM' + (v.enDerin - 2)] ?? 1
    izgaraPerDosya = 1 + alt / Math.max(1, ust)
  }
  const gommeUygun = v.enDerin >= 3 && izgaraPerDosya <= IZGARA_TAVANI

  v.dosyaAyri = dosya
  v.dosyaGomulu = dosyaGomulu
  v.izgaraPerDosya = Number(izgaraPerDosya.toFixed(1))
  v.gomme = gommeUygun
  v.dosyaSecilen = gommeUygun ? dosyaGomulu : dosya
  toplamDosya += v.dosyaSecilen

  ozet.push({
    iso,
    ad: v.ad,
    enDerin: v.enDerin,
    ayri: dosya,
    gomulu: dosyaGomulu,
    secilen: v.dosyaSecilen,
    izgara: v.izgaraPerDosya,
    gomme: gommeUygun,
  })
}

await mkdir(CIKTI, { recursive: true })
await writeFile(path.join(CIKTI, 'envanter.json'), JSON.stringify(ulkeler, null, 1))

/* --- Rapor --- */
const derinlikDagilimi = {}
for (const v of Object.values(ulkeler)) derinlikDagilimi[v.enDerin] = (derinlikDagilimi[v.enDerin] ?? 0) + 1

const toplamAyri = 1 + ozet.reduce((t, o) => t + o.ayri, 0)

console.log(`ÜLKE SAYISI: ${Object.keys(ulkeler).length}\n`)
console.log('EN DERİN KADEMEYE GÖRE DAĞILIM')
for (const n of [4, 3, 2, 1, 0])
  if (derinlikDagilimi[n]) console.log(`  ADM${n} : ${derinlikDagilimi[n]} ülke`)

const toplamHepsiGomulu = 1 + ozet.reduce((t, o) => t + o.gomulu, 0)
const gommeYapilan = ozet.filter((o) => o.gomme).length
const gommeYapilmayan = ozet.filter((o) => !o.gomme && o.enDerin >= 3).length

console.log('\nDOSYA SAYISI')
console.log(`  gömmesiz (her kademe ayrı)   : ${toplamAyri.toLocaleString('tr-TR')}`)
console.log(`  her yerde gömme              : ${toplamHepsiGomulu.toLocaleString('tr-TR')}  ← ama bazı dosyalar MB'larca olurdu`)
console.log(`  SEÇİLEN (boyut korumalı gömme): ${toplamDosya.toLocaleString('tr-TR')}`)
console.log(`  Cloudflare bedava limiti     : 20.000`)
console.log(
  `  DURUM: ${toplamDosya <= 20000 ? '✓ sığıyor' : '✗ AŞIYOR'}  (marj: ${(20000 - toplamDosya).toLocaleString('tr-TR')})`,
)
console.log(`\n  gömme yapılan ülke: ${gommeYapilan} · gömme iptal (dosya şişerdi): ${gommeYapilmayan}`)

console.log('\nGÖMME İPTAL EDİLENLER (tek dosyaya çok ızgara girerdi)')
ozet
  .filter((o) => !o.gomme && o.enDerin >= 3)
  .sort((a, b) => b.izgara - a.izgara)
  .slice(0, 12)
  .forEach((o) =>
    console.log(
      `  ${o.iso}  gömülse ${String(Math.round(o.izgara)).padStart(4)} ızgara/dosya  → ayrı: ${String(o.ayri).padStart(5)} dosya  ${o.ad}`,
    ),
  )

console.log('\nEN ÇOK DOSYA ÜRETEN 15 ÜLKE (seçilen ayara göre)')
ozet
  .sort((a, b) => b.secilen - a.secilen)
  .slice(0, 15)
  .forEach((o) =>
    console.log(
      `  ${o.iso}  ${String(o.secilen).padStart(5)} dosya  ADM${o.enDerin}  ${o.gomme ? 'gömülü' : 'ayrı  '}  ${o.ad}`,
    ),
  )
