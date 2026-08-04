/**
 * TOPLU DERİN ÜRETİM
 *
 * Dünyadaki tüm ülkeleri, her birinin kendi kademe derinliğine kadar üretir.
 * İşi paralel süreçlere böler — tek süreçle saatler sürerdi.
 *
 * Kullanım:
 *   node scripts/derin-hepsi.mjs            → hepsi, 6 paralel
 *   node scripts/derin-hepsi.mjs 4          → 4 paralel
 *   node scripts/derin-hepsi.mjs 6 TUR,ITA  → sadece bu ülkeler
 */

import { readFile, readdir, mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'
import os from 'node:os'

const K = path.join(process.cwd(), 'public', 'izgara')
const envanter = JSON.parse(await readFile(path.join(K, 'envanter.json'), 'utf8'))
const sozluk = JSON.parse(await readFile(path.join(K, 'kademeler.json'), 'utf8'))

const paralel = Number(process.argv[2] ?? Math.max(2, Math.min(6, os.cpus().length - 2)))
const secili = process.argv[3]?.split(',').map((s) => s.trim().toUpperCase())

// Dünya haritasındaki ülkeler — sadece gerçekten çizilenler
const dunya = JSON.parse(await readFile(path.join(K, 'dunya.json'), 'utf8'))
let isolar = [...new Set(dunya.bolgeler.map((b) => b.kod))].filter((k) => /^[A-Z]{3}$/.test(k))
if (secili) isolar = isolar.filter((i) => secili.includes(i))

// Büyük ülkeler önce başlasın — sona kalırsa herkes onu bekler
isolar.sort((a, b) => (envanter[b]?.dosyaAyri ?? 0) - (envanter[a]?.dosyaAyri ?? 0))

console.log(`${isolar.length} ülke · ${paralel} paralel süreç\n`)

const basla = Date.now()
let sira = 0
let biten = 0
const hatalar = []
const sonuclar = []

function birUlke(iso) {
  return new Promise((cozum) => {
    const kisit = sozluk[iso]?.enFazlaKademe ?? 4
    const p = spawn(process.execPath, ['scripts/izgara-uret.mjs', 'derin', iso, String(kisit)], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let cikti = ''
    p.stdout.on('data', (d) => (cikti += d))
    p.stderr.on('data', (d) => (cikti += d))
    p.on('close', (kod) => {
      biten++
      const dk = ((Date.now() - basla) / 60000).toFixed(1)
      const satir = cikti.trim().split('\n').pop() ?? ''
      const dosya = Number(satir.match(/(\d+) dosya/)?.[1] ?? 0)
      if (kod === 0 && dosya > 0) {
        sonuclar.push({ iso, dosya })
        console.log(`[${String(biten).padStart(3)}/${isolar.length}] ${iso}  ${satir.trim()}  (${dk} dk)`)
      } else {
        hatalar.push({ iso, cikti: cikti.trim().slice(-160) })
        console.log(`[${String(biten).padStart(3)}/${isolar.length}] ${iso}  ⚠️ üretilemedi`)
      }
      cozum()
    })
  })
}

async function isci() {
  while (sira < isolar.length) {
    const iso = isolar[sira++]
    await birUlke(iso)
  }
}

await mkdir(K, { recursive: true })
await Promise.all(Array.from({ length: paralel }, isci))

/* --- Özet --- */
const dk = ((Date.now() - basla) / 60000).toFixed(1)
const toplamDosya = sonuclar.reduce((t, s) => t + s.dosya, 0)

// Diskte gerçekte kaç dosya var
let gercek = 0
for (const d of await readdir(K, { withFileTypes: true })) {
  if (d.isDirectory()) gercek += (await readdir(path.join(K, d.name))).length
  else if (d.name.endsWith('.json')) gercek++
}

console.log(`\n${'━'.repeat(56)}`)
console.log(`BİTTİ — ${sonuclar.length} ülke üretildi · ${dk} dakika`)
console.log(`  bildirilen dosya : ${toplamDosya.toLocaleString('tr-TR')}`)
console.log(`  diskte toplam    : ${gercek.toLocaleString('tr-TR')}`)
console.log(`  Cloudflare limiti: 20.000  →  ${gercek <= 20000 ? '✓ sığıyor' : '✗ AŞIYOR'}`)

if (hatalar.length) {
  console.log(`\n⚠️ ÜRETİLEMEYEN ${hatalar.length} ÜLKE`)
  for (const h of hatalar.slice(0, 20)) console.log(`  ${h.iso}: ${h.cikti.split('\n').pop()}`)
}
