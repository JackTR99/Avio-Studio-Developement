/**
 * IZGARA DENETİMİ
 * Üretilen tüm harita dosyalarını tarar ve sorunları listeler.
 *
 * Aradıkları:
 *  1. Bozuk en-boy oranı — uzak adalar/toprakları yüzünden harita ezilmiş (ABD, Fransa)
 *  2. Çok az nokta — harita neredeyse boş
 *  3. Görünmez bölge — 0-2 nokta almış, haritada seçilemez
 *  4. Eksik kırılım — ülkenin il haritası var ama hiç ilçe haritası yok
 *  5. Şüpheli seviye — ADM1'de çok az bölge (o ülkede "il" başka anlama geliyor olabilir)
 *
 * Kullanım: node scripts/izgara-denetle.mjs
 */

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const KLASOR = path.join(process.cwd(), 'public', 'izgara')

const dosyalar = (await readdir(KLASOR)).filter((d) => d.endsWith('.json') && d !== 'liste.json')

const ulkeDosyalari = dosyalar.filter((d) => /^[A-Z]{3}\.json$/.test(d))
const ilDosyalari = dosyalar.filter((d) => /^[A-Z]{3}-/.test(d))

const sorunlar = {
  oran: [],
  azNokta: [],
  gorunmezBolge: [],
  ilceYok: [],
  supheliSeviye: [],
}

async function oku(d) {
  return JSON.parse(await readFile(path.join(KLASOR, d), 'utf8'))
}

/* --- Ülke (il) haritaları --- */
for (const d of ulkeDosyalari) {
  const v = await oku(d)
  const iso = d.replace('.json', '')
  const oran = v.sutun / v.satir

  // 1. Bozuk oran: 4'ten geniş veya 0.25'ten dar = harita ezilmiş
  if (oran > 4 || oran < 0.25)
    sorunlar.oran.push({ dosya: d, oran: oran.toFixed(1), sutun: v.sutun, satir: v.satir })

  // 2. Çok az nokta
  if (v.noktalar.length < 120)
    sorunlar.azNokta.push({ dosya: d, nokta: v.noktalar.length, bolge: v.bolgeler.length })

  // 3. Görünmez bölgeler
  const say = {}
  for (const [, , bi] of v.noktalar) say[bi] = (say[bi] ?? 0) + 1
  const gorunmez = v.bolgeler.filter((_, i) => (say[i] ?? 0) <= 2).length
  if (gorunmez > 0)
    sorunlar.gorunmezBolge.push({
      dosya: d,
      gorunmez,
      toplam: v.bolgeler.length,
      yuzde: Math.round((gorunmez / v.bolgeler.length) * 100),
    })

  // 4. İlçe haritası hiç yok
  const ilceSayisi = ilDosyalari.filter((x) => x.startsWith(iso + '-')).length
  if (ilceSayisi === 0) sorunlar.ilceYok.push({ iso, il: v.bolgeler.length })

  // 5. Şüpheli seviye: 3'ten az bölge
  if (v.bolgeler.length < 3)
    sorunlar.supheliSeviye.push({ dosya: d, bolge: v.bolgeler.length, adlar: v.bolgeler.map((b) => b.ad) })
}

/* --- İl (ilçe) haritaları --- */
let ilceOranSorunu = 0
let ilceAzNokta = 0
for (const d of ilDosyalari) {
  const v = await oku(d)
  const oran = v.sutun / v.satir
  if (oran > 4 || oran < 0.25) ilceOranSorunu++
  if (v.noktalar.length < 60) ilceAzNokta++
}

/* --- RAPOR --- */
const yaz = (b) => console.log('\n' + '━'.repeat(60) + '\n' + b + '\n' + '━'.repeat(60))

console.log(`TOPLAM: ${ulkeDosyalari.length} ülke haritası · ${ilDosyalari.length} il haritası`)

yaz('1. BOZUK EN-BOY ORANI (uzak topraklar haritayı eziyor)')
sorunlar.oran
  .sort((a, b) => b.oran - a.oran)
  .slice(0, 20)
  .forEach((s) => console.log(`  ${s.dosya.padEnd(12)} oran ${s.oran}  (${s.sutun}×${s.satir})`))
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
sorunlar.supheliSeviye.slice(0, 15).forEach((s) =>
  console.log(`  ${s.dosya.padEnd(12)} ${s.bolge} bölge: ${s.adlar.join(', ').slice(0, 50)}`),
)
console.log(`  → toplam ${sorunlar.supheliSeviye.length} ülke`)
