# AVIO Studio — Web Analitik Platformu · PLANLAMA DOSYASI

> **DURUM: PLANLAMA. SIFIR AKSİYON.**
> Kaan "hadi başlıyoruz" demeden kod yazılmaz, dosya silinmez, kurulum yapılmaz.
> Bu dosyayı Kaan ile Claude birlikte, adım adım dolduruyor. Yönü her zaman Kaan belirler.
> Çalışma şekli: Kaan'ın aklına geldikçe konuşulur, buraya not düşülür. **En sonda bu dosya düzenli dokümanlara çevrilir.**
> Format: Markdown. Hem Claude hem Kaan rahat okusun diye basit dille yazıldı.
>
> **Klasör adı notu:** Bu klasörün adı şimdilik "AVIO Studio Analytics". Sebep: Mac, büyük-küçük harfe bakmaz. "AVIO Studio" adını verseydik, var olan "Avio Studio" klasörüyle çakışırdı. Eski klasörler silinince uygulamanın gerçek adı **AVIO Studio** olacak.

---

## 0. BU SİSTEM NEDİR? (en basit anlatım)

Biz müşterilerimize web sitesi yapıyoruz. Bu sitelere kimlerin girdiğini, sitede ne yaptıklarını ve sitenin ne kadar hızlı çalıştığını görmek istiyoruz.

Bugün bunun için başkalarının araçları kullanılıyor: Google Analytics, Google Search Console, Bing, Microsoft Clarity. Biz bunlara muhtaç kalmak istemiyoruz.

Bu yüzden kendi sistemimizi yapacağız:
1. Sitelerimize kendi küçük takip kodumuzu koyacağız.
2. Bu kod, veriyi bizim veritabanımıza (Supabase) gönderecek.
3. Kendi panelimizde (AVIO Studio) bu veriyi göreceğiz.

### 0.1 Hayal ettiğimiz büyük resim (Kaan'ın vizyonu)

İstenen sistem, şu araçların birleşimi gibi olacak:
- **Google Analytics** gibi: ziyaretçi sayıları ve kaynakları.
- **Microsoft Clarity** gibi: ısı haritaları ve ziyaret kayıtları (replay).
- **Ahrefs + SEMrush** gibi: arama motoru (SEO) verileri.

Hepsi tek bir AVIO panelinde toplanacak.

**Dürüst bir not — neyi yapabiliriz, neyi yapamayız:**

| Parça | Yapabilir miyiz? | Nasıl |
|---|---|---|
| Ziyaretçi sayma, ülke/şehir bilgisi | ✅ Evet, kolay | Kendi takip kodumuz |
| Site hızı ölçümü (Core Web Vitals + Lighthouse) | ✅ Evet | Tarayıcıda ölçüm + Google'ın bedava PageSpeed servisi |
| Isı haritası + ziyaret kaydı (replay) | ✅ Evet | Kendi takip kodumuz (veri büyük olur, dikkatli tasarlanacak) |
| Kendi sitelerimizin Google/Bing arama verisi (hangi kelime, kaç tık, kaçıncı sıra) | ✅ Evet | Google ve Bing'in bedava resmi servisleri |
| Rakip analizi, tüm internetin link haritası, kelime arama hacimleri (Ahrefs/SEMrush'ın kalbi) | ⛔ Şimdilik hayır | Bunun için tüm interneti tarayan dev sistemler gerekir. Çok pahalı. Bu konu ayrı bir karar; şimdilik kapsam dışı. |

Özet: Kendi sitelerimizle ilgili HER veriyi bedava toplayabiliriz. "Tüm internetin verisi" kısmı başka bir dünya; ona ileride bakarız.

---

## 1. KESİNLEŞEN KARARLAR (Kaan onayladı)

1. Veritabanı **Supabase** olacak.
2. Yeni uygulama, eski Studio'dan sadece **giriş (login) ekranını ve genel görünümü (UI)** alacak. Gerisi sıfırdan yazılacak.
3. Uygulamanın yapısı: **Giriş → Dashboard → Analytics**.
4. Toplanacak ana veriler: Lighthouse puanları, Core Web Vitals, ziyaretçi verileri, ülke → şehir → ilçe, ısı haritaları, ziyaret kayıtları (replay).
5. Veri toplama yolu: her siteye küçük bir **AVIO takip kodu** konulacak. Bu kod veriyi **doğrudan Supabase'e** gönderecek.
6. **Değişmez kural:** Sistem, sitelerin Cloudflare kotasından hiçbir şey yememeli. Bu yüzden veri Cloudflare'e değil, doğrudan Supabase'e gider.
7. Öncelik kendi topladığımız veridir. Veriyi, yasaların (KVKK ve GDPR) izin verdiği kadar geniş toplayacağız.
8. Sistemi şimdilik sadece AVIO kullanacak ve raporlama yapacak. İleride ticari kullanıma açılacak.
9. Uygulama `~/Desktop/Applications` klasöründe duracak. Bu Kaan'ın kendi çalışma klasörüdür. Mac'in sistem klasörü olan `/Applications` ile karıştırılmaz; ona asla dokunulmaz.
10. **Silme günü planı:** `~/Desktop/Applications` içindeki her şey silinecek. Tek istisna: **Enhancer**. O iyi çalışıyor ve kalacak. Enhancer, masaüstünde `avio enhancer` adında yeni bir klasöre taşınacak ve içindeki login ekranı kaldırılacak.
11. **Fazlama yok.** Uygulama parça parça değil, tek seferde tam yapılacak. İleri özellikler sonra eklenir.
12. **Planlamanın yönünü Kaan belirler.** Claude kendi kararıyla sıradaki konuya atlamaz.
13. **Veri imha sistemi olacak (KVKK gereği).** Sistem, eskiyen kişisel verileri kendi kendine silecek. Detay §9.2'de.

---

## 2. PLANLAMA KATEGORİLERİ

Sistemi bu başlıklar altında konuşuyoruz. Her başlığı sırayla olgunlaştırıyoruz.

| # | Kategori | İçeriği | Durum |
|---|---|---|---|
| A | Amaç ve Kapsam | Sistem ne, kimin için | Yazıldı (§0) |
| B | Toplanacak Veriler | Tam veri listesi, tek tek | Kaan'ın yönlendirmesini bekliyor |
| C | Verinin Toplanma Yolu | Takip kodu nasıl çalışır | Bekliyor |
| D | Depolama | Supabase tabloları | Taslak yazıldı (§8) |
| E | Mimari ve Paketler | Hangi teknolojiler kullanılacak | Taslak yazıldı (§6) |
| F | Gizlilik ve Yasalar | KVKK, GDPR, rıza | Önemli kısmı yazıldı (§9.1) |
| G | Uygulama Sayfaları | Hangi ekranlar olacak | Taslak yazıldı (§9) |
| H | Çoklu Kullanıcı | İleride ticari satış için hazırlık | Bekliyor |
| I | Rakipler | Piyasadaki araçlar ne yapıyor | Yazıldı (§10) |
| K | Güvenlik | Sahte veri ve erişim koruması | Taslak yazıldı (§7); en sonda derinleşecek |

Not: "Fazlar / yol haritası" kategorisi kaldırıldı, çünkü uygulama tek seferde yapılacak.

---

## 3. AÇIK SORULAR (henüz karar verilmedi)

1. ~~Isı haritasına fare hareketi de eklensin mi?~~ → **CEVAPLANDI:** Evet, eklenecek. Veri çok olduğu için **batch (toplu paket) halinde** gönderilecek — her hareket tek tek değil, biriktirilip topluca. (Batch detayı ilerde netleşecek: kaç saniyede bir, kaç nokta.)
2. Lighthouse ölçümü nasıl çalışsın? Google'ın bedava PageSpeed servisi mi, kendi kurduğumuz Lighthouse mu?
3. Core Web Vitals ölçümünde hazır `web-vitals` kütüphanesi mi kullanılsın, kendi ince kodumuz mu yazılsın?
4. ~~Çerezli mi çerezsiz mi?~~ → **CEVAPLANDI:** İki modlu sistem (bkz. §9.1). Varsayılan çerezsiz; onay veren ziyaretçide detaylı takip.

---

## 4. ERKEN TEKNİK NOTLAR (mimariyi etkileyen gerçekler)

**Site hızı ölçümü iki türlüdür ve ikisi farklı kaynaktan gelir:**
1. **Gerçek kullanıcı ölçümü (Core Web Vitals):** Ziyaretçinin tarayıcısında ölçülür. Beş ana değer vardır: LCP, INP, CLS, FCP, TTFB. Takip kodumuz ölçer ve Supabase'e yollar. Bedava.
2. **Laboratuvar ölçümü (Lighthouse):** Ziyaretçiden gelmez. Biz belli aralıklarla siteyi test ettiririz. Google'ın PageSpeed servisi bunu bedava yapar.

**Ülke/şehir bilgisi:** Ziyaretçinin IP adresinden bulunur. Bu işlem Supabase'in sunucusunda yapılır (Edge Function = Supabase'in sunucuda çalışan küçük kodu). Böylece ziyaretçiden konum izni istemek gerekmez.

**Cloudflare kotası:** Takip kodu veriyi doğrudan `supabase.co` adresine yollar. Site Cloudflare'de dursa bile Cloudflare'e istek gitmez, kota yenmez.

---

## 5. ARAŞTIRMA BULGULARI (doğrulanmış bilgiler)

### 5.1 Vercel Analytics nasıl çalışıyor, kaça?
- Vercel Analytics **freemium**: bedava başlar, aylık olay sınırı vardır, sınır aşılınca paralıdır.
- İki parçası var: ziyaretçi ölçümü (çerezsiz) + hız ölçümü (Core Web Vitals).
- Yöntemi: siteye küçük bir kod koyar, veriyi kendi sunucusuna yollar, ülkeyi IP'den kendi sunucusunda bulur.
- **Bizim için anlamı:** Aynı yöntemi kendimiz kurar ve veriyi kendi Supabase'imize yollarsak, bize bedava olur.
- Not: Vercel, Google'daki arama verisini (kelime, sıralama) VERMEZ. O veri sadece Search Console'dan gelir.

### 5.2 Google/Bing arama verisi nereden gelir?
- Biri Google'da arama yapıp senin sitene tıkladığında, o tıklama **Google'ın kendi sayfasında** olur. Ziyaretçi daha sitene gelmeden Google bunu kaydeder.
- Bu yüzden bizim takip kodumuz bu veriyi **göremez**.
- Kodumuzun görebildiği: ziyaretçinin "Google'dan geldiği" bilgisi (referrer). Bunu bedava görürüz. Ama hangi kelimeyle aradığını göremeyiz.
- Kelime/sıralama verisinin tek kaynağı: **Google Search Console API** ve **Bing Webmaster API**. Siteni doğrularsın, veriyi çekersin: kelime, tıklama, gösterim, sıralama.

### 5.3 Bu servisler paralı mı? (DOĞRULANDI)
- Google'ın resmi sayfası aynen şöyle diyor: *"All use of Google Search Console API is free of charge."* Yani **tamamen bedava**. Sadece günlük istek sınırı var; para istemez. (Kaynak: developers.google.com/webmaster-tools/pricing)
- Bing Webmaster API de **bedava**.

### 5.4 ⚠️ İSİM KARIŞIKLIĞI TUZAĞI — DİKKAT
İsimleri benzeyen ama tamamen farklı iki tür servis var:
- 🟢 **KULLANACAĞIMIZ (BEDAVA):** "Google Search Console API" ve "Bing Webmaster API". Bunlar **kendi sitenin karnesini okur**: sitem hangi kelimede kaçıncı sırada, kaç tık aldı.
- ⛔ **KULLANILMAYACAK (PARALI):** "Google Custom/Programmable Search API" ve "Bing Search API (Azure)". Bunlar **kod ile internette arama yapar** (kendi arama motorunu kurmak gibi). 1000 arama yaklaşık 5 dolar. **Bize gerek yok. Planda yasak.**

---

## 6. MİMARİ VE PAKETLER (taslak — birlikte olgunlaşacak)

Sistem 3 parçadan oluşur.

### 6.1 Panel uygulaması (AVIO Studio — bizim baktığımız ekranlar)
- **React + Vite + TypeScript** — bütün AVIO uygulamalarının standardı.
- **Tailwind + shadcn/ui** — görünüm. Eski Studio'nun login ekranı ve çerçevesi korunuyor.
- **@supabase/supabase-js** — veritabanına bağlanma + giriş sistemi.
- **lucide-react** — ikonlar.
- Grafik kütüphanesi: **birlikte seçilecek.** Adaylar: Recharts (kolay), visx (esnek), Chart.js (klasik).
- Harita kütüphanesi: **birlikte seçilecek.** Adaylar: react-simple-maps (hafif dünya haritası), Leaflet (şehir detayında iyi).
- Isı haritası çizimi: **birlikte seçilecek.** Adaylar: heatmap.js veya kendi canvas kodumuz.

### 6.2 Takip kodu (AVIO tracker — müşteri sitelerine konulan küçük kod)
- **Saf JavaScript, çok küçük (birkaç KB).** İçinde React gibi ağır şeyler YOK. Siteyi yavaşlatmamalı.
- Hız ölçümü: web-vitals mantığı (hazır kütüphane mi, kendi kodumuz mu → birlikte seçilecek).
- Veri gönderme: `sendBeacon` adlı tarayıcı özelliği. Avantajı: ziyaretçi sayfayı kapatırken bile veri kaybolmadan gider.
- Hedef: **doğrudan Supabase.** Cloudflare'e uğramaz, kota yenmez.
- Isı haritası verisi: her hareket değil, örneklenerek (seyreltilmiş) toplanır. Böylece veri şişmez.

### 6.3 Veri kabul + arka uç (Supabase tarafı)
- **Postgres** (veritabanı) + **Edge Functions** (sunucuda çalışan küçük kodlar).
- Edge Function'ın işi sırayla: gelen veriyi doğrular → IP'den ülke/şehri bulur → IP'yi atar → veritabanına yazar.
- IP'den konum bulma kaynağı: **birlikte seçilecek.** Adaylar: MaxMind GeoLite2 (kendi sunucunda, bedava), ip-api (dış servis). KVKK'ya uygun olacak.
- Google Search Console + Bing bağlantısı: bedava, ayrı bir veri kaynağı. Sırası gelince eklenecek.
- Lighthouse: belli aralıklarla PageSpeed servisi üzerinden (bedava). Sırası gelince eklenecek.

### 6.4 Kısıtlar (değişmez kurallar)
- Cloudflare kotası yenmeyecek.
- Takip kodu siteyi yavaşlatmayacak: küçük, arka planda, sayfayı engellemeden çalışır.

---

## 7. GÜVENLİK (taslak — en sonda derinleşecek)

- **Sahte veri koruması:** Her sitenin bir **site anahtarı** olacak. Supabase tarafı ayrıca "bu veri gerçekten bizim sitemizden mi geliyor" diye kaynak adres (origin) kontrolü yapacak. Yabancı yerden gelen veri kabul edilmez.
- **Bot koruması:** İstek sınırı (rate limit) + bilinen botların elenmesi. Böylece ziyaretçi sayıları şişmez.
- **RLS (satır seviyesi güvenlik):** Supabase'in koruma sistemi. Veriyi dışarıdan kimse okuyamaz. Okuma sadece giriş yapmış AVIO panelinden olur. Yazmayı sadece Edge Function yapar.
- **Anahtarlar hep sunucuda:** Gizli anahtarlar (Supabase service key, Google/Bing anahtarları) asla tarayıcıya veya takip koduna konmaz.
- **IP saklanmaz:** IP'den konum bulunur, sonra IP atılır. Sebebi §9.1'de.
- **Panel girişi:** Studio'nun login sistemi + roller. Şimdilik sadece AVIO; ileride müşteri rolleri.
- **Şifreli taşıma:** Bütün bağlantılar HTTPS.

---

## 8. VERİTABANI YAPISI (taslak)

Supabase/Postgres içinde şu tablolar olacak. Kolonlar örnektir; "Toplanacak Veriler" listesi kesinleşince netleşir.

### Ana tablolar
- **`sites`** — takip ettiğimiz siteler. Kolonlar: id, alan adı, site anahtarı, isim, eklenme tarihi. Her müşteri sitesi bir satır.
- **`sessions`** — her ziyaret bir satır. Kolonlar: id, site, anonim ziyaretçi kimliği (hash), başlama zamanı, ülke, şehir, cihaz, tarayıcı, işletim sistemi, ekran ölçüsü, nereden geldi (google/bing/direkt/sosyal), giriş sayfası, bot mu.
  - **Ham IP burada YOK. Neden:** IP, KVKK ve GDPR'a göre kişisel veridir. Saklarsan yasal yük doğar: rıza, silme talebi, saklama süresi takibi. Bize IP değil ülke/şehir lazım. Bu yüzden IP'den konum bulunur bulunmaz IP atılır. Ziyaretçi saymak için IP yerine hash kullanılır. (Bu bir öneriydi; Kaan iki modlu sistemle onayladı — §9.1.)
- **`events`** — sayfa görüntüleme, tıklama, özel olaylar, dönüşümler. Kolonlar: id, oturum, site, tür, adres, zaman, ek bilgi (jsonb).
- **`web_vitals`** — hız ölçümleri. Kolonlar: id, oturum, site, adres, ölçüm adı (LCP/INP/CLS/FCP/TTFB), değer, not (iyi/orta/kötü), zaman.

### Davranış tabloları (büyük veri)
- **`heatmap_events`** — ısı haritası noktaları. Kolonlar: id, site, adres, ekran ölçüsü, tür (tıklama/hareket/kaydırma), x, y, kaydırma derinliği, zaman. Örneklenerek toplanır.
  - **Kaan'ın toplama sistemi (KARAR — detaylandırılacak):** Gün boyu (00:00–24:00) ham noktalar sürekli veritabanına akar. Saatlik aralıklarla ve gün sonunda zamanlanmış görev çalışır: ham noktaları **saatlik ve günlük ısı haritası özetlerine** çevirir ("bu sayfanın şu bölgesine 500 tıklama geldi" gibi). **Özet çıktıktan sonra ham noktalar silinir.** Faydası üç katlı: (1) veritabanı şişmez, (2) panel özetten hızlı çizer, (3) ham veri silme = KVKK imha kuralıyla (§9.2) birebir uyum. Saatlik/günlük/haftalık görünümler hep özetlerden çizilir.
- **`replay_sessions`** — ziyaret kayıtlarının künyesi. Kolonlar: id, oturum, site, adres, ekran ölçüsü, cihaz türü, süre, olay sayısı, depo anahtarı, tarih.
  - **Kaan'ın replay yaklaşımı (kesinleşti):** Ağır ekran/DOM kaydı (Clarity/rrweb yöntemi) YOK. Bunun yerine: sayfa bir koordinat haritası gibi düşünülür. Kullanıcının fare hareketi (x/y, yatay-dikey), tıklamaları ve kaydırması **zaman sırasıyla** kodlanıp kaydedilir. İzleme anında bu veriler veritabanından çekilir ve **kendi oynatıcımız** ziyareti yeniden canlandırır.
  - **Cihaz kaydı gerekli mi? Evet, ama sadece ekran ölçüsü ve cihaz türü/modeli.** Neden: aynı x/y noktası telefonda başka, bilgisayarda başka yere denk gelir. Doğru oynatmak için ekran ölçüsü şarttır. Cihaz modeli de (örnek: iPhone'un Dynamic Island çentiği) oynatıcıda doğru çerçeveyi göstermek için tutulur. Bu kişisel takip değildir (§9.1).
  - Asıl kayıt akışı (koordinat dizisi) büyüktür → Postgres'e değil **nesne deposuna** (MinIO gibi S3-uyumlu depo) yazılır. Postgres'te sadece künye ve işaret durur.
  - Takip kodu doğrudan Supabase'e yollar → Cloudflare'deki statik sitede **bedava** çalışır, kota yenmez.

### SEO tabloları (belli aralıklarla dolar)
- **`search_performance`** — Google/Bing arama verisi. Kolonlar: id, site, kaynak (google/bing), tarih, kelime, sayfa, tıklama, gösterim, ctr, sıralama.
- **`lighthouse_audits`** — Lighthouse sonuçları. Kolonlar: id, site, adres, tarih, performans, erişilebilirlik, seo, best practices, LCP, CLS, TBT.

### Hız tablosu (isteğe bağlı)
- **`daily_stats`** — günlük özetler: tarih, site, ziyaret, sayfa görüntüleme, tekil ziyaretçi, ortalama LCP... Dashboard hızlı açılsın diye ham tablolardan belli aralıklarla derlenir.

### Büyük veri saklama kuralları
- events / heatmap / replay çok yer tutar → saklama süresi + özetleme politikası gerekir. Örnek: ham veri X gün sonra özete çevrilir.
- Bütün tablolar RLS ile korunur: okuma sadece giriş yapmış panel, yazma sadece Edge Function.

---

## 9. SAYFALAR (Kaan sadeleştirdi — 5 üst sayfa)

Login eski Studio'dan geliyor. Giriş sonrası sayfalar:

| # | Sayfa | İçinde ne var |
|---|---|---|
| 1 | **Dashboard** | Genel bakış: tüm siteler / seçili site özeti, hızlı kartlar |
| 2 | **Siteler** | Site listesi, yeni site ekleme (takip kodunu verir), site seçici |
| 3 | **Analytics** | **ASIL DERİN SAYFA.** Seçilen bir siteyi bölüm bölüm inceler: ziyaretçiler · coğrafya (ülke→şehir→ilçe) · trafik kaynakları · sayfalar · performans (CWV + Lighthouse) · ısı haritası · replay · arama/SEO · olaylar/dönüşümler · (aday bölüm: canlı ziyaretçi) |
| 4 | **Raporlar** | Rapor oluşturma, dışa aktarma, zamanlanmış raporlar |
| 5 | **Ayarlar** | Takip kodu, Google/Bing bağlantısı, kullanıcılar, veri saklama, gizlilik |

Eski 13 sayfalık öneri iptal edildi; hepsi Analytics'in içine bölüm olarak girdi. Yeni üst sayfa ancak yeni bir derinlik gerekirse açılır. Her sayfa ileride tek tek, aşırı detaylı yazılacak.

### 9.1 GİZLİLİK — DOĞRULANMIŞ CEVAPLAR (kaynaklı)

**Doğrulanan bilgiler:**
- IP adresi hem KVKK'ya hem GDPR'a göre **kişisel veridir** (AB mahkemesi kararı dahil).
- Konum verisi ve cihaz kimliği de "dolaylı tanımlayıcı" sayılır.
- Kişiyi zaman içinde takip etmek (profilleme) için **açık rıza şarttır**.
- Ama: çerez kullanmayan + IP saklamayan + kişiye bağlanmayan **anonim** ölçüm, **rıza olmadan** yapılabilir. (Google Analytics 4 bile AB'de artık IP saklamıyor.)
- Kaynaklar: cookieyes.com (GDPR ve IP), kvkk.gov.tr ilke kararları, measureu.com (GA IP anonimleştirme).

**KARAR — iki modlu sistem:**

| Mod | Rıza | Ne yapar |
|---|---|---|
| 🟢 **Anonim (varsayılan)** | Gerekmez | Günlük değişen hash → o günün tekil ziyaretçisi sayılır. Kaba konum. Kalıcı takip yok. Parmak izi yok. |
| 🔵 **Onaylı** | Çerez onay kutusu ile açık rıza | Kalıcı hash → "bu ziyaretçi toplam kaç kez geldi" görülür. İlçe seviyesinde konum. Detaylı cihaz bilgisi. Zengin replay. |

**Anonim modda (onay YOKKEN) neler toplanabilir?**
Kural: veri "bu kişi kim" sorusuna cevap vermiyorsa toplanabilir. Buna göre onay olmadan şunlar serbest:
- Hangi sayfayı gezdi (örnek: ana sayfa → fiyatlar → iletişim)
- Her sayfada ne kadar kaldı, toplam ziyaret süresi
- Nereden geldi (Google, Instagram, direkt...)
- Ülke ve şehir (IP'ye bakılır, konum alınır, IP atılır)
- Cihaz türü (telefon/bilgisayar), tarayıcı, işletim sistemi — kaba seviyede
- Ekran ölçüsü
- Site hızı ölçümleri (Core Web Vitals — teknik veri, kişisel değil)
- O günün tekil ziyaretçi sayısı (günlük hash ile)
- Tıklama ve kaydırma noktaları — ısı haritası için (herkesinki üst üste toplanır, kişiye bağlanmaz)
- Olaylar ve dönüşümler ("butona tıklandı", "form gönderildi" — kimlik olmadan)

Onay OLMADAN yapılamayanlar:
- Aynı kişiyi ertesi gün tanımak (kalıcı takip)
- İlçe seviyesi + kişi takibi birleşimi
- Detaylı cihaz modeli biriktirmek (parmak izi)
- Kişiye bağlı zengin replay

**Kaan'ın sorularının net cevapları:**
1. **"İlçe verisi yasal mı?"** → IP saklamadığımız ve veriyi kişiye bağlamadığımız sürece düşük risk, evet. Kişi takibiyle birleşirse rıza (onaylı mod) gerekir.
2. **"Hash ile ziyaret sayısını IP olmadan tutabilir miyiz?"** → Evet. İki hash de sistemde olacak (Kaan kararı): günlük hash herkes için, kalıcı hash sadece onay verenler için.
3. **"Consent butonu mu lazım?"** → Evet, klasik çerez onay kutusu. **Kaan'ın anlayışı DOĞRU:** onay veren ziyaretçinin detaylı verisi (kalıcı takip, ilçe, cihaz detayı) yasal olarak saklanabilir. Onay vermeyen anonim modda izlenir; yine değerli veri gelir. İki şart: buton gerçek seçim olmalı (önceden işaretli kutu geçersiz) + sitede aydınlatma/gizlilik metni olmalı.
4. **"Cihaz modeli (Dynamic Island) kaydı yasal mı?"** → Replay çerçevesi için cihaz türü/modeli = düşük risk, evet. Dikkat: çok fazla cihaz özelliğini birleştirmek "parmak izi" (fingerprinting) sayılır → o ancak onaylı modda yapılır.
5. **"Kabul/ret sayıları toplanabilir mi?"** → Evet, yasal — gri değil. "80 kabul, 20 ret" bir sayaçtır; kimlik yok, KVKK/GDPR kapsamına girmez. Üstelik kabul edenlerin rıza kaydını tutmak (tarih + "evet dedi") GDPR'da **zorunludur** (ispat şartı). Reddedenler için sadece anonim sayaç tutulur. **→ DETAYLANDIRILACAK; yasaya uygun kurgulanacak (Kaan notu).**
6. **"Reddedenlerin tekil sayısı?"** → Günlük tekil ret sayısı net verilir (günlük hash zaten anonim). Aylık "kaç farklı kişi" ise sadece **matematiksel tahmin** olarak verilir ve panelde "tahminidir" diye işaretlenir. (Reddedeni günler arası takip etmek reddini çiğnemek olur — yapılmaz.) **→ DETAYLANDIRILACAK; yasaya uygun kurgulanacak (Kaan notu).**
7. **"Reddedenlerin ısı haritası?"** → Evet, toplanır. Isı haritası havuzdur: herkesin tıklaması üst üste dökülür, kişiye bağlanmaz = anonim = serbest. Yasak olan: reddedenin tek başına oturumunu ayıklayıp izlemek (o replay olur, onay ister). **→ Toplama sistemi taslağı §8'de (Kaan'ın 00:00–24:00 tasarımı). DETAYLANDIRILACAK; yasaya uygun kurgulanacak.**
8. **"Cihaz detay seviyeleri":** Kaba = tür + isim ("telefon, iPhone, Safari, iOS") → anonim modda serbest. Detaylı = tam model + özellik kombinasyonu ("iPhone 15 Pro Max + ekran + fontlar...") → parmak izi riski → sadece onaylı mod. Raporların çoğuna kaba seviye yeter; replay çerçevesi (Dynamic Island) tam model ister → onaylı mod. **→ DETAYLANDIRILACAK; yasaya uygun kurgulanacak (Kaan notu).**

⚖️ Bu bir hukuk görüşü değildir. Ticari satışa çıkmadan önce avukat/DPO teyidi + gizlilik politikası + KVKK aydınlatma metni şarttır.

### 9.2 VERİ İMHA SİSTEMİ (KVKK gereği — Kaan kararı, KESİN — akışı Kaan tasarladı)

KVKK şöyle der: kişisel veriyi sonsuza kadar tutamazsın. Amaç bittiğinde veriyi silmen, yok etmen veya anonim hale getirmen gerekir. Buna "imha" denir.

**Sistemin akışı (Kaan'ın tasarımı):**
1. **Her veri türünün bir saklama süresi olacak.** Örnek süre: **6 ay**. (Hangi veriye kaç ay — birlikte kesinleştirilecek.)
2. **Süre dolmadan sistem UYARI verir.** Panelde bildirim çıkar: "Şu verilerin 6 ayı doluyor."
3. **Sorumluluk kullanıcıdadır.** Bu kural **kullanıcı sözleşmesine** yazılır. Sistem uyarır; karar ve sorumluluk kullanıcının.
4. **Süre dolunca 10 gün ek hak verilir.** Bu 10 günde kullanıcı isterse veriyi dışa aktarır veya gözden geçirir.
5. **10 gün de bitince sistem OTOMATİK imha eder.** Supabase'de zamanlanmış görev (cron) her gün çalışır ve süresi dolanları imha eder.
6. **İmhadan önce anonimleştirme algoritması çalışır.** Bu algoritmayı Kaan ile Claude birlikte, profesyonelce tasarlayacak. İşi: kişisel veriyi anonim özete çevirmek. Örnek: tek tek tıklamalar silinir, ama "bu sayfada o ay 500 tıklama oldu" özeti kalır. Özet kişisel veri değildir; süresiz tutulabilir.
7. **Talep üzerine silme:** Bir ziyaretçi "verimi silin" derse, verisi bulunup silinebilecek. (Onaylı moddaki kalıcı hash bunun için aranabilir olacak.)
8. **İmha kaydı:** Ne zaman, hangi verinin imha edildiği bir kayıt defterine yazılır. KVKK denetiminde bu defter gösterilir.
9. Ayarlar sayfasında **"Veri Saklama"** bölümü olacak: süreler, uyarılar ve imha geçmişi oradan görülür ve yönetilir.

---

## 10. RAKİPLER VE NE YAPTIKLARI

Dört grup var. Her araç için: ne yapar, kaça, kendi sunucunda kurulabilir mi (self-host), biz ondan hangi fikri alıyoruz.

### 10.1 Ziyaretçi sayma araçları (Google Analytics ailesi)

| Araç | Ne yapar (kullanınca ne görürsün) | Ücret | Self-host | Bizim alacağımız fikir |
|---|---|---|---|---|
| **Google Analytics 4** | Siteye kod koyarsın. Panelde ziyaretçi, oturum, olay, dönüşüm, anlık ziyaretçi, kitle ve kaynak raporları görürsün. Çok güçlü ama menüsü karmaşık, öğrenmesi zor. | Bedava (GA360 sürümü paralı) | Hayır | Derinlik örneği. Karmaşıklığından kaçacağız. AB'de gizlilik yüzünden çok eleştirildi. |
| **Plausible** | Tek sade ekran: ziyaretçi, en çok gezilen sayfalar, kaynaklar, ülkeler, hedefler, UTM. Çerez kullanmaz. "5 dakikada anla" felsefesi. | Kendin kurarsan bedava; hazır bulut paralı | Evet | **Gizlilik modelimiz buradan:** çerezsiz + günlük hash. |
| **Umami** | Plausible'ın açık kaynak ikizi. Hafif, sade. | Kendin kurarsan bedava | Evet | Sade veritabanı şeması + hafif takip kodu örneği. |
| **Matomo** | GA'nın tam alternatifi. Ziyaretçi + eklentiyle ısı haritası/replay + dönüşüm hunisi. | Kendin kurarsan bedava; bulut paralı | Evet | KVKK-dostu duruş, IP anonimleştirme örneği. |
| **Cloudflare Web Analytics** | Çok basit, çerezsiz, kur-unut. Derinliği yok. | Bedava | Hayır | Basitlik. (Biz zaten Cloudflare'den bağımsız olacağız.) |
| **Vercel Analytics** | Ziyaretçi + gerçek kullanıcı hız ölçümü (Speed Insights). | Bedava başlar, sınır aşılınca paralı | Hayır | Hız ölçümü (web-vitals) toplama yöntemi. |

### 10.2 Davranış araçları — ısı haritası ve ziyaret kaydı (Clarity ailesi)

| Araç | Ne yapar | Ücret | Self-host | Bizim alacağımız fikir |
|---|---|---|---|---|
| **Microsoft Clarity** | **En büyük ilhamımız.** Isı haritası: ziyaretçiler nereye tıklıyor, nereye kadar kaydırıyor. Ziyaret kaydı (replay): tek tek oturumları film gibi izlersin. Ayrıca "hüsran sinyalleri": rage-click (sinirlenip üst üste tıklama), dead-click (tıkladı ama hiçbir şey olmadı), hızlı geri dönüş. Dönüşüm hunisi de var. | **Tamamen bedava, sınırsız** | Hayır | Isı haritası + replay + hüsran sinyalleri fikri. |
| **Hotjar** | Clarity'ye benzer + ziyaretçiye küçük anketler sorabilirsin (geri bildirim kutusu). | Bedava başlar, paralı | Hayır | Anket/geri bildirim kutusu fikri (ileride). |
| **PostHog** | Replay + ısı haritası + olay/huni/elde tutma + özellik aç-kapa + A/B testi. Geliştirici odaklı, hepsi bir arada. | Bedava başlar; kendin kurarsan bedava | Evet | Davranış + ürün analitiği birleşimi, self-host örneği. |
| **FullStory / LogRocket** | Derin replay + JavaScript hatalarını birlikte kaydeder: "kullanıcı ne yaptı + o anda hangi hata çıktı." | Paralı | Hayır | Replay + hata birleştirme fikri (ileride). |

### 10.3 SEO araçları (arama motoru verisi)

| Araç | Ne yapar | Ücret | Bizim alacağımız fikir |
|---|---|---|---|
| **Ahrefs** | Aşağıda uzun anlatım ↓ | Paralı, pahalı (yaklaşık $129+/ay) | Kendi sitelerimize bakan kısımları bedava yapabiliriz. |
| **SEMrush** | Aşağıda uzun anlatım ↓ | Paralı, pahalı (yaklaşık $139+/ay) | Aynı. |
| **Google Search Console** | Kendi siten için: hangi kelimeyle bulundun, kaç tıklama, kaç gösterim, kaçıncı sıra, dizin (index) durumu, site haritası. | **Bedava (API de bedava)** | **Arama verimizin ana kaynağı.** |
| **Bing Webmaster** | Search Console'un Bing karşılığı. | **Bedava** | İkinci arama kaynağımız. |

**Ahrefs'i açınca ne yaparsın?** (Kaan hiç kullanmadığı için anlatım:)
Ortada bir arama kutusu vardır. Ne yazdığına göre farklı iş yapar:
1. **Rakibinin sitesini yazarsan** → "Site Explorer" açılır: o siteye kimler link vermiş (backlink), hangi kelimelerde kaçıncı sırada, tahmini aylık trafiği ne, en çok trafik getiren sayfaları hangileri. Kısaca **rakip röntgeni**.
2. **Bir kelime yazarsan** → "Keywords Explorer" açılır: bu kelime ayda kaç kez aranıyor, sıralamaya girmek ne kadar zor (KD puanı), benzer kelimeler neler, şu an ilk sayfada kimler var. Kısaca **hangi kelimeyi hedefleyeceğini bulursun**.
3. **Kendi siteni bağlarsan** → "Site Audit": siteni tarar, teknik hataları listeler (kırık link, yavaş sayfa, eksik başlık) ve bir sağlık puanı verir.
4. **Rank Tracker**: seçtiğin kelimelerdeki sıralamanın zamanla değişimini izler.
- **Neden bu kadar pahalı?** Ahrefs, Google gibi tüm interneti kendi sistemleriyle tarar ve dev bir link haritası tutar. Pahalı ve taklit edilemeyen kısım budur.

**SEMrush'ı açınca ne yaparsın?** Ahrefs'e benzer ama daha çok "her şey dahil pazarlama çantası":
1. **Domain Overview**: bir site adresi yazarsın → trafiği, kelimeleri, linkleri, rakipleri tek ekranda görürsün.
2. **Keyword Magic Tool**: dev kelime veritabanı. Bir kelimeden binlerce türev, soru ve arama niyeti çıkarır.
3. **Position Tracking**: kelime sıralamalarını **günlük** izler (kendi siten + rakipler).
4. **Traffic Analytics**: herhangi bir rakibin tahmini ziyaretçi sayısını gösterir (satın alınmış gezinme verisinden).
5. Ek olarak reklam (PPC), sosyal medya ve içerik araçları da vardır. Ahrefs'ten geniştir ama daha karmaşıktır.
- **Pahalılık sebebi aynı:** dev veri tabanları (kelime + link + trafik tahmini).

### 10.4 Ürün/olay analitiği araçları

| Araç | Ne yapar | Ücret |
|---|---|---|
| **Amplitude / Mixpanel / PostHog** | Olay takibi, dönüşüm hunisi (kullanıcı hangi adımda vazgeçiyor), elde tutma (retention), kullanıcı yolculuğu. | Bedava başlar / paralı |

Bizim "olaylar/dönüşümler" bölümüne huni ve kullanıcı yolu fikri buradan gelecek.

### 10.5 BİZİM HARMAN (özet)
- **Ziyaretçi:** Plausible'ın gizlilik modeli + GA'nın derinliği.
- **Davranış:** Clarity'nin ısı haritası + replay + hüsran sinyalleri — ama kendi hafif replay yöntemimizle (§8).
- **Performans:** gerçek kullanıcı ölçümü (web-vitals) + laboratuvar ölçümü (PageSpeed, bedava).
- **SEO:** Google Search Console + Bing (bedava API'ler) — kendi ve müşteri sitelerimiz için.
- Hepsi tek AVIO panelinde. Veri bizim. Gizlilik dostu. Cloudflare kotasına dokunmuyor.

**Net ayrım (tekrar):** Ahrefs/SEMrush'ın *kendi sitelerimizle ilgili* yaptığı her şey bizde bedava yapılabilir: site tarama = Lighthouse; kelime + sıralama = Search Console/Bing; trafik = kendi takip kodumuz. Yapamayacağımız tek şey: *tüm internetin* link ve kelime veritabanı. O kısım kapsam dışı (§0.1).

---

## 12. TOPLANACAK VERİLERİN LİSTESİ (Kaan kararı: HEPSİ olacak)

İşaretler: 🟢 anonim modda serbest · 🔵 sadece onaylı modda · ⚙️ sistemin kendi verisi (ziyaretçiyle ilgisi yok)

**Ziyaret:** açılan sayfa 🟢 · zaman 🟢 · sayfada kalma süresi 🟢 · toplam ziyaret süresi 🟢 · giriş sayfası 🟢 · çıkış sayfası 🟢 · gezinti yolu (sayfa sırası) 🟢

**Kaynak:** referrer (nereden geldi) 🟢 · UTM etiketleri 🟢 · kaynak grubu (organik/sosyal/direkt) 🟢

**Coğrafya:** ülke + şehir 🟢 · ilçe 🔵

**Cihaz ve teknik:** cihaz türü 🟢 · tarayıcı + işletim sistemi (kaba) 🟢 · ekran ölçüsü 🟢 · tarayıcı dili 🟢 · **bağlantı türü (wifi/4G/5G), tahmini hız, veri tasarrufu modu** 🟢 (Kaan: site optimizasyonu için önemli) · tam cihaz modeli 🔵

**Ziyaretçi kimliği:** günlük hash 🟢 · kalıcı hash 🔵 · rıza kaydı + anonim ret sayacı ⚙️

**Davranış:** tıklama noktaları 🟢 · kaydırma derinliği 🟢 · **fare hareketi 🟢 (KARAR: olacak — batch/toplu paketler halinde gönderilecek, tek tek değil)** · hüsran sinyalleri (rage-click, dead-click) 🟢 · replay akışı 🔵

**Olaylar ve dönüşümler:** özel olaylar 🟢 · dönüşümler/lead 🟢 · dış link tıklaması 🟢 · dosya indirme 🟢 · 404 hatası ⚙️ · **JS hataları ⚙️ (KARAR: olacak)**
> JS hatası ne demek: sitedeki kodun sessizce arıza vermesi. Ziyaretçi "Gönder"e basar, hiçbir şey olmaz; menü açılmaz. Ekranda uyarı çıkmaz, ziyaretçi çıkar gider, sahibinin haberi olmaz. Yakalarsak panelde şunu görürüz: "Fiyatlar sayfasında 43 kişide Gönder butonu hata verdi."

**Performans (gerçek kullanıcı):** Core Web Vitals — LCP, INP, CLS, FCP, TTFB 🟢

**Laboratuvar (periyodik):** Lighthouse puanları (performans, erişilebilirlik, SEO, best practices) + detay ölçümler ⚙️

**Arama (periyodik, GSC + Bing):** kelime, tıklama, gösterim, CTR, sıralama ⚙️ · index durumu ⚙️

**Bot filtresi:** bot mu insan mı ⚙️

---

## 13. VERİ DÜZENİ — BİLGİ KİRLİLİĞİNİ ÖNLEME MODELİ (Kaan'ın asıl sorusu)

Kaan'ın uyarısı: "Hepsi olacak ama nasıl yerleştirdiğimiz önemli, yoksa bilgi kirliliği olur." Bunu üç ayrı düzen çözer.

### 13.1 Veri saklama katları (arka tarafta)
| Kat | Ne tutar | Ömür |
|---|---|---|
| Ham | Tek tek tıklamalar, fare hareketleri, replay akışı, olay satırları | Kısa — özet alınınca silinir |
| Saatlik özet | "14:00–15:00 arası şu bölgeye 80 tıklama" | Orta |
| Günlük özet | "Bugün 500 ziyaret, 40 lead" | Uzun |
| Aylık/yıllık özet | Tamamen anonim | Süresiz kalabilir |

**Kural: Ekran hiçbir zaman ham veriden çizmez, hep özetten çizer.** Faydası üç katlı: panel hızlı açılır, veritabanı şişmez, KVKK imha kuralıyla (§9.2) kendiliğinden uyumlu olur.

### 13.2 Bilgi piramidi (ekran tarafında)
| Kat | Nerede | Cevapladığı soru |
|---|---|---|
| 1 | Dashboard — 6 rakam | "İşler iyi mi?" |
| 2 | Analytics bölüm başı — 1 ana grafik + 3-4 rakam | "Nerede iyi, nerede kötü?" |
| 3 | Detay tablo — tıklayınca açılır | "Tam olarak ne oldu?" |
| 4 | Tekil kayıt — replay, tek ziyaret | "O kişi ne yaşadı?" |

**Kural: Bir kat aşağı inmek hep tıklamayla olur. Hiçbir ekran kendi katından fazlasını göstermez.** Bilgi kirliliği tam da bu kural çiğnendiğinde doğar.

### 13.3 ~~Analytics sayfasının 6 bölümü~~ → **İPTAL. Yerleşimi Kaan yapacak.**
> Kaan kararı: "Ben teker teker yerleştireceğim." Claude sadece özellik listesini verir (§15), Kaan konumları söyler, Claude kaydeder ve çizer.
> Aşağıdaki bölümleme sadece geçmiş kayıt olarak duruyor, GEÇERLİ DEĞİL:

| Bölüm | Cevabı | İçindeki veriler |
|---|---|---|
| Genel Bakış | Özet | En önemli rakamlar, hızlı kartlar |
| Kitle | Kim geldi? | Coğrafya, cihaz, bağlantı türü, dil, ziyaretçi sayıları |
| Edinme | Nasıl geldi? | Referrer, UTM, kaynak grubu, Google/Bing arama verisi |
| Davranış | Ne yaptı? | Sayfalar, gezinti yolu, ısı haritası, replay, hüsran sinyalleri, olaylar |
| Performans | Site nasıl çalıştı? | Core Web Vitals, Lighthouse, JS hataları, 404 |
| Dönüşüm | Sonuç aldık mı? | Lead, hedefler, huni |

### 13.4 Kirliliği önleyen 6 kural
1. **Her ekran tek bir soruya cevap verir.** İki soruya cevap veren ekran bölünür.
2. **Aynı veri iki yerde farklı isimle görünmez.** Tek isim, tek tanım.
3. **Varsayılan görünüm sade olur.** Detay "Detayı aç" ile gelir, ekranda hazır durmaz.
4. **Her rakamın yanında tek cümlelik açıklama olur** (üzerine gelince çıkar).
5. **Ham veri ekranda hiç gösterilmez.** Hep özet gösterilir.
6. **Her bölüm aynı iskeleti kullanır:** başlık → ana rakam → grafik → tablo. Kullanıcı bir bölümü öğrenince hepsini öğrenmiş olur.

### 13.5 Veri sözlüğü (tek doğruluk kaynağı)
Her ölçüm için tek bir tanım tutulur: adı, ne demek olduğu, nasıl hesaplandığı, hangi tablodan geldiği, hangi bölümde göründüğü. Böylece aynı şey iki farklı yerde iki farklı şekilde hesaplanmaz. Bu sözlük, sayfaları tek tek yazarken doldurulacak.

---

## 16. ÇALIŞMA YÖNTEMİ VE UYGULAMA PLANI (KESİN — Kaan onayladı)

### 16.1 İki klasör yöntemi (Kaan'ın önerisi)
| Klasör | Ne işe yarar | Port |
|---|---|---|
| **Development** | Burada çalışılır. Dene, boz, yap. **Laboratuvar burasıdır** — ayrı bir Laboratuvar sayfası YOK. | 5191 |
| **Production** | Sadece işe yarayan temiz kod aktarılır. **Elle düzenlenmez.** | 5192 |

Yerler: `~/Desktop/Applications/AVIO Studio` (development) · `~/Desktop/Applications/AVIO Studio Production`
> Kural: Production asla elle düzenlenmez, hep development'tan aktarılır. Yoksa ikisi birbirinden kopar.
> Not: Bu yöntem Kaan'ın İrem sitesinde de kullandığı alışkanlığın aynısı.

### 16.2 Paket seçimi
Baştan seçilmez, development'ta denenir. Tutmayan paket silinir.
Kesin olanlar: React · Vite · TypeScript · Tailwind · shadcn/ui · Supabase · lucide ikonlar.

### 16.3 Adımlar
0. ✅ **Proje kurulumu — BİTTİ.** React 19 + Vite + TypeScript + Tailwind 4 + shadcn/ui + Supabase + lucide + framer-motion + Base UI. Port **5191** (vite.config strictPort + launch.json'da `avio-studio-analytics`). Eski projenin 1900 font paketi GELMEDİ (sadece Geist + Space Grotesk).
1. ✅ **Login + UI kopyalama — BİTTİ.** Eski Avio Studio'dan alınanlar: `pages/Login.tsx`, `auth/AuthContext.tsx`, `lib/supabase.ts`, `components/ui/dropdown-menu.tsx`, AVIO logoları (3 png), `index.css` teması (marka rengi **#c30716**). Video stüdyosundan hiçbir şey gelmedi.
   - **TASLAK MODU:** `.env` boşken uygulama çökmez, giriş atlanır, sahte verilerle açılır. `.env` dolunca giriş ekranı kendiliğinden devreye girer.
   - ⚠️ **Tuzak (çözüldü):** `.env`'de `VITE_SUPABASE_URL=` yazınca değer **boş metin** olur, undefined olmaz → `??` yakalamaz, `createClient` "supabaseUrl is required" ile çöker ve sayfa **sessizce bomboş** kalır (konsolda hata görünmez). Çözüm: `??` yerine `||`.
   - ⚠️ **Tuzak (çözüldü):** Eski projenin `dropdown-menu.tsx`'i Radix değil **Base UI** (`@base-ui/react`) kullanıyor. Radix kurmak işe yaramaz, `@base-ui/react` kurulmalı.
   - Kurulan iskelet: `AppShell` (üst bar + site seçici + profil menüsü + sidebar), 5 sayfa (Dashboard, Siteler, Analytics, Raporlar, Ayarlar), `lib/mock.ts` (sahte veri, tek kaynak).
   - **Direktif 1 yerleşimi kuruldu ve ekranda doğrulandı:** ziyaretçi bloğu (5 ölçüm yan yana, tahmin `~` işareti + açıklama balonu) + hemen altında harita (Dünya › Türkiye › Manisa kırılımı, sağda konum listesi).
   - Ekrandaki siyah yuvarlaklar = 68'lik özellik listesinin numaraları (Kaan yerleşim konuşurken referans versin diye).
2. **Enhancer kurtarma** — `~/Desktop/avio enhancer`'a taşınır, giriş ekranı kaldırılır, motor + modeller korunur.
3. **Silme** ⚠️ — Applications içindeki her şey silinir (Admin Panel, Avio Control Panel, Avio Studio, AVIO Drive). GERİ ALINAMAZ → o an ayrıca onay alınacak.
4. **Ad düzeltme** — klasör adı `AVIO Studio` olur.
5. ✅ **Ekranlar — BİTTİ.** 68 özelliğin hepsi sahte verilerle kuruldu ve ekranda doğrulandı. Hepsi **interaktif**.
   - **Analytics** = 11 sekmeli derin sayfa: Ziyaretçiler · Konum · Sayfalar · Kaynaklar · Cihaz · Isı Haritası · Kayıtlar · Dönüşüm · Hız · SEO · Gizlilik.
   - **Dashboard** (özet + uyarılar), **Siteler** (liste + takip kodu kopyalama), **Raporlar** (seçmeli rapor + dışa aktarma + zamanlı), **Ayarlar** (kullanıcılar + GSC/Bing + bildirimler + imha paneli).
   - Çalışan etkileşimler: tarih aralığı (rakamları değiştirir) · bölüm sekmeleri · sıralanabilir tablolar (başlığa tıkla) · harita kırılımı (Dünya→Türkiye→Manisa) · ısı haritası türü (tıklama/kaydırma/fare) + zaman + mobil görünüm · **replay oynatıcı** (oynat/duraklat/ileri sar, imleç canlanır) · canlı ziyaretçi sayacı · hedef ve bildirim anahtarları · karşılaştırma çizgisi · açılır JS hata listesi · takip kodu kopyalama.
   - Dosyalar: `lib/mock.ts` (tüm sahte veri, tek kaynak) · `components/analytics/parts.tsx` (ortak: tablo, çizgi grafik, halka, çubuk liste, rozet) · `BolumZiyaretci/BolumIcerik/BolumDavranis/BolumTeknik.tsx`.
   - Grafikler şimdilik **kendi SVG kodumuz** — kütüphane seçimi (Recharts/visx vb.) development'ta denenerek yapılacak.

   **5.a — GERÇEKÇİ VERİ MOTORU (Kaan isteği, BİTTİ).** `src/lib/veri.tsx`:
   - Sahte veriler artık sabit değil, **tarih aralığına göre üretiliyor.** Her bileşen tek bir kaynaktan (`useVeri()`) okuyor — gerçek sisteme geçince sadece bu katman Supabase'e bağlanacak, ekranlara dokunulmayacak.
   - **Gerçekçilik:** hafta sonu düşüşü, mevsimsel dalga, organik gürültü, oranların sabit kalıp sayıların ölçeklenmesi, huni oranlarının korunması, CTR'ın tıklama/gösterimden hesaplanması, hız eşiklerine göre iyi/orta/kötü durumunun kendiliğinden değişmesi.
   - **Tohumlu rastgelelik:** aynı aralık → aynı sonuç. Ekran her çizimde zıplamıyor.
   - **Uzun aralıkta otomatik haftalık gruplama** (45 günden uzunsa grafik haftalığa geçer).
   - **Tek günlük filtrede tahmin kapanıyor:** "~" kalkıyor, "KESİN SAYIM" rozeti çıkıyor. Çünkü günlük hash tek günde zaten tekil sayar — şişme yok.
   - **9 — Özel tarih filtresi ÇALIŞIYOR:** başlangıç/bitiş tarih kutuları + hazır kısayollar (Son 14 gün / 60 gün / 6 ay / 1 yıl). Seçilen aralığın gerçek tarihleri ve gün sayısı üstte yazıyor. Tüm ekran o aralığa göre yeniden hesaplanıyor.

   **5.b — NUMARA BULUCU (Kaan isteği, BİTTİ).** Sağ altta küçük kutucuk (`components/OzellikBulucu.tsx` + `lib/ozellikler.ts` + `lib/secim.tsx`):
   - 1-68 arası numara yaz veya oklarla gez → o özelliğin **adı, hangi sayfada ve hangi bölümde** olduğu yazıyor.
   - **"Git ve vurgula"** → ilgili sayfaya/sekmeye götürüyor, ekranı oraya kaydırıyor ve numara rozetini **kırmızı halkayla vurguluyor**.
   - **Arama:** büyüteç ikonuyla isimden arama ("huni" yaz → Dönüşüm hunisi).
   - `lib/ozellikler.ts` = 68 özelliğin kayıt defteri (numara → ad → sayfa → bölüm). Yeni özellik eklenince buraya da yazılacak.
   - ⚠️ Bu bileşen **sadece development içindir**, production'a aktarılırken çıkarılacak.
   - ⚠️ **Tuzak (çözüldü):** Yeni TypeScript `baseUrl`'ü kaldırmış → `tsconfig`'den çıkarılıp sadece `paths` bırakıldı. Ayrıca `src/vite-env.d.ts` şart (yoksa `import.meta.env` ve png importları tip hatası verir).
6. **Gerçek sistem** — Supabase, takip kodu, sahte veri → gerçek veri.
7. **Production'a aktarma.**

### 16.4 Kurallar
1. **Yerleşimi Claude yapar, Kaan üstünde düzenler.** (Kaan değiştirdi — önceki "Kaan teker teker yerleştirir" kuralı iptal.)
2. Production elle düzenlenmez.
3. Silme adımında ayrıca onay alınır.
4. Konuşulan her şey bu dosyaya yazılır.
5. "Başla" denmeden aksiyon yok.

---

## 17. SONRAYA BIRAKILAN — AHREFS TARZI LİNK VERİTABANI (araştırıldı, doğrulandı)

**Ahrefs nasıl çalışıyor:** Kendi robotu sürekli internette geziyor, her sayfadaki linkleri not ediyor ("A sayfası B'ye link vermiş"), sonra o linklere gidip devam ediyor. Sattığı şey bu dev not defteri.

**Ahrefs'in ölçeği (2026):** 35 trilyon link · 28,7 milyar kelime · dakikada 5 milyon sayfa tarama · 661.000 işlemci çekirdeği, 3 PB bellek, 503 PB disk, 3 veri merkezi · buluttan kaçındığı masraf 3 yılda 900 milyon dolar. Googlebot'tan sonra en aktif robot.

**Bizim için 3 gerçekçi yol:**
- **Yol 1 — Common Crawl (BEDAVA, önerilen ilk adım):** Açık tarama arşivi, link haritasını yayınlıyor. Son sürüm (May-Tem 2026): 240,4 milyon site düğümü, 3,7 milyar bağlantı; alan adı düzeyinde 118 milyon düğüm, 2,8 milyar bağlantı. Parquet dosyaları, serbest lisans. **Eksikleri:** Ahrefs'in 35 trilyonuna karşı ~4 milyar (çok küçük); kaç link olduğu ve hangi sayfada bulunduğu bilgisi YOK; ayda bir güncelleniyor (Ahrefs 15 dakikada bir).
- **Yol 2 — Kendi robotumuz, DAR alanda:** Tüm internet imkansız ama "Türkiye'deki sağlık/diş siteleri" gibi birkaç bin sitelik bir alan bir sunucuyla taranabilir. Kendi sektörümüzde Ahrefs'ten güncel oluruz.
- **Yol 3 — Hazır veri satın alma:** DataForSEO, Majestic gibi sağlayıcılar istek başına satıyor. Kendi altyapıdan çok ucuz.

**Kendi sitelerimiz için hiçbirine gerek yok** — Search Console kelimeleri, sıralamayı, tıklamayı zaten bedava veriyor.

**KARAR (Kaan): Kendi botumuzu yapacağız (Yol 2).** Botun nasıl çalışacağını Kaan anlatacak. Buraya geri gelinecek.

### 17.1 KVM8 SUNUCUSU — Kaan alacak, üstünde çalışacaklar
Kaan bir **Hostinger KVM8** (8 vCPU / 32 GB RAM / NVMe, **GPU YOK**) sunucusu alacak. Üstünde şunlar olacak:

| # | Bileşen | Not |
|---|---|---|
| 1 | **Supabase — sadece bucket (dosya deposu) kısmı** | Tam Supabase değil, depolama tarafı |
| 2 | **Yerel AI** | "En hızlı çalışacak en akıllı" — seçim §17.2'de |
| 3 | **Scraper (gelişmiş)** | Ahrefs tarzı kendi botumuz buraya bağlanacak |
| 4 | **Görsel/video hosting** | Müşteri sitelerinin medyası |
| 5 | **n8n** (muhtemelen) | İş akışlarını otomatikleştirme; içinde yerel AI çağrılabilir |
| 6 | **VPS performans paneli** | Sunucunun genel durumunu gösteren ekran — **bu uygulamanın içinde** olacak |

### 17.2 Hangi yerel AI? (araştırıldı — CPU-only gerçeği)
**Kısıt:** KVM8'de GPU yok. AI sadece işlemciyle çalışır. Üstelik 8 çekirdeği scraper, n8n ve hosting ile paylaşacak. 32 GB RAM'in hepsi AI'a ayrılamaz — gerçekçi pay **12-16 GB**.

**Ölçülen hızlar (CPU-only, Q4 sıkıştırma):**
- 7B-14B model → güçlü masaüstü işlemcisinde 10-25 kelime/sn. VPS çekirdeği daha zayıf → gerçekçi **5-12 kelime/sn**.
- 30B+ model → **2-5 kelime/sn** (MoE olsa bile CPU'da yavaş).

**ÖNERİ:**
- **Ana model: Qwen3 8B (Q4)** ~5 GB. Hız/kalite dengesi en iyi olan. Türkçesi güçlü. Sohbet ve metin işleri için yeterince hızlı.
- **Ağır işler için: Qwen3 14B (Q4)** ~9 GB. Daha akıllı ama daha yavaş. n8n'in arka planda çalıştırdığı, acele olmayan işler için uygun.
- **30B ve üstü KURULMASIN** — bu donanımda kullanılamaz derecede yavaş.
- **Önemli:** Scraper'ın işlerinin çoğu (sınıflandırma, veri çıkarma, etiketleme) büyük sohbet modeli gerektirmez. Küçük özel modeller bu işleri 10 kat hızlı yapar. Büyük model sadece gerçekten "akıl" gereken yerlerde çağrılmalı.
- **Uyarı:** AI çalışırken scraper'la aynı çekirdekleri paylaşır. İkisi aynı anda tam güç çalışırsa ikisi de yavaşlar. Çözüm: AI işleri sıraya alınır, scraper boştayken çalışır.

---

## 15. KAAN'IN YERLEŞİM DİREKTİFLERİ (Kaan söyler, Claude kaydeder)

> Not: Yerleşim kuralı DEĞİŞTİ — artık Claude yerleştirir, Kaan üstünde düzenler (bkz. §16.4).
> Aşağıdakiler Kaan'ın verdiği kesin direktiflerdir, geçerlidir.

### DİREKTİF 1 — Ziyaretçi bloğu (tek nokta) + altında harita
**Kural: ziyaretçiyle ilgili her şey TEK bir noktada ölçülecek.** Dağıtılmayacak.

Bu blokta yan yana duracaklar:
1. **Ziyaretçi sayısı** (kaç farklı kişi)
2. **Görüntülenen sayfalar** — ziyaretçi sayısının SAĞINDA
3. **Kişi başına kaç sayfa gezilmiş** — Kaan: "bu önemli"
4. **Ziyaret sayısı** — kesinlikle olacak
5. **Ortalama ziyaret süresi** — bu kısımda yazacak

**Bu bloğun hemen ALTINDA harita olacak.** Haritadan ülke görülecek, istenirse şehir ve ilçeye inilecek.

### TAHMİN SİSTEMİ (Kaan'ın tespiti — KESİN, burada olacak)
**Sorun:** Onay vermeyen ziyaretçinin kodu her gün değişir. Filtre 1 günden uzunsa (örn. 30 gün), günleri toplamak aynı kişiyi defalarca saymak demektir. Sayı şişer.

**Çözüm — şişme katsayısı yöntemi:**
1. Onay **verenlerde** iki rakam da bilinir: gerçek tekil kişi sayısı VE günlük toplamların toplamı.
2. Bu ikisi bölünür → **şişme katsayısı** çıkar. (Örnek: günlük toplam 1300, gerçek 1000 ise katsayı 1,3.)
3. Bu katsayı, onay **vermeyenlerin** günlük toplamına uygulanır → gerçeğe yakın tahmin.
4. Panelde başına **~** konur ve "tahminidir" diye işaretlenir; üzerine gelince nasıl hesaplandığı yazar.

Not: Bu yöntem yasaldır, çünkü kimse takip edilmiyor — sadece istatistik uygulanıyor.

### DİREKTİF 2 — Site seçici sayfaya taşındı (Kaan, KESİN)
**61 numaralı site seçici NAVBARDA DEĞİL, SAYFANIN İÇİNDE olacak.** Uygulandı: `components/SiteSecici.tsx`, Analytics sayfasının başında, tarih seçicinin karşısında duruyor. Üst bar sadeleşti (logo + profil kaldı). Seçicide site adresi + müşteri adı birlikte görünüyor, listede "beklemede" durumu ve "Yeni site ekle" var.

### DİREKTİF 3 — Genel Özet bölümü (Kaan, KESİN)
**Ziyaretçiler'den ÖNCE bir genel özet gelecek.** Uygulandı: Analytics'in **ilk sekmesi = "Genel Özet"** (`BolumOzet.tsx`). Diğer bölümler bir sıra kaydı.
İçeriği (tek ekranda "işler nasıl gidiyor"):
- 4 ana rakam kartı: Ziyaretçi · Dönüşüm (lead) · Site hızı · Aramadan gelen tıklama. Her kart tıklanınca ilgili bölüme götürür.
- **Eğilim** grafiği (önceki dönem karşılaştırmalı).
- **Dikkat gerektiren** kutusu: yavaş sayfalar, JS hataları, sinirli tıklamalar, KVKK saklama süresi dolanlar — hepsi otomatik hesaplanıyor, tıklayınca ilgili bölüme gidiyor.
- Hızlı bakış: en çok gezilen sayfa · en büyük kaynak · en çok takılan yer.

### 6 NUMARA — "YENİ ZİYARETÇİ" ÇEREZ REDDEDİLİRSE NASIL ÖLÇÜLÜR (Kaan sordu, çözüldü)
**Sorun:** Reddedenin kodu her gün değişir → dün geleni bugün tanıyamayız.

**Üç katmanlı çözüm (uygulandı):**
| Kim | Kesinlik | Nasıl |
|---|---|---|
| Gün içinde herkes | **Kesin** | Günlük kod gün boyu sabit → "bugün ilk mi, ikinci mi" ayırt edilir |
| Onay verenler, günler arası | **Kesin** | Kalıcı kod var → "3. kez geliyor" net bilinir |
| Reddedenler, günler arası | **Tahmin** | Bilinemez → onay verenlerde ölçülen gerçek oran uygulanır |

**Ekranda:** Ana rakam `~%63` (tahmini), altında iki etiket: **KESİN** → "Onay verenlerde %62 (5.233 kişi)", **TAHMİN** → "Reddedenlere aynı oran uygulandı". Böylece hangi rakamın sağlam olduğu görünüyor.
**Tek günlük filtrede** `~` kalkıyor, kesin sayım oluyor.
⚠️ **Dürüst uyarı (ipucu balonunda yazıyor):** Onay verenler tüm ziyaretçileri birebir temsil etmeyebilir — çerez kabul edenler biraz farklı davranıyor olabilir.

### DİREKTİF 4 — Site değişince veriler de değişsin (Kaan, UYGULANDI)
Site seçimi artık veri motoruna bağlı. Site değiştirilince **tüm rakamlar, grafikler ve tablolar** o siteye göre yeniden hesaplanıyor.
- Her sitenin kendi büyüklüğü var (`site.ziyaretci` taban alınır) + site adından üretilen sabit tohum → aynı site hep aynı veriyi verir, farklı siteler farklı desen gösterir.
- Test edildi: manisaortodonti.com ~8.665 ziyaretçi / 1.313 dönüşüm → drmustafaerol.com ~12.587 ziyaretçi / 2.410 dönüşüm. Grafik deseni bile değişiyor.
- **Takip kodu kurulmamış site (`beklemede`):** sekmeler ve içerik gizleniyor, yerine "Henüz veri yok — takip kodu eklenmemiş" boş durum ekranı + "Takip kodunu al" butonu çıkıyor.

### DİREKTİF 5 — Genel Özet'te de tahmin mekanizması + bilgi ikonu (Kaan, UYGULANDI)
Genel Özet'teki Ziyaretçi kartında artık `~` işareti, "tahmini" etiketi ve **bilgi ikonu (ⓘ)** var. Üstüne gelince tahmin mekanizmasının açıklaması çıkıyor. Tek günlük filtrede "kesin sayım" yazıyor.

### DİREKTİF 6 — Ekran uyumluluğu (Kaan sordu — BOZUKTU, DÜZELTİLDİ)
**Test sonucu: uygulama mobilde BOZUKTU.** Yan menü ekranın yarısını yiyordu, içerik taşıyordu, ısı haritası ve replay sabit genişlikte ekrandan çıkıyordu.

Yapılan düzeltmeler:
- **Yan menü:** masaüstünde eskisi gibi; mobil/tablette gizli, üst bardaki hamburger ikonuyla açılan **çekmece** (arka plan karartılı, seçince kapanıyor).
- **Üst bar:** dar ekranda "Studio" yazısı ve ayraç gizleniyor, sadece logo kalıyor.
- **Sayfa boşlukları:** mobilde daraltıldı (`px-4` → `sm:px-6`).
- **Tarih seçici:** butonlar tek satırda, gerekirse yatay kayıyor (alt satıra bölünmüyor).
- **Bölüm başlıkları:** mobilde başlık ve kontroller alt alta diziliyor.
- **Isı haritası ve replay:** sabit piksel yerine oranlı (aspect-ratio) — ekrana sığacak şekilde küçülüyor.
- **Numara bulucu:** dar ekranda genişliği ekrana göre ayarlanıyor.
- **Tablolar:** kendi içinde yatay kayıyor, sayfayı taşırmıyor.

**Doğrulama:** 375px'de sayfa genişliği = ekran genişliği (yatay kaydırma YOK). Tablet (768px) ve masaüstü temiz.

### DİREKTİF 7 — Numaralar, numara bulucu ve sayfa başlıkları kaldırıldı (Kaan, UYGULANDI)
Yerleşim konuşmaları bittiği için geliştirme yardımcıları temizlendi:
- **Özellik numarası rozetleri (siyah yuvarlaklar) kaldırıldı** — her ekrandan silindi.
- **Numara bulucu kutucuğu kaldırıldı** (`OzellikBulucu.tsx` ve `ozellikler.ts` silindi). `secim.tsx` kaldı ama sadeleşti: artık yalnızca Genel Özet kartlarının bölümler arası yönlendirmesini taşıyor.
- **Sayfa başlıkları kaldırıldı** (Analytics, Dashboard, Siteler, Raporlar, Ayarlar). Gerekçe (Kaan): "insanlar bulunduğu sayfayı zaten biliyor" — yan menüde hangi sayfada olduğu vurgulu görünüyor. Sayfalar artık doğrudan içerikle başlıyor.
- Kaynak kodda `Bolum` bileşeninin `no` özelliği belge amaçlı duruyor (hangi bölüm 68'lik listenin hangi maddesi) ama **ekranda gösterilmiyor**.

### DİREKTİF 8 — Sayfa içi shadcn bileşenleriyle yeniden kuruldu (Kaan, UYGULANDI)
**Kaan'ın kararı:** her bileşen shadcn'den alınacak, elle yazılmış olanlar değiştirilecek. Gerekçe: hazır tasarım + daha iyi optimizasyon + erişilebilirlik.

**Netleşen önemli bilgi:** shadcn/ui bir paket DEĞİL — kod projeye kopyalanır, dosyalar bizim olur. Bu yüzden "sonra kendimiz yazarız" adımına gerek yok, kurduğun an zaten senin. Yeniden yazmak optimizasyonu iyileştirmez, aksine erişilebilirlik/klavye desteğini bozar.

**Kurulanlar (17 bileşen):** button · card · table · tabs · select · badge · input · switch · tooltip · popover · calendar · separator · skeleton · dialog · scroll-area · chart · dropdown-menu

⚠️ **Tuzak (çözüldü) — iki motor karışması:** Eski Avio Studio'dan kopyaladığım `dropdown-menu` **Base UI** kullanıyordu, CLI'nin kurduğu her şey ise **Radix**. Aynı işi yapan iki motor = şişme + tutarsızlık. Çözüm: `dropdown-menu` CLI'den yeniden alındı (Radix oldu), `@base-ui/react` paketi kaldırıldı. **Artık tek motor: Radix.**
> Not: shadcn Temmuz 2026'da varsayılanı Base UI yaptı ama Radix desteklenmeye devam ediyor. Bizim components.json elle yazıldığı için CLI Radix kurdu; tutarlılık önemli olduğu için Radix'te kalındı. (Base UI'a geçmek istenirse `shadcn init -b base-ui` ile yeniden kurulur.)

**Değiştirilenler:** kendi `Card`'ım → shadcn Card · rozetlerim → Badge · bölüm sekmeleri → Tabs · tablolarım → Table · anahtarlarım → Switch · ipucu balonlarım → Tooltip · özel tarih paneli → Popover · butonlarım → Button.

**Tema kararı:** `--primary` değişkeni **AVIO kırmızısına (#c30716)** bağlandı. Böylece Button, Tabs, Switch gibi tüm shadcn bileşenleri sınıf sınıf ezilmeden kendiliğinden marka rengini kullanıyor. Doğru shadcn yöntemi bu.

⚠️ **Tuzak (çözüldü):** shadcn `CardHeader` varsayılan olarak **grid** kullanıyor; üstüne `flex-col/flex-row` yazmak yetmiyor, `flex` sınıfı da eklenmeli. Yoksa başlığın sağındaki öge alt satıra düşüyor.
⚠️ **Tuzak (çözüldü):** shadcn `Card` kendi içinde `gap-6 py-6` taşıyor. Kendi düzenimizi kuran kartlarda `gap-0 py-0` ile sıfırlanmalı.

**KALAN:** Grafikler hâlâ kendi SVG kodumuz. `chart` bileşeni (Recharts) kurulu ama henüz bağlanmadı — ayrı adım.

### HATA — Genel Özet yönlendirmeleri (Kaan buldu, DÜZELTİLDİ)
**İki ayrı hata vardı:**
1. **Yanlış hedef:** "Genel Özet" sekmesi başa eklenince bölüm numaraları bir kaydı ama Genel Özet'teki yönlendirme butonları güncellenmemişti. Yanlış gidenler: "sayfa çok yavaş" → Dönüşüm (olması gereken Hız) · "kod hatası" → Dönüşüm (Hız) · "sinirli tıklama" → Cihaz (Isı Haritası) · "saklama süresi" → SEO (Gizlilik).
2. **Kaydırma:** Doğru sekmeye geçse bile sayfa aşağıda kalıyordu, kullanıcı bölümün üstünü göremiyordu.

**Kalıcı çözüm:** Yönlendirme artık **numara değil İSİM** kullanıyor (`setIstenenBolum('Hız')`). Sekme listesi tek yerde (`lib/secim.tsx` → `BOLUMLER`) ve TypeScript yanlış isim yazılmasına izin vermiyor. Sıra değişse bile bir daha kayamaz.
Ayrıca sekme her değiştiğinde içerik alanı otomatik başa kaydırılıyor (`data-kaydirma-alani`).

### KOMPONENT TEST SAYFASI (Kaan isteği — KESİN)
~~Panelde bir "Laboratuvar" sayfası olacak.~~ → **İPTAL (Kaan):** Ayrı bir Laboratuvar sayfası yok. **Development klasörünün kendisi laboratuvardır.** Bileşenler orada denenir, tutan production'a aktarılır, tutmayan development'ta kalır. Bu yüzden sayfa sayısı 5'te kalıyor: Dashboard · Siteler · Analytics · Raporlar · Ayarlar.

### ÇİZİM YÖNTEMİ (Kaan kararı)
Yerleşim karmaşıklaştığı için **HTML taslak (mockup)** yapılacak. Düzenlemeler taslak üzerinde yapılacak.
Klasör: `planning/mockup/`

---

## 14. AYRI KONU — EXCEL/TABLO MODÜLÜ (analytics'ten BAĞIMSIZ)

> Kaan kararı: bu konu analytics planının parçası DEĞİL. Ayrı bir modül. Sırası gelince ayrıca planlanacak. Şimdilik sadece not.

- İstek: programın bir yerinde Excel benzeri bir tablo. **Formüller de olacak** (toplama, ortalama gibi).
- Yaklaşım: sıfırdan Excel yazılmaz (çok zor, değmez). Hazır açık kaynak motor alınır + AVIO arayüzü giydirilir — Enhancer'daki "hazır motor + bizim arayüz" mantığının aynısı.
- Motor adayları: Univer, Jspreadsheet CE, x-spreadsheet. Lisansı temiz olan seçilecek.
- Not: Analytics'in Raporlar sayfasındaki CSV/XLSX dışa aktarma bundan bağımsızdır; o zaten analytics içinde olacak.
