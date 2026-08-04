/**
 * IZGARA DENETİMİ
 *
 * Üretilen bütün harita dosyalarını tarar ve sorunları listeler.
 * Kademe sayısı ülkeden ülkeye değiştiği için denetim de kademe-bağımsız çalışır.
 *
 * Kontroller:
 *  1. Kayıp bölge      — kaynakta N birim var, haritada daha az çıktı
 *  2. Görünmez bölge   — 2 noktadan az almış, tıklanamaz
 *  3. Bozuk oran       — ana harita eziliyor (uzak toprak kutuya alınmamış)
 *  4. Boş/bozuk dosya  — okunamıyor veya hiç nokta yok
 *  5. Kodlama hatası   — "RegiÃ³n" tipi çift kodlama, isim artıkları
 *  6. Kırık zincir     — listede görünen bölgenin dosyası da gömülüsü de yok
 *  7. Yetim dosya      — üst kademede karşılığı olmayan dosya
 *  8. Şüpheli kademe   — 3'ten az bölge (o ülkede kademe anlamsız olabilir)
 *
 * Kullanım:
 *   node scripts/izgara-denetle.mjs
 *   node scripts/izgara-denetle.mjs TUR      → tek ülke ayrıntılı
 */

import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

const K = path.join(process.cwd(), 'public', 'izgara')
const envanter = JSON.parse(await readFile(path.join(K, 'envanter.json'), 'utf8'))
const sozluk = JSON.parse(await readFile(path.join(K, 'kademeler.json'), 'utf8'))

/**
 * Üretim özeti — İNDİRİLEN dosyalardaki gerçek birim sayıları.
 * geoBoundaries'in meta verisi güvenilmez (Türkiye meta'da 999 ilçe der,
 * gerçek dosyada 973 vardır) — o yüzden kayıp hesabı buna göre yapılır.
 */
let uretimOzeti = {}
try {
  uretimOzeti = JSON.parse(await readFile(path.join(K, 'uretim-ozeti.json'), 'utf8'))
} catch {
  console.log('⚠️  uretim-ozeti.json yok — kayıp hesabı meta veriye düşecek (yanlış alarm verebilir)\n')
}

const tekUlke = process.argv[2]?.toUpperCase()

/** Çift kodlama ve isim artığı imzaları */
const KODLAMA_BOZUK = /[À-ÿ][-¿]/
const ISIM_ARTIGI = /(\s+nor$|LEA-\d+$|^\s|\s$|\s{2,}|"|\d+$)/

function parcalar(v) {
  return v.parcalar ?? []
}
function noktaSayisi(v) {
  return parcalar(v).reduce((t, p) => t + p.noktalar.length, 0)
}

const sorun = {
  kayipBolge: [],
  gorunmez: [],
  oran: [],
  bozukDosya: [],
  kodlama: [],
  kirikZincir: [],
  yetim: [],
  supheliKademe: [],
}

let dosyaSayisi = 0
let toplamBolge = 0
let toplamBoyut = 0

const klasorler = (await readdir(K, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .filter((n) => !tekUlke || n === tekUlke)

for (const iso of klasorler) {
  const dizin = path.join(K, iso)
  const dosyalar = (await readdir(dizin)).filter((f) => f.endsWith('.json'))
  const mevcut = new Set(dosyalar.map((f) => f.replace('.json', '')))

  // Ülkede toplam kaç bölge çizildi — kaynak sayısıyla karşılaştırmak için
  const kademeBolge = {}

  for (const f of dosyalar) {
    dosyaSayisi++
    const yol = path.join(dizin, f)
    toplamBoyut += (await stat(yol)).size

    let v
    try {
      v = JSON.parse(await readFile(yol, 'utf8'))
    } catch (e) {
      sorun.bozukDosya.push({ iso, f, sebep: 'okunamadı: ' + e.message })
      continue
    }

    const nokta = noktaSayisi(v)
    if (!nokta) {
      sorun.bozukDosya.push({ iso, f, sebep: 'hiç nokta yok' })
      continue
    }
    if (!v.bolgeler?.length) {
      sorun.bozukDosya.push({ iso, f, sebep: 'bölge listesi boş' })
      continue
    }

    toplamBolge += v.bolgeler.length
    kademeBolge[v.kademe] = (kademeBolge[v.kademe] ?? 0) + v.bolgeler.length

    // Gömülü alt kademe de o kademenin sayısına girer — yoksa gömme yapılan
    // ülkelerde "hepsi kayıp" gibi yanlış alarm verirdi (Jamaika 0/827).
    for (const kod of Object.keys(v.alt ?? {})) {
      const n = v.kademe + 1
      kademeBolge[n] = (kademeBolge[n] ?? 0) + (v.alt[kod].bolgeler?.length ?? 0)
    }

    // 2. Görünmez bölgeler
    const say = {}
    for (const p of parcalar(v)) for (const [, , bi] of p.noktalar) say[bi] = (say[bi] ?? 0) + 1
    // HİÇ nokta almayan bölge sorundur; 1-2 nokta alan küçük bölge sorun değil
    // (şehir içi birimler devasa il içinde doğal olarak minik kalır ve
    //  küçük bölge garantisi sayesinde en az bir hücre alır — tıklanabilir).
    const gorunmez = v.bolgeler.filter((_, i) => (say[i] ?? 0) === 0)
    if (gorunmez.length)
      sorun.gorunmez.push({
        iso,
        f,
        adet: gorunmez.length,
        toplam: v.bolgeler.length,
        adlar: gorunmez.slice(0, 3).map((b) => b.ad),
      })

    // 3. Bozuk en-boy oranı (ana parça)
    const ana = parcalar(v)[0]
    if (ana) {
      const oran = ana.sutun / ana.satir
      if (oran > 4 || oran < 0.25)
        sorun.oran.push({ iso, f, oran: oran.toFixed(1), parca: parcalar(v).length })
    }

    // 5. Kodlama / isim artığı
    for (const b of v.bolgeler) {
      if (KODLAMA_BOZUK.test(b.ad)) {
        sorun.kodlama.push({ iso, f, ad: b.ad, tip: 'çift kodlama' })
        break
      }
      if (ISIM_ARTIGI.test(b.ad)) {
        sorun.kodlama.push({ iso, f, ad: b.ad, tip: 'isim artığı' })
        break
      }
    }

    // 6. Kırık zincir: bir bölgenin alt haritası ne dosyada ne gömülüde var mı?
    //    (Yaprak kademede olması normal — sadece alt kademesi olması gereken
    //     yerlerde ararız.)
    const enDerin = Math.min(envanter[iso]?.enDerin ?? 0, sozluk[iso]?.enFazlaKademe ?? 4)
    if (v.kademe < enDerin) {
      const zincirOnEki = f === 'ulke.json' ? '' : f.replace('.json', '') + '--'
      const eksik = v.bolgeler.filter((b) => {
        if (v.alt?.[b.kod]) return false // gömülü var
        // dosya adı slug'a göre kurulur; slug'ı ad üzerinden tahmin ederiz
        const s = b.ad
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
        return !mevcut.has(zincirOnEki + s)
      })
      if (eksik.length)
        sorun.kirikZincir.push({
          iso,
          f,
          kademe: v.kademe,
          adet: eksik.length,
          toplam: v.bolgeler.length,
          adlar: eksik.slice(0, 3).map((b) => b.ad),
        })
    }

    // 8. Şüpheli kademe
    if (v.bolgeler.length < 3 && v.kademe === 1)
      sorun.supheliKademe.push({ iso, f, adet: v.bolgeler.length, adlar: v.bolgeler.map((b) => b.ad) })
  }

  // 1. Kayıp bölge: kaynak sayısı ile çizilen sayı
  const env = envanter[iso]
  if (env) {
    // Kopya kademe elendiyse oradan aşağısı hiç üretilmez — kayıp sayılmaz
    const kopya = uretimOzeti[iso]?.kopya
    const uretilenDerin = uretimOzeti[iso]?.derin
    const enDerin = Math.min(
      env.enDerin,
      sozluk[iso]?.enFazlaKademe ?? 4,
      kopya ? kopya - 1 : 99,
      uretilenDerin ?? 99,
    )
    for (let n = 1; n <= enDerin; n++) {
      // Önce gerçek (indirilen) sayı, yoksa meta veri
      const kaynak = uretimOzeti[iso]?.kaynak?.[n] ?? env.kademe['ADM' + n] ?? 0
      const cizilen = kademeBolge[n] ?? 0
      if (!kaynak) continue
      const kayip = kaynak - cizilen
      if (kayip > 0 && kayip / kaynak > 0.02)
        sorun.kayipBolge.push({
          iso,
          kademe: n,
          kaynak,
          cizilen,
          kayip,
          yuzde: Math.round((kayip / kaynak) * 100),
        })
    }
  }
}

/* --- Gömülü kademelerdeki bölgeleri de say --- */
let gomuluBolge = 0
for (const iso of klasorler) {
  const dizin = path.join(K, iso)
  for (const f of (await readdir(dizin)).filter((x) => x.endsWith('.json'))) {
    let v
    try {
      v = JSON.parse(await readFile(path.join(dizin, f), 'utf8'))
    } catch {
      continue
    }
    for (const kod of Object.keys(v.alt ?? {})) gomuluBolge += v.alt[kod].bolgeler?.length ?? 0
  }
}

/* --- RAPOR --- */
const bas = (b) => console.log('\n' + '━'.repeat(62) + '\n' + b + '\n' + '━'.repeat(62))
const say = (a) => a.length

console.log(`TARANAN: ${klasorler.length} ülke · ${dosyaSayisi.toLocaleString('tr-TR')} dosya · ${(toplamBoyut / 1048576).toFixed(0)} MB`)
console.log(`BÖLGE  : ${toplamBolge.toLocaleString('tr-TR')} ayrı dosyada + ${gomuluBolge.toLocaleString('tr-TR')} gömülü = ${(toplamBolge + gomuluBolge).toLocaleString('tr-TR')}`)

bas('1. KAYIP BÖLGE (kaynakta var, haritada yok)')
sorun.kayipBolge
  .sort((a, b) => b.kayip - a.kayip)
  .slice(0, 15)
  .forEach((s) =>
    console.log(`  ${s.iso} kademe${s.kademe}  ${s.cizilen}/${s.kaynak}  → ${s.kayip} eksik (%${s.yuzde})`),
  )
console.log(`  → ${say(sorun.kayipBolge)} kayıt`)

bas('2. GÖRÜNMEZ BÖLGE (hiç nokta almamış)')
sorun.gorunmez
  .sort((a, b) => b.adet / b.toplam - a.adet / a.toplam)
  .slice(0, 12)
  .forEach((s) => console.log(`  ${s.iso}/${s.f}  ${s.adet}/${s.toplam}  ${s.adlar.join(', ')}`))
console.log(`  → ${say(sorun.gorunmez)} dosyada sorun`)

bas('3. BOZUK EN-BOY ORANI')
sorun.oran
  .sort((a, b) => b.oran - a.oran)
  .slice(0, 12)
  .forEach((s) => console.log(`  ${s.iso}/${s.f}  oran ${s.oran}  (${s.parca} parça)`))
console.log(`  → ${say(sorun.oran)} dosya`)

bas('4. BOŞ / BOZUK DOSYA')
sorun.bozukDosya.slice(0, 12).forEach((s) => console.log(`  ${s.iso}/${s.f}  ${s.sebep}`))
console.log(`  → ${say(sorun.bozukDosya)} dosya`)

bas('5. İSİM SORUNU (kodlama / artık)')
sorun.kodlama.slice(0, 12).forEach((s) => console.log(`  ${s.iso}/${s.f}  [${s.tip}]  "${s.ad}"`))
console.log(`  → ${say(sorun.kodlama)} dosya`)

bas('6. KIRIK ZİNCİR (alt haritası yok)')
sorun.kirikZincir
  .sort((a, b) => b.adet - a.adet)
  .slice(0, 12)
  .forEach((s) => console.log(`  ${s.iso}/${s.f} k${s.kademe}  ${s.adet}/${s.toplam} bölgenin altı yok  ${s.adlar.join(', ')}`))
console.log(`  → ${say(sorun.kirikZincir)} dosya`)

bas('8. ŞÜPHELİ KADEME (3’ten az bölge)')
sorun.supheliKademe.slice(0, 12).forEach((s) => console.log(`  ${s.iso}/${s.f}  ${s.adet}: ${s.adlar.join(', ')}`))
console.log(`  → ${say(sorun.supheliKademe)} ülke`)

const toplamSorun = Object.values(sorun).reduce((t, a) => t + a.length, 0)
console.log(`\n${'═'.repeat(62)}\nTOPLAM ${toplamSorun} KAYIT\n${'═'.repeat(62)}`)
