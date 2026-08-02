import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useVeri } from '@/lib/veri'
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

/** Haritada nerede olduğumuz. */
type Konum =
  | { seviye: 'dunya' }
  | { seviye: 'ulke'; kod: string; ad: string }
  | { seviye: 'il'; ulkeKod: string; ulkeAd: string; ad: string }

/** 21,22,23,24 — ızgara harita (dot map) + ülke → il → ilçe. */
export function KonumBlogu() {
  const { veri } = useVeri()
  const [konum, setKonum] = useState<Konum>({ seviye: 'dunya' })
  const [olcum, setOlcum] = useState<OlcumAnahtari>('ziyaretci')

  // Hangi ızgara dosyası yüklenecek — sadece bakılan bölge indirilir
  const dosya =
    konum.seviye === 'dunya'
      ? 'dunya.json'
      : konum.seviye === 'ulke'
        ? `${konum.kod}.json`
        : `${konum.ulkeKod}-${slug(konum.ad)}.json`
  const { izgara, yukleniyor, hata } = useIzgara(dosya)

  // Yandaki liste: elimizde sahte veri olan seviyeler için o veri,
  // diğer ülkelerde haritadaki bölgeler (değer yok).
  const turkiyede = konum.seviye !== 'dunya' && ('kod' in konum ? konum.kod : konum.ulkeKod) === 'TUR'
  const liste =
    konum.seviye === 'dunya'
      ? veri.ulkeler
      : konum.seviye === 'ulke' && turkiyede
        ? veri.sehirler
        : konum.seviye === 'il' && turkiyede && slug(konum.ad) === 'manisa'
          ? veri.ilceler
          : (izgara?.bolgeler ?? []).map((b) => ({
              ad: b.ad,
              kod: b.kod,
              bayrak: '📍',
              sayi: 0,
              yuzde: 0,
            }))

  const baslik =
    konum.seviye === 'dunya' ? 'Ülkeler' : konum.seviye === 'ulke' ? 'İller' : 'İlçeler'

  // Seçili ölçüme göre değerler. Ziyaretçi dışındakiler orantıyla türetilir (taslak).
  const carpan = olcum === 'ziyaretci' ? 1 : olcum === 'sayfa' ? 2.84 : 0.078
  const degerler: BolgeDegeri[] = liste.map((k) => ({
    ad: k.ad,
    kod: k.kod,
    deger: Math.round(k.sayi * carpan),
  }))

  /** Haritada bir bölgeye tıklanınca bir alt seviyeye in. */
  function haritayaTikla(b: { kod: string; ad: string; deger: number }) {
    if (konum.seviye === 'dunya') setKonum({ seviye: 'ulke', kod: b.kod, ad: b.ad })
    else if (konum.seviye === 'ulke')
      setKonum({ seviye: 'il', ulkeKod: konum.kod, ulkeAd: konum.ad, ad: b.ad })
  }

  /** Listede bir satıra tıklanınca da aynısı. */
  function listeyeTikla(ad: string) {
    const b = liste.find((k) => k.ad === ad)
    if (!b) return
    haritayaTikla({ kod: b.kod ?? ad, ad, deger: b.sayi })
  }

  return (
    <Card className="grid grid-cols-1 gap-0 py-0 lg:grid-cols-[1fr_330px]">
      <div className="p-4 sm:p-5 lg:border-r">
        {/* Seçim çubuğu: nerede olduğun + geri dönüş */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <button
              onClick={() => setKonum({ seviye: 'dunya' })}
              className={konum.seviye === 'dunya' ? 'text-muted-foreground' : 'text-brand hover:underline'}
            >
              Dünya
            </button>
            {konum.seviye !== 'dunya' && (
              <>
                <span className="text-muted-foreground/40">›</span>
                <button
                  onClick={() =>
                    konum.seviye === 'il'
                      ? setKonum({ seviye: 'ulke', kod: konum.ulkeKod, ad: konum.ulkeAd })
                      : undefined
                  }
                  className={konum.seviye === 'ulke' ? 'text-muted-foreground' : 'text-brand hover:underline'}
                >
                  {konum.seviye === 'ulke' ? konum.ad : konum.ulkeAd}
                </button>
              </>
            )}
            {konum.seviye === 'il' && (
              <>
                <span className="text-muted-foreground/40">›</span>
                <span className="text-muted-foreground">{konum.ad}</span>
              </>
            )}
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

        {hata ? (
          <div className="flex aspect-[2/1] flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 text-center">
            <span className="text-[13px] font-medium">Bu bölgenin haritası henüz üretilmedi</span>
            <span className="text-[11px] text-muted-foreground">
              Dünyanın tamamı toplu üretiliyor; hazır olunca burada görünecek.
            </span>
          </div>
        ) : (
          <IzgaraHarita
            izgara={izgara}
            degerler={degerler}
            yukleniyor={yukleniyor}
            onBolgeTikla={haritayaTikla}
          />
        )}

        <p className="mt-2 text-[11px] text-muted-foreground">
          Koyu = yoğun. Noktaya tıklayarak alt kırılıma inebilirsin. Harita verisi: geoBoundaries
          (CC BY 4.0).
        </p>
      </div>

      <div className="p-4 sm:p-5">
        <h4 className="text-[13px] font-semibold">{baslik}</h4>
        <p className="mb-3 text-[11.5px] text-muted-foreground">
          {konum.seviye === 'il' ? 'En ince kırılım' : 'Satıra tıkla, bir alt kırılıma in'}
        </p>
        <CubukListe
          tiklanabilir={konum.seviye !== 'il'}
          onTikla={listeyeTikla}
          satirlar={liste.map((k) => ({ ad: k.ad, sol: k.bayrak, sayi: k.sayi, yuzde: k.yuzde }))}
        />
      </div>
    </Card>
  )
}
