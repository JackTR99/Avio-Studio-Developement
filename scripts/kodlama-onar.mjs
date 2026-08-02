/**
 * TEK SEFERLİK ONARIM — çift kodlanmış bölge adları
 *
 * geoBoundaries'in bazı dosyalarında isimler iki kez UTF-8'e çevrilmiş:
 * "Región" → "RegiÃ³n". Üretilmiş harita dosyalarındaki adları düzeltir.
 * (Üreticiye de aynı düzeltme eklendi; bu script eski dosyalar içindir.)
 */

import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const KLASOR = path.join(process.cwd(), 'public', 'izgara')

// Çift kodlama imzası: latin-1 aralığında bir harf + hemen ardından
// UTF-8 devam baytı görünümünde bir karakter.
const IMZA = /[À-ÿ][-¿]/

function onar(s) {
  if (!IMZA.test(s)) return s
  try {
    const d = Buffer.from(s, 'latin1').toString('utf8')
    return d.includes('�') ? s : d
  } catch {
    return s
  }
}

let dosya = 0
let adet = 0
const ornek = []

for (const f of await readdir(KLASOR)) {
  if (!f.endsWith('.json') || f === 'liste.json') continue
  const yol = path.join(KLASOR, f)
  const v = JSON.parse(await readFile(yol, 'utf8'))
  let degisti = false

  for (const b of v.bolgeler) {
    const y = onar(b.ad)
    if (y !== b.ad) {
      if (ornek.length < 10) ornek.push(`${b.ad}  →  ${y}`)
      b.ad = y
      adet++
      degisti = true
    }
  }
  if (v.ad) {
    const y = onar(v.ad)
    if (y !== v.ad) {
      v.ad = y
      degisti = true
    }
  }
  for (const p of v.parcalar ?? []) {
    if (!p.ad) continue
    const y = onar(p.ad)
    if (y !== p.ad) {
      p.ad = y
      degisti = true
    }
  }

  if (degisti) {
    await writeFile(yol, JSON.stringify(v))
    dosya++
  }
}

console.log(`onarılan dosya: ${dosya}`)
console.log(`onarılan isim : ${adet}`)
for (const x of ornek) console.log('  ' + x)
