import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  bosaTiklama as bosaBase,
  cihazTuru as cihazBase,
  cikisSayfalari as cikisBase,
  diller as dilBase,
  disLinkler as disLinkBase,
  ekranOlculeri as ekranBase,
  enCokGezilen as enCokBase,
  gezintiYollari as gezintiBase,
  girisSayfalari as girisBase,
  hata404 as hata404Base,
  hedefler as hedefBase,
  huni as huniBase,
  indirmeler as indirmeBase,
  isletimSistemleri as osBase,
  jsHatalari as jsBase,
  kayitlar as kayitBase,
  olaylar as olayBase,
  sinirliTiklama as sinirliBase,
  tarayicilar as tarayiciBase,
  trafikKaynaklari as kaynakBase,
  utmKampanyalari as utmBase,
  yonlendirenSiteler as yonlendirenBase,
  aramaKelimeleri as aramaBase,
  baglantiTurleri as baglantiBase,
  ilceler as ilceBase,
  indexDurumu as indexBase,
  motorKarsilastirma as motorBase,
  sayfaHizlari as sayfaHizBase,
  sehirler as sehirBase,
  siteler,
  ulkeler as ulkeBase,
  webVitals as vitalsBase,
  type Site,
} from './mock'

/* ============================================================ ARALIK */

export type AralikAdi = 'Bugün' | '7 gün' | '30 gün' | '3 ay' | 'Özel'

export type Aralik = {
  ad: AralikAdi
  gun: number
  baslangic: Date
  bitis: Date
}

const BUGUN = new Date(2026, 7, 1) // taslak "bugün" — 1 Ağustos 2026

export function aralikUret(ad: AralikAdi, ozelBas?: string, ozelBit?: string): Aralik {
  if (ad === 'Özel' && ozelBas && ozelBit) {
    const b = new Date(ozelBas)
    const s = new Date(ozelBit)
    const gun = Math.max(1, Math.round((s.getTime() - b.getTime()) / 86400000) + 1)
    return { ad, gun, baslangic: b, bitis: s }
  }
  const gun = ad === 'Bugün' ? 1 : ad === '7 gün' ? 7 : ad === '30 gün' ? 30 : ad === '3 ay' ? 90 : 30
  const bitis = BUGUN
  const baslangic = new Date(bitis.getTime() - (gun - 1) * 86400000)
  return { ad, gun, baslangic, bitis }
}

export function tarihYaz(d: Date) {
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function isoYaz(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/* ============================================================ RASTGELE (tohumlu) */

/** Aynı tohum → aynı sonuç. Böylece ekran her çizimde zıplamaz. */
function tohumlu(tohum: number) {
  let t = tohum >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

type Durum = 'iyi' | 'orta' | 'kotu'

const bicim = (n: number) => Math.round(n).toLocaleString('tr-TR')
const ondalik = (n: number, basamak = 2) => n.toFixed(basamak).replace('.', ',')

/* ============================================================ ÜRETİM */

export type Veri = ReturnType<typeof veriUret>

/** Site adından sabit bir tohum sayısı üretir (aynı site → aynı veri). */
function siteTohumu(alan: string) {
  let t = 0
  for (let i = 0; i < alan.length; i++) t = (t * 31 + alan.charCodeAt(i)) >>> 0
  return t
}

export function veriUret(aralik: Aralik, site: Site) {
  const gun = aralik.gun
  // Sitenin kendi büyüklüğü (taban 8412 ziyaretçi = 1 kat)
  const siteKat = site.ziyaretci / 8412
  const kat = (gun / 30) * siteKat
  const rnd = tohumlu(
    Math.round(aralik.baslangic.getTime() / 86400000) * 31 + gun + siteTohumu(site.alan),
  )

  /** Sayıyı ölçekler + küçük organik sapma ekler. */
  const olcek = (taban: number, sapma = 0.08) => Math.max(1, Math.round(taban * kat * (1 + (rnd() - 0.5) * sapma * 2)))
  /** Oranları ölçeklemez, sadece hafif oynatır. */
  const oran = (taban: number, sapma = 0.06) => taban * (1 + (rnd() - 0.5) * sapma * 2)

  /* --- ziyaretçi çekirdek --- */
  const ziyaretci = olcek(8412)
  const ziyaret = Math.round(ziyaretci * oran(1.27, 0.04))
  const kisiBasinaSayfa = oran(2.84, 0.07)
  const sayfaGoruntuleme = Math.round(ziyaret * kisiBasinaSayfa)
  const ortSaniye = Math.round(oran(134, 0.12))
  const sureYaz = `${Math.floor(ortSaniye / 60)}:${String(ortSaniye % 60).padStart(2, '0')}`

  const degisim = (t: number) => Number((t * oran(1, 0.5)).toFixed(1))

  const ziyaretciMetrikleri = [
    {
      id: 1,
      etiket: 'Ziyaretçi',
      deger: bicim(ziyaretci),
      degisim: degisim(12.4),
      tahmini: gun > 1, // 1 günlük filtrede tahmine gerek yok — günlük kod zaten tekil sayıyor
      aciklama:
        gun > 1
          ? 'Onay vermeyen ziyaretçilerin kodu her gün değişir. Bu aralıkta günleri toplarsak aynı kişi defalarca sayılır. Onay verenlerden çıkardığımız şişme katsayısıyla düzeltiyoruz. Bu yüzden başında ~ var.'
          : 'Tek günlük aralıkta günlük kod zaten tekil sayar. Tahmine gerek yok, bu rakam kesin.',
    },
    { id: 2, etiket: 'Görüntülenen Sayfa', deger: bicim(sayfaGoruntuleme), degisim: degisim(8.1) },
    { id: 68, etiket: 'Kişi Başına Sayfa', deger: ondalik(kisiBasinaSayfa), degisim: degisim(3.2) },
    { id: 3, etiket: 'Ziyaret Sayısı', deger: bicim(ziyaret), degisim: degisim(-1.6) },
    { id: 4, etiket: 'Ort. Ziyaret Süresi', deger: sureYaz, degisim: degisim(6) },
  ]

  /* --- 6: yeni/dönen ziyaretçi — onay durumuna göre iki katmanlı --- */
  const kabulYuzdeHam = Math.round(oran(62, 0.07))
  const onayliSayi = Math.round((ziyaretci * kabulYuzdeHam) / 100)
  // Onay verenlerde kalıcı kod var → gerçek oran KESİN ölçülür.
  const yeniKesinYuzde = Math.round(oran(64, 0.05))
  // Reddedenlerde günler arası bilinemez → onaylıların oranı uygulanır (tahmin).
  const yeniTahminiYuzde = Math.max(
    1,
    Math.min(99, Math.round(yeniKesinYuzde * oran(1, 0.04))),
  )

  const yeniDonen = {
    kesinYuzde: yeniKesinYuzde,
    tahminiYuzde: yeniTahminiYuzde,
    onayliSayi,
    // Tek günlük aralıkta günlük kod gün boyu sabit → herkes için KESİN.
    tekGun: gun === 1,
  }

  const ekMetrikler = [
    { id: 5, etiket: 'Hemen Çıkma Oranı', deger: `%${ondalik(oran(38.2), 1)}`, degisim: degisim(-4.1) },
    {
      id: 6,
      etiket: 'Yeni Ziyaretçi',
      deger: `%${gun === 1 ? yeniKesinYuzde : yeniTahminiYuzde}`,
      degisim: degisim(2.8),
    },
  ]

  /* --- zaman serisi: kısa aralık = günlük, uzun aralık = haftalık --- */
  const haftalik = gun > 45
  const nokta = haftalik ? Math.ceil(gun / 7) : gun
  const gunlukOrt = ziyaretci / gun
  const birimOrt = haftalik ? gunlukOrt * 7 : gunlukOrt

  const zamanSerisi = Array.from({ length: Math.max(2, nokta) }, (_, i) => {
    const haftaGunu = (aralik.baslangic.getDay() + i) % 7
    const haftaSonu = haftaGunu === 0 || haftaGunu === 6
    const mevsim = 1 + Math.sin(i / 4) * 0.12
    const dalga = haftalik ? 1 : (haftaSonu ? 0.72 : 1.08) * mevsim
    const gurultu = 1 + (rnd() - 0.5) * 0.22
    const v = birimOrt * dalga * gurultu
    const tarih = new Date(aralik.baslangic.getTime() + i * (haftalik ? 7 : 1) * 86400000)
    return {
      etiket: haftalik
        ? `${tarih.getDate()} ${tarih.toLocaleDateString('tr-TR', { month: 'short' })}`
        : `${tarih.getDate()}`,
      ziyaretci: Math.max(1, Math.round(v)),
      onceki: Math.max(1, Math.round(v * (0.78 + rnd() * 0.22))),
    }
  })

  const canli = Math.max(2, Math.round(gunlukOrt / 11))

  /* --- konum --- */
  const konumOlcek = <T extends { sayi: number; yuzde: number }>(liste: T[]) => {
    const carpanlar = liste.map(() => 1 + (rnd() - 0.5) * 0.18)
    const hamlar = liste.map((k, i) => k.sayi * kat * carpanlar[i])
    const toplam = hamlar.reduce((a, b) => a + b, 0)
    return liste.map((k, i) => ({
      ...k,
      sayi: Math.max(1, Math.round(hamlar[i])),
      yuzde: Math.max(1, Math.round((hamlar[i] / toplam) * 100)),
    }))
  }

  const ulkeler = konumOlcek(ulkeBase)
  const sehirler = konumOlcek(sehirBase)
  const ilceler = konumOlcek(ilceBase)

  /* --- sayfalar --- */
  const sayfaOlcek = (liste: typeof enCokBase) =>
    liste
      .map((s) => ({
        ...s,
        goruntuleme: olcek(s.goruntuleme, 0.14),
        cikisOrani: Math.min(94, Math.max(6, Math.round(oran(s.cikisOrani, 0.12)))),
      }))
      .sort((a, b) => b.goruntuleme - a.goruntuleme)

  const enCokGezilen = sayfaOlcek(enCokBase)
  const girisSayfalari = sayfaOlcek(girisBase)
  const cikisSayfalari = sayfaOlcek(cikisBase)
  const gezintiYollari = gezintiBase.map((g) => ({ ...g, sayi: olcek(g.sayi, 0.16) })).sort((a, b) => b.sayi - a.sayi)
  const hata404 = hata404Base.map((h) => ({ ...h, sayi: olcek(h.sayi, 0.2) })).sort((a, b) => b.sayi - a.sayi)

  /* --- kaynaklar --- */
  const kaynakHam = kaynakBase.map((k) => k.sayi * kat * (1 + (rnd() - 0.5) * 0.2))
  const kaynakToplam = kaynakHam.reduce((a, b) => a + b, 0)
  const trafikKaynaklari = kaynakBase.map((k, i) => ({
    ...k,
    sayi: Math.max(1, Math.round(kaynakHam[i])),
    yuzde: Math.max(1, Math.round((kaynakHam[i] / kaynakToplam) * 100)),
  }))
  const yonlendirenSiteler = yonlendirenBase.map((y) => ({ ...y, sayi: olcek(y.sayi, 0.22) })).sort((a, b) => b.sayi - a.sayi)
  const utmKampanyalari = utmBase.map((u) => ({
    ...u,
    ziyaret: olcek(u.ziyaret, 0.18),
    donusum: olcek(u.donusum, 0.24),
  }))

  /* --- cihaz --- */
  const dagilimOlcek = <T extends { sayi: number; yuzde: number }>(liste: T[]) => {
    const ham = liste.map((d) => d.sayi * kat * (1 + (rnd() - 0.5) * 0.14))
    const top = ham.reduce((a, b) => a + b, 0)
    return liste.map((d, i) => ({
      ...d,
      sayi: Math.max(1, Math.round(ham[i])),
      yuzde: Math.max(1, Math.round((ham[i] / top) * 100)),
    }))
  }

  const cihazTuru = dagilimOlcek(cihazBase)
  const tarayicilar = dagilimOlcek(tarayiciBase)
  const isletimSistemleri = dagilimOlcek(osBase)
  const ekranOlculeri = dagilimOlcek(ekranBase)
  const diller = dagilimOlcek(dilBase)
  const baglantiTurleri = dagilimOlcek(baglantiBase)

  /* --- davranış --- */
  const tiklamaSayisi = Math.round(sayfaGoruntuleme * oran(0.77, 0.1))
  const hareketNoktasi = Math.round(sayfaGoruntuleme * oran(52, 0.1))
  const sinirliTiklama = sinirliBase.map((s) => ({ ...s, sayi: olcek(s.sayi, 0.22) })).sort((a, b) => b.sayi - a.sayi)
  const bosaTiklama = bosaBase.map((s) => ({ ...s, sayi: olcek(s.sayi, 0.22) })).sort((a, b) => b.sayi - a.sayi)

  /* --- kayıtlar: aralık uzadıkça daha çok kayıt --- */
  const kayitAdedi = Math.min(12, Math.max(2, Math.round(2 + gun / 6)))
  const kayitlar = Array.from({ length: kayitAdedi }, (_, i) => {
    const taban = kayitBase[i % kayitBase.length]
    const tarih = new Date(aralik.bitis.getTime() - Math.floor(rnd() * gun) * 86400000)
    return {
      ...taban,
      id: `k-${9182 - i}`,
      sure: Math.max(18, Math.round(taban.sure * (0.6 + rnd() * 0.9))),
      olay: Math.max(4, Math.round(taban.olay * (0.6 + rnd() * 0.9))),
      sinirli: rnd() > 0.66,
      tarih: `${String(tarih.getDate()).padStart(2, '0')}.${String(tarih.getMonth() + 1).padStart(2, '0')} ${String(Math.floor(rnd() * 14) + 8).padStart(2, '0')}:${String(Math.floor(rnd() * 60)).padStart(2, '0')}`,
    }
  }).sort((a, b) => (a.tarih < b.tarih ? 1 : -1))

  /* --- dönüşüm --- */
  const olaylar = olayBase.map((o) => ({ ...o, sayi: olcek(o.sayi, 0.16), degisim: degisim(o.degisim) }))
  const hedefler = hedefBase.map((h) => ({ ...h, sayi: olcek(h.sayi, 0.16) }))
  const huniOran = [1, 0.497, 0.388, 0.254, 0.0176]
  const huni = huniBase.map((h, i) => ({ ...h, sayi: Math.max(1, Math.round(ziyaretci * huniOran[i] * oran(1, 0.08))) }))
  const disLinkler = disLinkBase.map((d) => ({ ...d, sayi: olcek(d.sayi, 0.18) })).sort((a, b) => b.sayi - a.sayi)
  const indirmeler = indirmeBase.map((d) => ({ ...d, sayi: olcek(d.sayi, 0.18) })).sort((a, b) => b.sayi - a.sayi)

  /* --- hız --- */
  const lcpDeger = oran(1.9, 0.16)
  const clsDeger = oran(0.14, 0.3)
  const esik = (d: number, iyiAlt: number, ortaAlt: number): Durum =>
    d < iyiAlt ? 'iyi' : d < ortaAlt ? 'orta' : 'kotu'

  const webVitals = vitalsBase.map((v) => {
    if (v.kod === 'LCP')
      return { ...v, deger: `${ondalik(lcpDeger, 1)} sn`, durum: esik(lcpDeger, 2.5, 4) }
    if (v.kod === 'CLS')
      return { ...v, deger: ondalik(clsDeger, 2), durum: esik(clsDeger, 0.1, 0.25) }
    if (v.kod === 'INP') {
      const d = oran(164, 0.2)
      return { ...v, deger: `${Math.round(d)} ms`, durum: esik(d, 200, 500) }
    }
    if (v.kod === 'FCP') {
      const d = oran(1.2, 0.18)
      return { ...v, deger: `${ondalik(d, 1)} sn`, durum: esik(d, 1.8, 3) }
    }
    const d = oran(0.7, 0.25)
    return { ...v, deger: `${ondalik(d, 1)} sn`, durum: esik(d, 0.8, 1.8) }
  })

  const hizNokta = Math.max(4, Math.min(30, nokta))
  const hizZaman = Array.from({ length: hizNokta }, (_, i) => {
    const ilerleme = i / Math.max(1, hizNokta - 1)
    return { lcp: Number((2.6 - ilerleme * 0.7 + (rnd() - 0.5) * 0.18).toFixed(2)) }
  })

  const sayfaHizlari = sayfaHizBase.map((s) => {
    const d = Number(s.lcp.replace(' sn', '').replace(',', '.')) * oran(1, 0.14)
    const c = Number(s.cls.replace(',', '.')) * oran(1, 0.2)
    return {
      ...s,
      lcp: `${ondalik(d, 1)} sn`,
      cls: ondalik(c, 2),
      durum: (d < 2.5 && c < 0.1 ? 'iyi' : d < 4 ? 'orta' : 'kotu') as Durum,
    }
  })

  const perf = Math.round(oran(84, 0.06))
  const lighthouse = [
    { ad: 'Performans', puan: perf },
    { ad: 'Erişilebilirlik', puan: Math.round(oran(96, 0.03)) },
    { ad: 'En İyi Uygulamalar', puan: Math.round(oran(92, 0.04)) },
    { ad: 'SEO', puan: 100 },
  ]

  const lighthouseGecmis = Array.from({ length: 6 }, (_, i) => {
    const t = new Date(aralik.bitis.getTime() - (5 - i) * 30 * 86400000)
    return {
      tarih: t.toLocaleDateString('tr-TR', { month: 'short' }),
      puan: Math.round(perf - (5 - i) * 4.4 + (rnd() - 0.5) * 4),
    }
  })

  const jsHatalari = jsBase.map((h) => ({ ...h, kisi: olcek(h.kisi, 0.24) })).sort((a, b) => b.kisi - a.kisi)

  /* --- SEO --- */
  const aramaKelimeleri = aramaBase
    .map((k) => {
      const tiklama = olcek(k.tiklama, 0.16)
      const gosterim = olcek(k.gosterim, 0.14)
      return {
        ...k,
        tiklama,
        gosterim,
        ctr: Number(((tiklama / gosterim) * 100).toFixed(1)),
        sira: Number(oran(k.sira, 0.16).toFixed(1)),
        degisim: Number((k.degisim * oran(1, 0.6)).toFixed(1)),
      }
    })
    .sort((a, b) => b.tiklama - a.tiklama)

  const indexDurumu = indexBase.map((d) => ({ ...d, sayi: Math.max(0, Math.round(oran(d.sayi, 0.12))) }))
  const motorKarsilastirma = motorBase.map((m) => {
    const tiklama = olcek(m.tiklama, 0.12)
    const gosterim = olcek(m.gosterim, 0.12)
    return { ...m, tiklama, gosterim, ctr: Number(((tiklama / gosterim) * 100).toFixed(1)) }
  })

  /* --- gizlilik --- */
  const kabulYuzde = Math.round(oran(62, 0.07))
  const onayDurumu = {
    kabul: Math.round((ziyaretci * kabulYuzde) / 100),
    ret: Math.round((ziyaretci * (100 - kabulYuzde)) / 100),
    kabulYuzde,
  }
  const botYuzde = Math.round(oran(41, 0.1))
  const botFiltresi = {
    insan: ziyaretci,
    bot: Math.round((ziyaretci * botYuzde) / (100 - botYuzde)),
    botYuzde,
    toplam: Math.round(ziyaretci / (1 - botYuzde / 100)),
  }

  /* --- ısı haritası yoğunlukları (aralığa göre etiket) --- */
  const isiOzet = {
    tiklama: bicim(tiklamaSayisi),
    kaydirma: bicim(ziyaret),
    hareket: `${ondalik(hareketNoktasi / 1_000_000, 1)}M`,
  }

  return {
    aralik,
    site,
    ziyaretciMetrikleri,
    ekMetrikler,
    yeniDonen,
    zamanSerisi,
    canli,
    ulkeler,
    sehirler,
    ilceler,
    enCokGezilen,
    girisSayfalari,
    cikisSayfalari,
    gezintiYollari,
    hata404,
    trafikKaynaklari,
    yonlendirenSiteler,
    utmKampanyalari,
    cihazTuru,
    tarayicilar,
    isletimSistemleri,
    ekranOlculeri,
    diller,
    baglantiTurleri,
    sinirliTiklama,
    bosaTiklama,
    isiOzet,
    kayitlar,
    olaylar,
    hedefler,
    huni,
    disLinkler,
    indirmeler,
    webVitals,
    hizZaman,
    sayfaHizlari,
    lighthouse,
    lighthouseGecmis,
    jsHatalari,
    aramaKelimeleri,
    indexDurumu,
    motorKarsilastirma,
    onayDurumu,
    botFiltresi,
  }
}

/* ============================================================ CONTEXT */

type VeriDurumu = {
  veri: Veri
  aralik: Aralik
  aralikAdi: AralikAdi
  ozelBas: string
  ozelBit: string
  site: Site
  setSite: (alan: string) => void
  setAralikAdi: (a: AralikAdi) => void
  setOzel: (bas: string, bit: string) => void
}

const VeriContext = createContext<VeriDurumu | null>(null)

export function VeriProvider({ children }: { children: ReactNode }) {
  const [aralikAdi, setAralikAdiIc] = useState<AralikAdi>('30 gün')
  const [ozelBas, setOzelBas] = useState(isoYaz(new Date(BUGUN.getTime() - 13 * 86400000)))
  const [ozelBit, setOzelBit] = useState(isoYaz(BUGUN))
  const [siteAlan, setSiteAlan] = useState(siteler[0].alan)

  const site = useMemo(
    () => siteler.find((s) => s.alan === siteAlan) ?? siteler[0],
    [siteAlan],
  )

  const aralik = useMemo(
    () => aralikUret(aralikAdi, ozelBas, ozelBit),
    [aralikAdi, ozelBas, ozelBit],
  )
  const veri = useMemo(() => veriUret(aralik, site), [aralik, site])

  return (
    <VeriContext.Provider
      value={{
        veri,
        aralik,
        aralikAdi,
        ozelBas,
        ozelBit,
        site,
        setSite: setSiteAlan,
        setAralikAdi: setAralikAdiIc,
        setOzel: (b, s) => {
          setOzelBas(b)
          setOzelBit(s)
          setAralikAdiIc('Özel')
        },
      }}
    >
      {children}
    </VeriContext.Provider>
  )
}

export function useVeri() {
  const c = useContext(VeriContext)
  if (!c) throw new Error('useVeri sadece VeriProvider içinde kullanılır')
  return c
}
