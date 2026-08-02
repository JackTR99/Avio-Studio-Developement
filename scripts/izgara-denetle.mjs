/**
 * IZGARA DENETİMİ
 * Üretilen tüm harita dosyalarını tarar ve sorunları listeler.
 *
 * Aradıkları:
 *  1. Bozuk en-boy oranı — uzak topraklar haritayı eziyor (ayrı kutuya alınmalı)
 *  2. Çok az nokta — harita neredeyse boş
 *  3. Görünmez bölge — 0-2 nokta almış, haritada seçilemez
 *  4. Eksik kırılım — ülkenin il haritası var ama hiç ilçe haritası yok
 *  5. Şüpheli seviye — ADM1'de çok az bölge (o ülkede "il" başka anlama geliyor)
 *  6. İLÇE KAYBI — bir önceki üretime göre ilçe sayısı düşmüş
 *
 * Kullanım:
 *   node scripts/izgara-denetle.mjs                 → denetle
 *   node scripts/izgara-denetle.mjs kaydet <yol>    → mevcut sayıları dosyaya yaz
 *   node scripts/izgara-denetle.mjs karsilastir <yol> → o dosyayla karşılaştır
 */

import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const KLASOR = path.join(process.cwd(), 'public', 'izgara')

/** Hem tek parça (eski) hem parçalı (yeni) dosyayı aynı biçimde okur. */
function parcalar(v) {
  return v.parcalar ?? [{ ad: null, sutun: v.sutun, satir: v.satir, noktalar: v.noktalar }]
}

function noktaSayisi(v) {
  return parcalar(v).reduce((t, p) => t + p.noktalar.length, 0)
}

/** Ana parçanın en/boy oranı — kutular oranı bozmaz. */
function anaOran(v) {
  const a = parcalar(v)[0]
  return a.sutun / a.satir
}

const dosyalar = (await readdir(KLASOR)).filter((d) => d.endsWith('.json') && d !== 'liste.json')
const ulkeDosyalari = dosyalar.filter((d) => /^[A-Z]{3}\.json$/.test(d))
const ilDosyalari = dosyalar.filter((d) => /^[A-Z]{3}-/.test(d))

const oku = async (d) => JSON.parse(await readFile(path.join(KLASOR, d), 'utf8'))

/* --- ilçe sayıları (ülke bazında) --- */
const ilceSayilari = {}
let toplamIlce = 0
for (const d of ilDosyalari) {
  const v = await oku(d)
  const iso = d.slice(0, 3)
  ilceSayilari[iso] = (ilceSayilari[iso] ?? 0) + v.bolgeler.length
  toplamIlce += v.bolgeler.length
}

/* --- kaydet / karşılaştır modları --- */
const [, , komut, hedefYol] = process.argv

if (komut === 'kaydet') {
  await writeFile(hedefYol, JSON.stringify(ilceSayilari))
  console.log(`Kaydedildi: ${Object.keys(ilceSayilari).length} ülke, ${toplamIlce} ilçe → ${hedefYol}`)
  process.exit(0)
}

if (komut === 'karsilastir') {
  const eski = JSON.parse(await readFile(hedefYol, 'utf8'))
  const eskiToplam = Object.values(eski).reduce((a, b) => a + b, 0)
  const kazanan = []
  const kaybeden = []
  for (const iso of new Set([...Object.keys(eski), ...Object.keys(ilceSayilari)])) {
    const a = eski[iso] ?? 0
    const b = ilceSayilari[iso] ?? 0
    if (b > a) kazanan.push({ iso, a, b, fark: b - a })
    else if (b < a) kaybeden.push({ iso, a, b, fark: a - b })
  }
  console.log(`ÖNCE : ${eskiToplam} ilçe`)
  console.log(`SONRA: ${toplamIlce} ilçe`)
  console.log(`FARK : ${toplamIlce - eskiToplam > 0 ? '+' : ''}${toplamIlce - eskiToplam}\n`)

  console.log(`KAZANILAN İLÇELER — ${kazanan.length} ülkede eksik ilçe geri geldi`)
  kazanan
    .sort((x, y) => y.fark - x.fark)
    .slice(0, 30)
    .forEach((k) => console.log(`  ${k.iso}  ${k.a} → ${k.b}   (+${k.fark})`))

  if (kaybeden.length) {
    console.log(`\n⚠️ KAYIP — ${kaybeden.length} ülkede ilçe sayısı düştü`)
    kaybeden
      .sort((x, y) => y.fark - x.fark)
      .slice(0, 30)
      .forEach((k) => console.log(`  ${k.iso}  ${k.a} → ${k.b}   (−${k.fark})`))
  }
  process.exit(0)
}

/* --- normal denetim --- */
const sorunlar = { oran: [], azNokta: [], gorunmezBolge: [], ilceYok: [], supheliSeviye: [] }
let parcaliSayisi = 0

for (const d of ulkeDosyalari) {
  const v = await oku(d)
  const iso = d.replace('.json', '')
  const oran = anaOran(v)
  if (v.parcalar && v.parcalar.length > 1) parcaliSayisi++

  if (oran > 4 || oran < 0.25)
    sorunlar.oran.push({ dosya: d, oran: oran.toFixed(1), parca: parcalar(v).length })

  const nokta = noktaSayisi(v)
  if (nokta < 120) sorunlar.azNokta.push({ dosya: d, nokta, bolge: v.bolgeler.length })

  const say = {}
  for (const p of parcalar(v)) for (const [, , bi] of p.noktalar) say[bi] = (say[bi] ?? 0) + 1
  const gorunmez = v.bolgeler.filter((_, i) => (say[i] ?? 0) <= 2).length
  if (gorunmez > 0)
    sorunlar.gorunmezBolge.push({
      dosya: d,
      gorunmez,
      toplam: v.bolgeler.length,
      yuzde: Math.round((gorunmez / v.bolgeler.length) * 100),
    })

  if (!ilceSayilari[iso]) sorunlar.ilceYok.push({ iso, il: v.bolgeler.length })

  if (v.bolgeler.length < 3)
    sorunlar.supheliSeviye.push({ dosya: d, bolge: v.bolgeler.length, adlar: v.bolgeler.map((b) => b.ad) })
}

let ilceOranSorunu = 0
let ilceAzNokta = 0
for (const d of ilDosyalari) {
  const v = await oku(d)
  const oran = anaOran(v)
  if (oran > 4 || oran < 0.25) ilceOranSorunu++
  if (noktaSayisi(v) < 60) ilceAzNokta++
}

const yaz = (b) => console.log('\n' + '━'.repeat(60) + '\n' + b + '\n' + '━'.repeat(60))

console.log(
  `TOPLAM: ${ulkeDosyalari.length} ülke haritası · ${ilDosyalari.length} il haritası · ${toplamIlce} ilçe`,
)
console.log(`        ${parcaliSayisi} ülke uzak toprak kutularıyla çiziliyor`)

yaz('1. BOZUK EN-BOY ORANI (ana harita hâlâ eziliyor)')
sorunlar.oran
  .sort((a, b) => b.oran - a.oran)
  .slice(0, 20)
  .forEach((s) => console.log(`  ${s.dosya.padEnd(12)} oran ${s.oran}  (${s.parca} parça)`))
console.log(`  → ülke haritalarında ${sorunlar.oran.length} adet, il haritalarında ${ilceOranSorunu} adet`)

yaz('2. ÇOK AZ NOKTA (harita neredeyse boş)')
sorunlar.azNokta
  .sort((a, b) => a.nokta - b.nokta)
  .slice(0, 15)
  .forEach((s) => console.log(`  ${s.dosya.padEnd(12)} ${s.nokta} nokta / ${s.bolge} bölge`))
console.log(`  → ülke haritalarında ${sorunlar.azNokta.length} adet, il haritalarında ${ilceAzNokta} adet`)

yaz('3. GÖRÜNMEZ BÖLGELER (2 veya daha az nokta almış)')
sorunlar.gorunmezBolge
  .sort((a, b) => b.yuzde - a.yuzde)
  .slice(0, 15)
  .forEach((s) => console.log(`  ${s.dosya.padEnd(12)} ${s.gorunmez}/${s.toplam} bölge görünmez (%${s.yuzde})`))
console.log(`  → toplam ${sorunlar.gorunmezBolge.length} ülkede sorun var`)

yaz('4. İLÇE HARİTASI HİÇ YOK')
sorunlar.ilceYok.slice(0, 25).forEach((s) => console.log(`  ${s.iso}  (${s.il} il var, ilçe yok)`))
console.log(`  → toplam ${sorunlar.ilceYok.length} ülke`)

yaz('5. ŞÜPHELİ SEVİYE (3’ten az bölge)')
sorunlar.supheliSeviye
  .slice(0, 15)
  .forEach((s) => console.log(`  ${s.dosya.padEnd(12)} ${s.bolge} bölge: ${s.adlar.join(', ').slice(0, 50)}`))
console.log(`  → toplam ${sorunlar.supheliSeviye.length} ülke`)
