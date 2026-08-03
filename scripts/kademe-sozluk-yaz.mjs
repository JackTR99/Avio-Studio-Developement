/**
 * KADEME SÖZLÜĞÜ
 *
 * Araştırma çıktısını uygulamanın okuyacağı biçime çevirir.
 *
 * İKİ AYRI KAVRAM — karıştırılırsa ya yanlış etiket ya mahremiyet açığı olur:
 *
 *  ilceKademesi        : YAPISAL. "Bu ülkede ilçe/county karşılığı hangi kademe."
 *                        Sadece ekran adlandırması ve gezinti için.
 *  maskeBaslangici     : GİZLİLİK. "Bu kademeden itibaren 5 kişi eşiği uygulanır."
 *                        Varsayılan = ilceKademesi + 1, ama bazı ülkelerde
 *                        ilçe kademesinin kendisi de küçük olduğu için öne çekilir.
 *
 * Örnek: İspanya'da ADM2 il (provincia), ADM3 belediye. Belediyelerin binlercesi
 * 1.000 kişinin altında → maske ADM3'te başlar. Türkiye'de ilçe altı kademe hiç
 * yok → maske hiç devreye girmez.
 *
 * Kullanım: node scripts/kademe-sozluk-yaz.mjs <ham.json>
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const CIKTI = path.join(process.cwd(), 'public', 'izgara')

/**
 * DENETİM DÜZELTMELERİ
 * Sentez ajanının yakaladığı çelişkiler. Her biri gerekçeli.
 */
const DUZELTME = {
  // ADM2 idari birim değil, istatistik grubu (~500 bin nüfus). Gerçek belediye ADM3.
  CAN: { ilceKademesi: 3, maskeBaslangici: 3, not: 'ADM2 istatistik bölgesi; belediye ADM3' },
  // Tek kademeli ülke: ilçe karşılığı ADM1'in kendisi
  ARE: { ilceKademesi: 1, maskeBaslangici: 9, not: 'Tek kademe; maskelenecek alt kademe yok' },
  // ADM3 (8205 belediye) çok küçük — maske orada başlamalı, ama etiket "il" kalmalı
  ESP: { ilceKademesi: 2, maskeBaslangici: 3, not: 'ADM2 il; ADM3 belediye ortalama 5.700 kişi' },
  // Etiket il olmalı ama maske bir kademe erken başlasın
  ROU: { ilceKademesi: 2, maskeBaslangici: 2, not: 'ADM2 comuna/oraș küçük birim' },
  HRV: { ilceKademesi: 2, maskeBaslangici: 2, not: 'ADM2 općina/grad küçük birim' },
  // ADM3, ADM2'nin birebir kopyası — gösterilmemeli
  GBR: { ilceKademesi: 2, maskeBaslangici: 9, enFazlaKademe: 2, not: 'ADM3 = ADM2 kopyası, gizlendi' },
  // Gerçek yerel yönetim kademesi veride yok
  IRL: { ilceKademesi: 2, maskeBaslangici: 9, not: 'Sınırlı kapsam: 31 yerel yönetim veride yok' },
  // ADM2 ve ADM3 aynı granülerlik — ikincisi gizlensin
  CHN: { ilceKademesi: 2, maskeBaslangici: 9, enFazlaKademe: 2, not: 'ADM3 = ADM2 ile aynı düzey' },
  BEL: { ilceKademesi: 3, maskeBaslangici: 4, not: 'Arrondisman ilçe karşılığı' },
}

/** Kadastro/seçim bölgesi gibi idari olmayan en derin kademeler — gösterilmez */
const IDARI_OLMAYAN_SON_KADEME = {
  CZE: 3, // ADM4 kadastro
  SVK: 3, // ADM4 kadastro
  AUT: 3, // ADM4 kadastro
  NZL: 2, // ADM3 ward (seçim bölgesi)
}

const ham = JSON.parse(await readFile(process.argv[2], 'utf8'))
const sozluk = {}

for (const u of ham) {
  const d = DUZELTME[u.iso] ?? {}
  const ilce = d.ilceKademesi ?? u.ilceKademesi ?? 2
  const kayit = {
    ilceKademesi: ilce,
    // Varsayılan: ilçenin bir altından itibaren maskele
    maskeBaslangici: d.maskeBaslangici ?? ilce + 1,
    guven: u.guven ?? 'orta',
    adlar: {},
  }
  for (const n of [1, 2, 3, 4]) {
    const tekil = u['adm' + n]
    const cogul = u['adm' + n + 'Cogul']
    if (tekil || cogul) kayit.adlar[n] = { tekil: tekil ?? cogul, cogul: cogul ?? tekil }
  }
  const sinir = d.enFazlaKademe ?? IDARI_OLMAYAN_SON_KADEME[u.iso]
  if (sinir) kayit.enFazlaKademe = sinir
  const notlar = [u.not, d.not].filter(Boolean)
  if (notlar.length) kayit.not = notlar.join(' | ')
  sozluk[u.iso] = kayit
}

await mkdir(CIKTI, { recursive: true })
await writeFile(path.join(CIKTI, 'kademeler.json'), JSON.stringify(sozluk, null, 1))

const duzeltilen = Object.keys(DUZELTME).filter((k) => sozluk[k]).length
const sinirli = Object.values(sozluk).filter((v) => v.enFazlaKademe).length
const dusukGuven = Object.entries(sozluk).filter(([, v]) => v.guven === 'dusuk').map(([k]) => k)
const ortaGuven = Object.entries(sozluk).filter(([, v]) => v.guven === 'orta').map(([k]) => k)

console.log(`SÖZLÜK YAZILDI: ${Object.keys(sozluk).length} ülke → public/izgara/kademeler.json`)
console.log(`  denetimde düzeltilen : ${duzeltilen}`)
console.log(`  kademesi kısıtlanan  : ${sinirli}`)
console.log(`  güven orta           : ${ortaGuven.join(', ') || '—'}`)
console.log(`  güven düşük          : ${dusukGuven.join(', ') || '—'}`)

console.log('\nÖRNEKLER')
for (const iso of ['TUR', 'ITA', 'FRA', 'USA', 'ESP', 'DEU', 'GBR', 'CZE']) {
  const v = sozluk[iso]
  if (!v) continue
  const zincir = Object.entries(v.adlar)
    .filter(([n]) => !v.enFazlaKademe || Number(n) <= v.enFazlaKademe)
    .map(([n, a]) => `${n}:${a.cogul}`)
    .join(' → ')
  console.log(`  ${iso}  ilçe=${v.ilceKademesi}  maske≥${v.maskeBaslangici}   ${zincir}`)
}
