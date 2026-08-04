import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useVeri } from '@/lib/veri'
import { cn } from '@/lib/utils'
import { IzgaraHarita, useIzgara, type BolgeDegeri } from './IzgaraHarita'
import { Bolum, CizgiGrafik, CubukListe, Degisim, Ipucu } from './parts'

/** 1,2,68,3,4,5,6 — DİREKTİF 1: ziyaretçiyle ilgili her şey tek blokta. */
export function ZiyaretciBlogu() {
  const { veri, aralik } = useVeri()

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
        <div>
          <div className="text-[15px] font-semibold">Ziyaretçiler</div>
          <div className="mt-0.5 text-xs text-slate-500">Hepsi tek noktada — Direktif 1</div>
        </div>
        {aralik.gun > 1 ? (
          <span className="rounded-md bg-brand/10 px-2 py-1 text-[10px] font-bold tracking-wide text-brand">
            ~ TAHMİN AÇIK · {aralik.gun} gün
          </span>
        ) : (
          <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold tracking-wide text-emerald-700">
            KESİN SAYIM · tek gün
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {veri.ziyaretciMetrikleri.map((m, i) => (
          <div
            key={m.id}
            className={`border-slate-200 p-5 ${i < 4 ? 'lg:border-r' : ''} ${
              m.tahmini ? 'bg-gradient-to-b from-brand/5 to-transparent' : ''
            }`}
          >
            <div className="mb-2 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="truncate">{m.etiket}</span>
              {m.aciklama && <Ipucu metin={m.aciklama} />}
            </div>
            <div className="text-[28px] leading-none font-bold tracking-tight">
              {m.tahmini && <span className="text-brand">~</span>}
              {m.deger}
            </div>
            <div className="mt-1.5">
              <Degisim deger={m.degisim} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 border-t border-slate-200 sm:grid-cols-2">
        {/* 5 — hemen çıkma oranı */}
        <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-200 p-4 sm:border-r sm:border-b-0">
          <span className="text-xs text-slate-500">{veri.ekMetrikler[0].etiket}</span>
          <span className="ml-auto text-lg font-bold">{veri.ekMetrikler[0].deger}</span>
          <Degisim deger={veri.ekMetrikler[0].degisim} />
        </div>

        {/* 6 — yeni ziyaretçi: onay durumuna göre iki katman */}
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs text-slate-500">Yeni Ziyaretçi</span>
            <Ipucu
              metin={
                veri.yeniDonen.tekGun
                  ? 'Tek günlük aralıkta günlük kod gün boyu sabit kalır, bu yüzden herkes için kesin sayılır.'
                  : 'Çerezi reddedeni günler arası tanıyamayız (kodu her gün değişir). Bu yüzden onay verenlerde ölçtüğümüz gerçek oranı herkese uyguluyoruz. Uyarı: onay verenler tüm ziyaretçileri birebir temsil etmeyebilir.'
              }
            />
            <span className="ml-auto text-lg font-bold">
              {!veri.yeniDonen.tekGun && <span className="text-brand">~</span>}
              %{veri.yeniDonen.tekGun ? veri.yeniDonen.kesinYuzde : veri.yeniDonen.tahminiYuzde}
            </span>
            <Degisim deger={veri.ekMetrikler[1].degisim} />
          </div>

          {!veri.yeniDonen.tekGun && (
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700">
                  KESİN
                </span>
                <span className="text-slate-500">
                  Onay verenlerde <b className="text-slate-700">%{veri.yeniDonen.kesinYuzde}</b> (
                  {veri.yeniDonen.onayliSayi.toLocaleString('tr-TR')} kişi)
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="rounded bg-brand/10 px-1.5 py-0.5 font-semibold text-brand">
                  TAHMİN
                </span>
                <span className="text-slate-500">
                  Reddedenlere aynı oran uygulandı
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

/** 7 — şu an sitede kaç kişi var (canlı sayaç). */
export function CanliSayac() {
  const { veri } = useVeri()
  const [sayi, setSayi] = useState(veri.canli)

  useEffect(() => setSayi(veri.canli), [veri.canli])

  useEffect(() => {
    const t = setInterval(() => {
      setSayi((s) => Math.max(1, s + (Math.random() > 0.5 ? 1 : -1)))
    }, 2600)
    return () => clearInterval(t)
  }, [])

  const sayfalar = [
    { yol: '/fiyatlar', pay: 0.3 },
    { yol: '/', pay: 0.26 },
    { yol: '/tedaviler/seffaf-plak', pay: 0.2 },
  ]

  return (
    <Bolum no={7} baslik="Şu an sitede" aciklama="Canlı — birkaç saniyede bir yenilenir">
      <div className="flex items-center gap-4">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
        </span>
        <span className="text-[34px] leading-none font-bold tabular-nums">{sayi}</span>
        <span className="text-sm text-slate-500">kişi geziniyor</span>
      </div>
      <div className="mt-4 space-y-1.5 text-[13px]">
        {sayfalar.map((s) => (
          <div key={s.yol} className="flex justify-between border-b border-slate-100 pb-1.5">
            <span className="text-slate-600">{s.yol}</span>
            <span className="font-semibold tabular-nums">{Math.max(1, Math.round(sayi * s.pay))}</span>
          </div>
        ))}
      </div>
    </Bolum>
  )
}

/** 8, 10 — zaman grafiği + önceki dönem karşılaştırması. */
export function ZamanGrafigi() {
  const { veri, aralik } = useVeri()
  const [karsilastir, setKarsilastir] = useState(true)

  const seriler = [
    { ad: 'Bu dönem', renk: '#c30716', noktalar: veri.zamanSerisi.map((z) => z.ziyaretci) },
    ...(karsilastir
      ? [
          {
            ad: 'Önceki dönem',
            renk: '#cbd5e1',
            noktalar: veri.zamanSerisi.map((z) => z.onceki),
            kesikli: true,
          },
        ]
      : []),
  ]

  return (
    <Bolum
      no={[8, 10]}
      baslik="Zaman içinde ziyaretçi"
      aciklama={aralik.gun > 45 ? 'Haftalık toplamlar' : 'Günlük — üzerine gelince rakam çıkar'}
      sag={
        <Button
          size="sm"
          variant={karsilastir ? 'secondary' : 'outline'}
          onClick={() => setKarsilastir((k) => !k)}
          className="h-8 shrink-0 text-xs"
        >
          Önceki dönemle karşılaştır
        </Button>
      }
    >
      <CizgiGrafik seriler={seriler} etiketler={veri.zamanSerisi.map((z) => z.etiket)} />
    </Bolum>
  )
}

/**
 * Dosya adı için sadeleştirir. `scripts/izgara-uret.mjs` içindeki `slug` ile
 * BİREBİR AYNI olmalı — yoksa dosya bulunamaz.
 */
function slug(s: string) {
  return s
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
}

/** Haritanın renkleneceği ölçüm. */
const OLCUMLER = [
  { anahtar: 'ziyaretci', ad: 'Ziyaretçi' },
  { anahtar: 'sayfa', ad: 'Sayfa görüntüleme' },
  { anahtar: 'donusum', ad: 'Dönüşüm' },
] as const

type OlcumAnahtari = (typeof OLCUMLER)[number]['anahtar']

/**
 * Kırılım zincirinde bir adım.
 * `gomulu` ise bu adımın haritası ayrı dosyada değil, bir üst dosyanın
 * içinde taşınıyor demektir — tıklandığında yeni indirme yapılmaz.
 */
type Adim = { kod: string; ad: string; slug: string; gomulu: boolean }

/** Gizlilik eşiği: bu sayıdan az ziyaretçisi olan bölge adıyla gösterilmez. */
const ESIK = 5

/**
 * 21,22,23,24 — ızgara harita (dot map), SINIRSIZ kırılım.
 *
 * Kademe sayısı ülkeden ülkeye değişiyor: Türkiye'de il → ilçe (2), İtalya'da
 * makro bölge → bölge → il → belediye (4). Bu yüzden sabit seviye yok, zincir var.
 */
export function KonumBlogu() {
  const { veri } = useVeri()
  const [yol, setYol] = useState<Adim[]>([])
  const [olcum, setOlcum] = useState<OlcumAnahtari>('ziyaretci')

  /**
   * Hangi dosya inecek. Gömülü adımlar dosya yoluna girmez — onların haritası
   * zaten inen dosyanın içinde.
   */
  const acikAdimlar = yol.filter((a) => !a.gomulu)
  const dosya =
    yol.length === 0
      ? 'dunya.json'
      : acikAdimlar.length <= 1
        ? `${yol[0].kod}/ulke.json`
        : `${yol[0].kod}/${acikAdimlar.slice(1).map((a) => a.slug).join('--')}.json`

  const { izgara: dosyaIzgarasi, yukleniyor, hata } = useIzgara(dosya)

  // Son adım gömülüyse gösterilecek harita dosyanın içinden gelir
  const sonAdim = yol[yol.length - 1]
  const gomuluHarita = sonAdim?.gomulu ? dosyaIzgarasi?.alt?.[sonAdim.kod] : undefined
  const izgara = gomuluHarita
    ? { ...dosyaIzgarasi!, ...gomuluHarita, kademe: (dosyaIzgarasi?.kademe ?? 1) + 1, alt: undefined }
    : dosyaIzgarasi

  // Yandaki liste: sahte verimiz olan yerlerde o veri, diğerlerinde haritadaki
  // bölgeler (değer yok — gerçek veri Supabase bağlanınca gelecek).
  const turkiyede = yol[0]?.kod === 'TUR'
  const haritaListesi = (izgara?.bolgeler ?? []).map((b) => ({
    ad: b.ad,
    kod: b.kod,
    bayrak: '',
    sayi: 0,
    yuzde: 0,
  }))
  const hamListe =
    yol.length === 0
      ? veri.ulkeler
      : turkiyede && yol.length === 1
        ? veri.sehirler
        : turkiyede && yol.length === 2 && yol[1].slug === 'manisa'
          ? veri.ilceler
          : haritaListesi

  /**
   * GİZLİLİK EŞİĞİ
   * İlçenin altındaki kırılımlarda (belediye, mahalle, posta kodu) 5 kişiden
   * az ziyaretçisi olan bölge adıyla gösterilmez — tek kişi tanımlanabilir
   * hale gelmesin diye. Bu bölgeler "Diğer" içinde toplanır.
   */
  const maskeli = izgara?.maskeli ?? (izgara?.kademe ?? 0) >= 3
  const gizlenen = maskeli ? hamListe.filter((k) => k.sayi > 0 && k.sayi < ESIK) : []
  const liste = maskeli
    ? [
        ...hamListe.filter((k) => k.sayi === 0 || k.sayi >= ESIK),
        ...(gizlenen.length
          ? [
              {
                ad: `Diğer (${gizlenen.length} bölge)`,
                kod: '__diger__',
                bayrak: '',
                sayi: gizlenen.reduce((t, k) => t + k.sayi, 0),
                yuzde: gizlenen.reduce((t, k) => t + k.yuzde, 0),
              },
            ]
          : []),
      ]
    : hamListe

  const baslik = yol.length === 0 ? 'Ülkeler' : (izgara?.kademeAdi ?? 'Bölgeler')

  // Seçili ölçüme göre değerler. Ziyaretçi dışındakiler orantıyla türetilir (taslak).
  const carpan = olcum === 'ziyaretci' ? 1 : olcum === 'sayfa' ? 2.84 : 0.078
  const degerler: BolgeDegeri[] = liste
    .filter((k) => k.kod !== '__diger__')
    .map((k) => ({ ad: k.ad, kod: k.kod, deger: Math.round(k.sayi * carpan) }))

  /** Daha aşağı inilebilir mi — yaprak kademede tıklama kapanır. */
  const inilebilir = !izgara?.yaprak

  /** Bir bölgeye tıklanınca bir alt kırılıma in. */
  function haritayaTikla(b: { kod: string; ad: string; deger: number }) {
    if (!inilebilir || b.kod === '__diger__') return
    // Bu bölgenin çocukları dosyanın içinde mi taşınıyor?
    const gomulu = !!izgara?.alt?.[b.kod]
    setYol([...yol, { kod: b.kod, ad: b.ad, slug: slug(b.ad), gomulu }])
  }

  /** Listede bir satıra tıklanınca da aynısı. */
  function listeyeTikla(ad: string) {
    const b = liste.find((k) => k.ad === ad)
    if (!b) return
    haritayaTikla({ kod: b.kod ?? ad, ad, deger: b.sayi })
  }

  /**
   * MOBİLDE HARİTA
   * Küçük ekranda alt kırılım haritaları okunmuyor — bir ilin 40 ilçesi
   * avuç içi genişlikte ayırt edilemez. O yüzden telefonda sadece dünya
   * haritası çizilir, alt kırılımlarda liste tek başına kalır ve gezinme
   * listeden yapılır. Masaüstünde hepsi görünür.
   */
  const mobildeHaritaVar = yol.length === 0

  return (
    <Card className="gap-0 py-0">
      {/* Gezinti + ölçüm — her zaman görünür, mobilde harita gizlense bile */}
      <div className="border-b px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Gezinti yolu — kaç kırılım varsa o kadar uzar, sığmazsa kayar */}
          <div
            className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto text-[13px] whitespace-nowrap"
            data-kaydirma-alani
          >
            <button
              onClick={() => setYol([])}
              className={yol.length === 0 ? 'text-muted-foreground' : 'shrink-0 text-brand hover:underline'}
            >
              Dünya
            </button>
            {yol.map((a, i) => (
              <span key={a.kod + i} className="flex shrink-0 items-center gap-2">
                <span className="text-muted-foreground/40">›</span>
                {i === yol.length - 1 ? (
                  <span className="text-muted-foreground">{a.ad}</span>
                ) : (
                  <button
                    onClick={() => setYol(yol.slice(0, i + 1))}
                    className="text-brand hover:underline"
                  >
                    {a.ad}
                  </button>
                )}
              </span>
            ))}
          </div>

          {/* Ölçüm seçici — harita buna göre renklenir */}
          <div className="flex gap-1 rounded-lg border p-0.5">
            {OLCUMLER.map((o) => (
              <Button
                key={o.anahtar}
                size="sm"
                variant={olcum === o.anahtar ? 'default' : 'ghost'}
                onClick={() => setOlcum(o.anahtar)}
                className="h-7 px-2.5 text-xs"
              >
                {o.ad}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_330px]">
        <div className={cn('p-4 sm:p-5 lg:border-r', !mobildeHaritaVar && 'hidden sm:block')}>
        {hata ? (
          <div className="flex aspect-[2/1] flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 text-center">
            <span className="text-[13px] font-medium">Bu bölgenin alt kırılımı yok</span>
            <span className="text-[11px] text-muted-foreground">
              Bu kaynakta {yol[yol.length - 1]?.ad ?? 'burası'} en ince kırılım.
            </span>
            <Button size="sm" variant="outline" className="mt-1 h-7 text-xs" onClick={() => setYol(yol.slice(0, -1))}>
              Geri dön
            </Button>
          </div>
        ) : (
          <IzgaraHarita
            izgara={izgara}
            degerler={degerler}
            yukleniyor={yukleniyor}
            onBolgeTikla={inilebilir ? haritayaTikla : undefined}
          />
        )}

        <p className="mt-2 text-[11px] text-muted-foreground">
          Koyu = yoğun.{' '}
          {inilebilir ? 'Noktaya tıklayarak alt kırılıma inebilirsin. ' : 'En ince kırılım. '}
          {maskeli && `${ESIK} kişiden az ziyaretçisi olan bölgeler gizlilik için "Diğer" içinde toplanır. `}
            Harita verisi: geoBoundaries (CC BY 4.0).
          </p>
        </div>

        <div className="p-4 sm:p-5">
          <h4 className="text-[13px] font-semibold">{baslik}</h4>
          <p className="mb-3 text-[11.5px] text-muted-foreground">
            {inilebilir ? 'Satıra tıkla, bir alt kırılıma in' : 'En ince kırılım'}
          </p>
          <CubukListe
            tiklanabilir={inilebilir}
            onTikla={listeyeTikla}
            satirlar={liste.map((k) => ({
              ad: k.ad,
              // Dünya seviyesinde gerçek ülke bayrağı; alt kırılımlarda ince
              // konum ikonu (emoji pin amatör duruyordu)
              sol:
                yol.length === 0 ? (
                  k.bayrak
                ) : (
                  <MapPin size={13} strokeWidth={1.75} className="text-muted-foreground" />
                ),
              sayi: k.sayi,
              yuzde: k.yuzde,
            }))}
          />
        </div>
      </div>
    </Card>
  )
}
