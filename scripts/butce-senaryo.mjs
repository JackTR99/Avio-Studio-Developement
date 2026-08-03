/**
 * DOSYA BÜTÇESİ
 *
 * Üretim öncesi kaç dosya çıkacağını tahmin eder. Cloudflare bedava planında
 * bir site en fazla 20.000 statik dosya taşıyabiliyor.
 *
 * Hesaba giren üç şey:
 *  1. Ülkenin kaç kademesi var (envanter)
 *  2. Kademe sözlüğündeki kısıtlar (kadastro/kopya kademeler gösterilmiyor)
 *  3. Gömme tavanı — üst dosyaya çok ızgara girecekse gömme yapılmaz
 *
 * Kullanım: node scripts/butce-senaryo.mjs [gommeTavani]
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'

const K = path.join(process.cwd(), 'public', 'izgara')
const envanter = JSON.parse(await readFile(path.join(K, 'envanter.json'), 'utf8'))
const sozluk = JSON.parse(await readFile(path.join(K, 'kademeler.json'), 'utf8'))

const LIMIT = 20000
const ABD_ZCTA = 3233 // her county için bir posta kodu haritası
const ABD_MAHALLE = 8 // şehir başına bir dosya

function hesapla(iso, v, gommeTavani) {
  const kisit = sozluk[iso]?.enFazlaKademe ?? 4
  const derin = Math.min(v.enDerin, kisit)
  if (derin < 1) return { dosya: 0, izgara: 0, gomme: false }

  let ayri = 1
  for (let n = 2; n <= derin; n++) ayri += v.kademe['ADM' + (n - 1)] ?? 0
  if (derin < 2) return { dosya: ayri, izgara: 1, gomme: false }

  const alt = v.kademe['ADM' + derin] ?? 0
  const ust = v.kademe['ADM' + (derin - 1)] ?? 1
  const izgara = alt / Math.max(1, ust)
  const gomulu = Math.max(1, ayri - (v.kademe['ADM' + (derin - 1)] ?? 0))

  return izgara <= gommeTavani
    ? { dosya: gomulu, izgara, gomme: true }
    : { dosya: ayri, izgara, gomme: false }
}

const tavan = Number(process.argv[2] ?? 15)
let toplam = 1
let gommeSayisi = 0
let enBuyukIzgara = 0
const liste = []

for (const [iso, v] of Object.entries(envanter)) {
  const r = hesapla(iso, v, tavan)
  toplam += r.dosya
  if (r.gomme) {
    gommeSayisi++
    enBuyukIzgara = Math.max(enBuyukIzgara, r.izgara)
  }
  liste.push({ iso, ad: v.ad, ...r, kisit: sozluk[iso]?.enFazlaKademe })
}

const abd = ABD_ZCTA + ABD_MAHALLE
const genelToplam = toplam + abd

console.log(`GÖMME TAVANI: ${tavan} ızgara (≈${tavan * 28} KB)\n`)
console.log(`  geoBoundaries katmanları : ${toplam.toLocaleString('tr-TR')}`)
console.log(`  ABD posta kodu + mahalle : ${abd.toLocaleString('tr-TR')}`)
console.log(`  ─────────────────────────────────────`)
console.log(`  TOPLAM                   : ${genelToplam.toLocaleString('tr-TR')}`)
console.log(`  Cloudflare bedava limiti : ${LIMIT.toLocaleString('tr-TR')}`)
console.log(
  `  DURUM: ${genelToplam <= LIMIT ? '✓ SIĞIYOR' : '✗ AŞIYOR'}   marj: ${(LIMIT - genelToplam).toLocaleString('tr-TR')}`,
)
console.log(
  `\n  gömme yapılan ülke: ${gommeSayisi} · en dolu gömülü dosya ≈ ${Math.round(enBuyukIzgara * 28)} KB`,
)

console.log('\nEN ÇOK DOSYA ÜRETEN 12 ÜLKE')
liste
  .sort((a, b) => b.dosya - a.dosya)
  .slice(0, 12)
  .forEach((o) =>
    console.log(
      `  ${o.iso}  ${String(o.dosya).padStart(5)} dosya  ${o.gomme ? 'gömülü' : 'ayrı  '}  ${o.kisit ? `kademe≤${o.kisit}  ` : '          '}${o.ad}`,
    ),
  )
