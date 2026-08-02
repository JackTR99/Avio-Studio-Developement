/**
 * TASLAK VERİSİ — hepsi uydurma.
 * Gerçek sisteme geçince bu dosyanın yerini Supabase sorguları alacak.
 * Ekranlar SADECE buradan okur; veri kaynağı değişince ekranlar değişmez.
 */

/* ---------------------------------------------------------------- 1. ZİYARETÇİ */

export type Metrik = {
  id: number // 68'lik özellik listesindeki numara
  etiket: string
  deger: string
  degisim: number
  tahmini?: boolean
  aciklama?: string
}

export const ziyaretciMetrikleri: Metrik[] = [
  {
    id: 1,
    etiket: 'Ziyaretçi',
    deger: '8.412',
    degisim: 12.4,
    tahmini: true,
    aciklama:
      'Onay vermeyen ziyaretçilerin kodu her gün değişir. 30 günü toplarsak aynı kişi defalarca sayılır. Onay verenlerden çıkardığımız şişme katsayısıyla düzeltiyoruz. Bu yüzden başında ~ var.',
  },
  { id: 2, etiket: 'Görüntülenen Sayfa', deger: '23.905', degisim: 8.1 },
  { id: 68, etiket: 'Kişi Başına Sayfa', deger: '2,84', degisim: 3.2 },
  { id: 3, etiket: 'Ziyaret Sayısı', deger: '10.677', degisim: -1.6 },
  { id: 4, etiket: 'Ort. Ziyaret Süresi', deger: '2:14', degisim: 6.0 },
]

export const ekMetrikler: Metrik[] = [
  { id: 5, etiket: 'Hemen Çıkma Oranı', deger: '%38,2', degisim: -4.1 },
  { id: 6, etiket: 'Yeni Ziyaretçi', deger: '%64', degisim: 2.8 },
]

/** 8 — zaman grafiği (30 günlük ziyaretçi) */
export const zamanSerisi: { gun: string; ziyaretci: number; onceki: number }[] = [
  240, 268, 255, 289, 310, 402, 388, 295, 301, 330, 355, 372, 410, 395, 350, 366, 380, 404, 425,
  460, 448, 402, 395, 412, 438, 470, 492, 466, 430, 455,
].map((v, i) => ({
  gun: `${i + 1}`,
  ziyaretci: v,
  onceki: Math.round(v * (0.82 + ((i * 7) % 13) / 100)),
}))

/** 7 — canlı ziyaretçi (anlık) */
export const canliBaslangic = 23

/* ---------------------------------------------------------------- 2. KONUM */

export type Konum = { ad: string; bayrak: string; sayi: number; yuzde: number }

export const ulkeler: Konum[] = [
  { ad: 'Türkiye', bayrak: '🇹🇷', sayi: 6240, yuzde: 74 },
  { ad: 'Almanya', bayrak: '🇩🇪', sayi: 742, yuzde: 9 },
  { ad: 'Hollanda', bayrak: '🇳🇱', sayi: 418, yuzde: 5 },
  { ad: 'İngiltere', bayrak: '🇬🇧', sayi: 301, yuzde: 4 },
  { ad: 'Fransa', bayrak: '🇫🇷', sayi: 196, yuzde: 2 },
  { ad: 'Diğer', bayrak: '🌍', sayi: 515, yuzde: 6 },
]

export const sehirler: Konum[] = [
  { ad: 'Manisa', bayrak: '📍', sayi: 2810, yuzde: 45 },
  { ad: 'İzmir', bayrak: '📍', sayi: 1935, yuzde: 31 },
  { ad: 'İstanbul', bayrak: '📍', sayi: 812, yuzde: 13 },
  { ad: 'Ankara', bayrak: '📍', sayi: 405, yuzde: 6 },
  { ad: 'Bursa', bayrak: '📍', sayi: 278, yuzde: 5 },
]

export const ilceler: Konum[] = [
  { ad: 'Şehzadeler', bayrak: '📍', sayi: 1240, yuzde: 44 },
  { ad: 'Yunusemre', bayrak: '📍', sayi: 986, yuzde: 35 },
  { ad: 'Turgutlu', bayrak: '📍', sayi: 342, yuzde: 12 },
  { ad: 'Salihli', bayrak: '📍', sayi: 242, yuzde: 9 },
]

/* ---------------------------------------------------------------- 3. SAYFALAR */

export type SayfaSatiri = {
  yol: string
  goruntuleme: number
  ortSure: string
  cikisOrani: number
}

export const enCokGezilen: SayfaSatiri[] = [
  { yol: '/', goruntuleme: 8420, ortSure: '1:12', cikisOrani: 22 },
  { yol: '/tedaviler/seffaf-plak', goruntuleme: 4180, ortSure: '3:04', cikisOrani: 31 },
  { yol: '/fiyatlar', goruntuleme: 3260, ortSure: '2:41', cikisOrani: 44 },
  { yol: '/blog/diş-teli-agri', goruntuleme: 2915, ortSure: '4:22', cikisOrani: 68 },
  { yol: '/iletisim', goruntuleme: 2140, ortSure: '0:58', cikisOrani: 18 },
  { yol: '/hakkimizda', goruntuleme: 1580, ortSure: '1:35', cikisOrani: 29 },
  { yol: '/blog/ortodonti-nedir', goruntuleme: 1415, ortSure: '5:10', cikisOrani: 72 },
]

export const girisSayfalari: SayfaSatiri[] = [
  { yol: '/', goruntuleme: 5120, ortSure: '1:12', cikisOrani: 22 },
  { yol: '/blog/diş-teli-agri', goruntuleme: 2310, ortSure: '4:22', cikisOrani: 68 },
  { yol: '/tedaviler/seffaf-plak', goruntuleme: 1840, ortSure: '3:04', cikisOrani: 31 },
  { yol: '/fiyatlar', goruntuleme: 940, ortSure: '2:41', cikisOrani: 44 },
]

export const cikisSayfalari: SayfaSatiri[] = [
  { yol: '/blog/ortodonti-nedir', goruntuleme: 1020, ortSure: '5:10', cikisOrani: 72 },
  { yol: '/blog/diş-teli-agri', goruntuleme: 985, ortSure: '4:22', cikisOrani: 68 },
  { yol: '/fiyatlar', goruntuleme: 830, ortSure: '2:41', cikisOrani: 44 },
  { yol: '/', goruntuleme: 610, ortSure: '1:12', cikisOrani: 22 },
]

/** 14 — gezinti yolu */
export const gezintiYollari: { adimlar: string[]; sayi: number }[] = [
  { adimlar: ['/', '/tedaviler/seffaf-plak', '/iletisim'], sayi: 412 },
  { adimlar: ['/', '/fiyatlar', '/iletisim'], sayi: 358 },
  { adimlar: ['/blog/diş-teli-agri', '/', '/fiyatlar'], sayi: 246 },
  { adimlar: ['/', '/hakkimizda'], sayi: 198 },
]

/** 16 — 404 hataları */
export const hata404: { yol: string; sayi: number; kaynak: string }[] = [
  { yol: '/tedavi/plak', sayi: 84, kaynak: 'Google' },
  { yol: '/blog/eski-yazi', sayi: 41, kaynak: 'Direkt' },
  { yol: '/randevu.html', sayi: 22, kaynak: 'Facebook' },
]

/* ---------------------------------------------------------------- 4. KAYNAK */

export type Kaynak = { ad: string; sayi: number; yuzde: number; tur: string }

export const trafikKaynaklari: Kaynak[] = [
  { ad: 'Google (organik)', sayi: 5240, yuzde: 62, tur: 'Arama' },
  { ad: 'Doğrudan', sayi: 1680, yuzde: 20, tur: 'Direkt' },
  { ad: 'Instagram', sayi: 842, yuzde: 10, tur: 'Sosyal' },
  { ad: 'Bing (organik)', sayi: 336, yuzde: 4, tur: 'Arama' },
  { ad: 'Yönlendiren siteler', sayi: 314, yuzde: 4, tur: 'Referrer' },
]

export const yonlendirenSiteler: { site: string; sayi: number }[] = [
  { site: 'sikayetvar.com', sayi: 96 },
  { site: 'dishekimleri.org', sayi: 74 },
  { site: 'manisahaber.com', sayi: 62 },
  { site: 'forum.saglik.net', sayi: 48 },
]

export const utmKampanyalari: {
  kampanya: string
  kaynak: string
  ziyaret: number
  donusum: number
}[] = [
  { kampanya: 'bahar-indirim', kaynak: 'instagram', ziyaret: 480, donusum: 34 },
  { kampanya: 'seffaf-plak-tanitim', kaynak: 'google-ads', ziyaret: 362, donusum: 41 },
  { kampanya: 'blog-yeniden-hedefleme', kaynak: 'facebook', ziyaret: 155, donusum: 8 },
]

/* ---------------------------------------------------------------- 5. CİHAZ */

export type Dagilim = { ad: string; yuzde: number; sayi: number }

export const cihazTuru: Dagilim[] = [
  { ad: 'Telefon', yuzde: 71, sayi: 5972 },
  { ad: 'Bilgisayar', yuzde: 24, sayi: 2019 },
  { ad: 'Tablet', yuzde: 5, sayi: 421 },
]

export const tarayicilar: Dagilim[] = [
  { ad: 'Chrome', yuzde: 52, sayi: 4374 },
  { ad: 'Safari', yuzde: 34, sayi: 2860 },
  { ad: 'Samsung Internet', yuzde: 8, sayi: 673 },
  { ad: 'Edge', yuzde: 4, sayi: 336 },
  { ad: 'Firefox', yuzde: 2, sayi: 169 },
]

export const isletimSistemleri: Dagilim[] = [
  { ad: 'iOS', yuzde: 41, sayi: 3449 },
  { ad: 'Android', yuzde: 35, sayi: 2944 },
  { ad: 'Windows', yuzde: 18, sayi: 1514 },
  { ad: 'macOS', yuzde: 6, sayi: 505 },
]

export const ekranOlculeri: Dagilim[] = [
  { ad: '390 × 844', yuzde: 28, sayi: 2355 },
  { ad: '414 × 896', yuzde: 19, sayi: 1598 },
  { ad: '1920 × 1080', yuzde: 15, sayi: 1262 },
  { ad: '360 × 800', yuzde: 12, sayi: 1009 },
  { ad: '1440 × 900', yuzde: 9, sayi: 757 },
]

export const diller: Dagilim[] = [
  { ad: 'Türkçe (tr-TR)', yuzde: 82, sayi: 6898 },
  { ad: 'Almanca (de-DE)', yuzde: 9, sayi: 757 },
  { ad: 'İngilizce (en-US)', yuzde: 6, sayi: 505 },
  { ad: 'Hollandaca (nl-NL)', yuzde: 3, sayi: 252 },
]

/** 29 — bağlantı türü (site optimizasyonu için) */
export const baglantiTurleri: (Dagilim & { ortHiz: string })[] = [
  { ad: '4G', yuzde: 44, sayi: 3701, ortHiz: '12 Mbps' },
  { ad: 'Wifi', yuzde: 38, sayi: 3197, ortHiz: '48 Mbps' },
  { ad: '5G', yuzde: 13, sayi: 1094, ortHiz: '96 Mbps' },
  { ad: '3G / yavaş', yuzde: 5, sayi: 420, ortHiz: '2 Mbps' },
]

/* ---------------------------------------------------------------- 6. DAVRANIŞ */

/** 30-32 — ısı haritası noktaları (x,y yüzde olarak, agirlik = yoğunluk) */
function nokta(x: number, y: number, agirlik: number) {
  return { x, y, agirlik }
}

export const isiHaritasi = {
  tiklama: [
    nokta(50, 12, 1), nokta(50, 13, 0.9), nokta(48, 12, 0.8),
    nokta(78, 8, 0.7), nokta(22, 8, 0.5),
    nokta(50, 46, 1), nokta(52, 47, 0.85), nokta(49, 45, 0.7),
    nokta(30, 62, 0.5), nokta(70, 62, 0.45),
    nokta(50, 84, 0.9), nokta(51, 85, 0.75),
  ],
  kaydirma: [
    nokta(50, 10, 1), nokta(50, 25, 0.95), nokta(50, 40, 0.82),
    nokta(50, 55, 0.61), nokta(50, 70, 0.38), nokta(50, 85, 0.19),
  ],
  hareket: [
    nokta(46, 15, 0.8), nokta(52, 20, 0.9), nokta(58, 30, 0.7),
    nokta(40, 38, 0.6), nokta(50, 48, 1), nokta(62, 55, 0.55),
    nokta(35, 66, 0.45), nokta(55, 78, 0.5), nokta(48, 88, 0.4),
  ],
}

/** 34 — sinirli tıklama (rage click) */
export const sinirliTiklama: { yol: string; ogesi: string; sayi: number }[] = [
  { yol: '/fiyatlar', ogesi: 'Randevu Al butonu', sayi: 62 },
  { yol: '/iletisim', ogesi: 'Form gönder', sayi: 28 },
  { yol: '/', ogesi: 'Menü ikonu', sayi: 14 },
]

/** 35 — boşa tıklama (dead click) */
export const bosaTiklama: { yol: string; ogesi: string; sayi: number }[] = [
  { yol: '/', ogesi: 'Hero görseli (buton sanılıyor)', sayi: 141 },
  { yol: '/tedaviler/seffaf-plak', ogesi: 'Fiyat rozeti', sayi: 87 },
  { yol: '/hakkimizda', ogesi: 'Doktor fotoğrafı', sayi: 39 },
]

/* ---------------------------------------------------------------- 7. REPLAY */

export type Kayit = {
  id: string
  yol: string
  sure: number // saniye
  cihaz: string
  ekran: string
  ulke: string
  olay: number
  sinirli: boolean
  tarih: string
}

export const kayitlar: Kayit[] = [
  { id: 'k-9182', yol: '/fiyatlar', sure: 184, cihaz: 'iPhone 15 Pro', ekran: '393×852', ulke: '🇹🇷 Manisa', olay: 42, sinirli: true, tarih: '01.08 14:22' },
  { id: 'k-9181', yol: '/', sure: 96, cihaz: 'Samsung S23', ekran: '360×800', ulke: '🇹🇷 İzmir', olay: 21, sinirli: false, tarih: '01.08 13:58' },
  { id: 'k-9180', yol: '/tedaviler/seffaf-plak', sure: 312, cihaz: 'MacBook Pro', ekran: '1440×900', ulke: '🇩🇪 Berlin', olay: 68, sinirli: false, tarih: '01.08 13:11' },
  { id: 'k-9179', yol: '/iletisim', sure: 58, cihaz: 'iPhone 13', ekran: '390×844', ulke: '🇹🇷 İstanbul', olay: 12, sinirli: true, tarih: '01.08 12:40' },
  { id: 'k-9178', yol: '/blog/diş-teli-agri', sure: 421, cihaz: 'Windows PC', ekran: '1920×1080', ulke: '🇹🇷 Ankara', olay: 91, sinirli: false, tarih: '01.08 11:05' },
]

/* ---------------------------------------------------------------- 8. OLAY / DÖNÜŞÜM */

export const olaylar: { ad: string; sayi: number; degisim: number }[] = [
  { ad: 'Randevu formu gönderildi', sayi: 148, degisim: 18.2 },
  { ad: 'WhatsApp tıklaması', sayi: 322, degisim: 24.6 },
  { ad: 'Telefon tıklaması', sayi: 214, degisim: -3.1 },
  { ad: 'Fiyat listesi açıldı', sayi: 640, degisim: 9.4 },
  { ad: 'Video oynatıldı', sayi: 96, degisim: 12.0 },
]

export const hedefler: { ad: string; kural: string; aktif: boolean; sayi: number }[] = [
  { ad: 'Randevu talebi', kural: 'form gönderimi = /iletisim', aktif: true, sayi: 148 },
  { ad: 'WhatsApp lead', kural: 'tıklama = wa.me linki', aktif: true, sayi: 322 },
  { ad: 'Telefon lead', kural: 'tıklama = tel: linki', aktif: true, sayi: 214 },
  { ad: 'Fiyat ilgisi', kural: 'görüntüleme = /fiyatlar', aktif: false, sayi: 3260 },
]

/** 41 — huni */
export const huni: { adim: string; sayi: number }[] = [
  { adim: 'Siteye giriş', sayi: 8412 },
  { adim: 'Tedavi sayfası', sayi: 4180 },
  { adim: 'Fiyat sayfası', sayi: 3260 },
  { adim: 'İletişim sayfası', sayi: 2140 },
  { adim: 'Form gönderildi', sayi: 148 },
]

export const disLinkler: { hedef: string; sayi: number }[] = [
  { hedef: 'wa.me/905xxxxxxx', sayi: 322 },
  { hedef: 'instagram.com/klinik', sayi: 118 },
  { hedef: 'maps.google.com/...', sayi: 96 },
]

export const indirmeler: { dosya: string; sayi: number }[] = [
  { dosya: 'fiyat-listesi-2026.pdf', sayi: 214 },
  { dosya: 'tedavi-sonrasi-bakim.pdf', sayi: 88 },
]

/* ---------------------------------------------------------------- 9. HIZ */

export type Vitals = {
  ad: string
  kod: string
  deger: string
  durum: 'iyi' | 'orta' | 'kotu'
  aciklama: string
}

export const webVitals: Vitals[] = [
  { ad: 'En büyük içerik', kod: 'LCP', deger: '1,9 sn', durum: 'iyi', aciklama: 'Sayfanın en büyük parçası ne kadar sürede göründü.' },
  { ad: 'Tıklama tepkisi', kod: 'INP', deger: '164 ms', durum: 'iyi', aciklama: 'Kullanıcı tıkladığında sayfa ne kadar hızlı cevap verdi.' },
  { ad: 'Kayma', kod: 'CLS', deger: '0,14', durum: 'orta', aciklama: 'Sayfa yüklenirken içerik ne kadar zıpladı.' },
  { ad: 'İlk boya', kod: 'FCP', deger: '1,2 sn', durum: 'iyi', aciklama: 'Ekranda ilk şey ne zaman göründü.' },
  { ad: 'Sunucu cevabı', kod: 'TTFB', deger: '0,7 sn', durum: 'orta', aciklama: 'Sunucu ilk baytı ne kadar sürede yolladı.' },
]

export const hizZaman: { gun: string; lcp: number; inp: number }[] = [
  2.6, 2.5, 2.4, 2.4, 2.2, 2.3, 2.1, 2.0, 2.1, 1.9, 1.9, 2.0, 1.8, 1.9, 1.9,
].map((v, i) => ({ gun: `${i + 1}`, lcp: v, inp: 0.14 + (i % 5) * 0.01 }))

export const sayfaHizlari: { yol: string; lcp: string; cls: string; durum: 'iyi' | 'orta' | 'kotu' }[] = [
  { yol: '/blog/diş-teli-agri', lcp: '4,1 sn', cls: '0,31', durum: 'kotu' },
  { yol: '/fiyatlar', lcp: '2,6 sn', cls: '0,18', durum: 'orta' },
  { yol: '/tedaviler/seffaf-plak', lcp: '2,1 sn', cls: '0,09', durum: 'iyi' },
  { yol: '/', lcp: '1,6 sn', cls: '0,04', durum: 'iyi' },
]

export const lighthouse: { ad: string; puan: number }[] = [
  { ad: 'Performans', puan: 84 },
  { ad: 'Erişilebilirlik', puan: 96 },
  { ad: 'En İyi Uygulamalar', puan: 92 },
  { ad: 'SEO', puan: 100 },
]

export const lighthouseGecmis: { tarih: string; puan: number }[] = [
  { tarih: 'Mar', puan: 62 },
  { tarih: 'Nis', puan: 68 },
  { tarih: 'May', puan: 71 },
  { tarih: 'Haz', puan: 79 },
  { tarih: 'Tem', puan: 81 },
  { tarih: 'Ağu', puan: 84 },
]

/** 49 — JS hataları */
export const jsHatalari: { mesaj: string; yol: string; kisi: number; dosya: string }[] = [
  { mesaj: "Cannot read properties of null (reading 'addEventListener')", yol: '/fiyatlar', kisi: 43, dosya: 'form.js:22' },
  { mesaj: 'Failed to fetch', yol: '/iletisim', kisi: 18, dosya: 'iletisim.js:104' },
  { mesaj: "undefined is not a function", yol: '/', kisi: 7, dosya: 'slider.js:58' },
]

/* ---------------------------------------------------------------- 10. SEO */

export type AramaSatiri = {
  kelime: string
  tiklama: number
  gosterim: number
  ctr: number
  sira: number
  degisim: number
}

export const aramaKelimeleri: AramaSatiri[] = [
  { kelime: 'manisa ortodonti', tiklama: 412, gosterim: 5240, ctr: 7.9, sira: 2.1, degisim: 1.4 },
  { kelime: 'şeffaf plak fiyat', tiklama: 318, gosterim: 8910, ctr: 3.6, sira: 5.8, degisim: -0.9 },
  { kelime: 'diş teli ağrı yapar mı', tiklama: 286, gosterim: 12400, ctr: 2.3, sira: 8.2, degisim: 2.6 },
  { kelime: 'manisa diş teli', tiklama: 204, gosterim: 3120, ctr: 6.5, sira: 3.4, degisim: 0.7 },
  { kelime: 'ortodonti nedir', tiklama: 158, gosterim: 21600, ctr: 0.7, sira: 14.2, degisim: -3.1 },
  { kelime: 'şeffaf plak manisa', tiklama: 142, gosterim: 1980, ctr: 7.2, sira: 1.8, degisim: 0.4 },
]

export const indexDurumu: { durum: string; sayi: number; renk: string }[] = [
  { durum: 'Dizine eklendi', sayi: 142, renk: 'emerald' },
  { durum: 'Taranmadı', sayi: 8, renk: 'amber' },
  { durum: 'Hariç tutuldu', sayi: 21, renk: 'slate' },
  { durum: 'Hata', sayi: 3, renk: 'red' },
]

export const motorKarsilastirma: { motor: string; tiklama: number; gosterim: number; ctr: number }[] = [
  { motor: 'Google', tiklama: 1520, gosterim: 53250, ctr: 2.9 },
  { motor: 'Bing', tiklama: 186, gosterim: 9410, ctr: 2.0 },
]

/* ---------------------------------------------------------------- 11. GİZLİLİK */

export const onayDurumu = { kabul: 5210, ret: 3202, kabulYuzde: 62 }

export const saklamaSureleri: {
  veri: string
  sure: string
  kalanGun: number
  durum: 'normal' | 'uyari' | 'kritik'
}[] = [
  { veri: 'Ziyaret kayıtları (replay)', sure: '6 ay', kalanGun: 12, durum: 'uyari' },
  { veri: 'Isı haritası ham noktaları', sure: '3 ay', kalanGun: 2, durum: 'kritik' },
  { veri: 'Oturum satırları', sure: '6 ay', kalanGun: 88, durum: 'normal' },
  { veri: 'Olay kayıtları', sure: '12 ay', kalanGun: 210, durum: 'normal' },
  { veri: 'Günlük özetler', sure: 'Süresiz (anonim)', kalanGun: -1, durum: 'normal' },
]

export const imhaGecmisi: { tarih: string; veri: string; adet: number; yontem: string }[] = [
  { tarih: '01.07.2026', veri: 'Isı haritası ham noktaları', adet: 1284000, yontem: 'Özete çevrildi + silindi' },
  { tarih: '01.06.2026', veri: 'Ziyaret kayıtları', adet: 4120, yontem: 'Anonimleştirildi + silindi' },
  { tarih: '01.05.2026', veri: 'Oturum satırları', adet: 38400, yontem: 'Özete çevrildi + silindi' },
]

export const botFiltresi = { toplam: 14208, bot: 5796, insan: 8412, botYuzde: 41 }

/* ---------------------------------------------------------------- 12. SİTELER */

export type Site = {
  alan: string
  ad: string
  durum: 'aktif' | 'beklemede'
  ziyaretci: number
  degisim: number
  lcp: string
  anahtar: string
}

export const siteler: Site[] = [
  { alan: 'manisaortodonti.com', ad: 'Dr. İrem Sayhan', durum: 'aktif', ziyaretci: 8412, degisim: 12.4, lcp: '1,9 sn', anahtar: 'avio_sk_7f2a9c31' },
  { alan: 'drmustafaerol.com', ad: 'Dr. Mustafa Erol', durum: 'aktif', ziyaretci: 12960, degisim: 4.8, lcp: '2,3 sn', anahtar: 'avio_sk_b41e08da' },
  { alan: 'idealofis.com', ad: 'idealofis', durum: 'beklemede', ziyaretci: 0, degisim: 0, lcp: '—', anahtar: 'avio_sk_c90d5511' },
]

/* ---------------------------------------------------------------- 13. RAPOR */

export const raporlar: { ad: string; kapsam: string; sonCalisma: string; zamanli: boolean }[] = [
  { ad: 'Aylık müşteri raporu', kapsam: 'Ziyaretçi + kaynak + dönüşüm', sonCalisma: '01.08.2026', zamanli: true },
  { ad: 'SEO performans', kapsam: 'Arama kelimeleri + sıralama', sonCalisma: '28.07.2026', zamanli: true },
  { ad: 'Hız denetimi', kapsam: 'Core Web Vitals + Lighthouse', sonCalisma: '15.07.2026', zamanli: false },
]

/* ---------------------------------------------------------------- 14. AYAR */

export const kullanicilar: { email: string; rol: string; sonGiris: string }[] = [
  { email: 'aviomarketingofficial@gmail.com', rol: 'Yönetici', sonGiris: 'Bugün 09:14' },
  { email: 'ekip@avio.com', rol: 'Görüntüleyici', sonGiris: '29.07.2026' },
]

export const baglantilar: { servis: string; durum: 'bagli' | 'bagli-degil'; hesap: string }[] = [
  { servis: 'Google Search Console', durum: 'bagli', hesap: 'aviomarketingofficial@gmail.com' },
  { servis: 'Bing Webmaster Tools', durum: 'bagli-degil', hesap: '—' },
]

export const uyarilar: { ad: string; aciklama: string; acik: boolean }[] = [
  { ad: 'Site yavaşlarsa haber ver', aciklama: 'LCP 2,5 saniyeyi geçerse bildirim gönder', acik: true },
  { ad: 'Veri saklama süresi dolmadan uyar', aciklama: 'Süre dolmasına 10 gün kala bildir', acik: true },
  { ad: 'JS hatası artarsa haber ver', aciklama: 'Günlük hata sayısı iki katına çıkarsa bildir', acik: false },
  { ad: 'Trafik düşerse haber ver', aciklama: 'Ziyaretçi %30 düşerse bildir', acik: false },
]

export const tarihAraliklari = ['Bugün', '7 gün', '30 gün', '3 ay', 'Özel'] as const

/** Tarih aralığına göre rakamları oynatan katsayı (taslakta canlılık için). */
export const araliklarKatsayi: Record<string, number> = {
  Bugün: 0.035,
  '7 gün': 0.24,
  '30 gün': 1,
  '3 ay': 2.85,
  Özel: 1.4,
}
