# AVIO Studio — Web Analitik Platformu (Geliştirme)

AVIO'nun kendi web analitik sistemi. Amaç: yaptığımız müşteri sitelerinde Google Analytics,
Search Console, Bing ve Clarity'ye muhtaç kalmadan ziyaretçi, performans ve davranış verisini
kendi sistemimizde toplamak.

> **Bu depo GELİŞTİRME (laboratuvar) sürümüdür.** Denemeler burada yapılır.
> Temiz kod ayrıca production klasörüne aktarılır; production elle düzenlenmez.

## Durum

Şu an **taslak aşaması**: ekranlar kurulu ve çalışıyor, ama veriler **sahte**.
Supabase, takip kodu ve gerçek veri akışı henüz bağlanmadı.

## Kurulum

```bash
npm install
npm run dev
```

Uygulama `http://localhost:5191` adresinde açılır.

`.env` gerekmez — boşken uygulama taslak modunda çalışır (giriş atlanır, sahte veri gösterilir).
Gerçek Supabase'e bağlamak için `.env.example` dosyasını `.env` olarak kopyalayıp doldur.

## Yığın

React 19 · Vite · TypeScript · Tailwind 4 · shadcn/ui (Radix) · Supabase · lucide · Recharts

## Klasörler

| Yol | İçerik |
|---|---|
| `planning/PLAN.md` | **Projenin tüm planı.** Kararlar, gerekçeler, KVKK notları, tuzaklar. Önce burayı oku. |
| `src/lib/veri.tsx` | Sahte veri motoru — tarih aralığına ve seçili siteye göre veri üretir. Gerçek sisteme geçince burası Supabase'e bağlanacak. |
| `src/lib/mock.ts` | Sahte verinin temel şekilleri ve etiketleri. |
| `src/components/analytics/` | Analytics bölümleri (ziyaretçi, içerik, davranış, teknik). |
| `src/components/ui/` | shadcn bileşenleri (kopyalanmış kaynak — bizim dosyalarımız). |

## Ekranlar

**Dashboard** · **Siteler** · **Analytics** (12 sekmeli derin sayfa) · **Raporlar** · **Ayarlar**

Analytics sekmeleri: Genel Özet · Ziyaretçiler · Konum · Sayfalar · Kaynaklar · Cihaz ·
Isı Haritası · Kayıtlar · Dönüşüm · Hız · SEO · Gizlilik
