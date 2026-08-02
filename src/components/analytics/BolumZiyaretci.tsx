import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useVeri } from '@/lib/veri'
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

/** 21,22,23,24 — harita + ülke → şehir → ilçe. */
export function KonumBlogu() {
  const { veri } = useVeri()
  const [seviye, setSeviye] = useState<'dunya' | 'ulke' | 'sehir'>('dunya')

  const liste =
    seviye === 'dunya' ? veri.ulkeler : seviye === 'ulke' ? veri.sehirler : veri.ilceler
  const baslik = seviye === 'dunya' ? 'Ülkeler' : seviye === 'ulke' ? 'Şehirler' : 'İlçeler'

  return (
    <Card className="grid grid-cols-1 gap-0 py-0 lg:grid-cols-[1fr_330px]">
      <div className="border-slate-200 p-5 lg:border-r">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[13px]">
          <button onClick={() => setSeviye('dunya')} className="text-brand hover:underline">
            Dünya
          </button>
          {seviye !== 'dunya' && (
            <>
              <span className="text-slate-300">›</span>
              <button onClick={() => setSeviye('ulke')} className="text-brand hover:underline">
                Türkiye
              </button>
            </>
          )}
          {seviye === 'sehir' && (
            <>
              <span className="text-slate-300">›</span>
              <span className="text-slate-500">Manisa</span>
            </>
          )}
        </div>

        <svg
          viewBox="0 0 900 400"
          className="block w-full rounded-lg border border-slate-200 bg-slate-50/60"
          role="img"
          aria-label="Ziyaretçi haritası"
        >
          <g fill="#E8ECF1">
            <path d="M120 90 L215 70 L265 105 L245 165 L190 215 L150 190 L128 140 Z" />
            <path d="M195 235 L245 225 L268 285 L240 355 L205 335 L192 285 Z" />
            <path d="M415 140 L490 132 L512 200 L470 285 L430 265 L405 195 Z" />
            <path d="M545 105 L690 78 L760 130 L735 195 L640 210 L565 160 Z" />
            <path d="M700 255 L790 245 L812 300 L745 322 L698 295 Z" />
          </g>
          <path d="M400 75 L470 62 L505 88 L487 120 L430 128 L398 105 Z" fill="#c30716" opacity=".28" />
          <path d="M487 95 L545 88 L560 118 L520 132 L484 122 Z" fill="#c30716" opacity=".62" />
          <g fill="#c30716">
            <circle cx="522" cy="112" r="9" opacity=".85" />
            <circle cx="505" cy="104" r="5" opacity=".6" />
            <circle cx="452" cy="96" r="4.5" opacity=".5" />
            <circle cx="430" cy="112" r="3.5" opacity=".4" />
            <circle cx="612" cy="140" r="3" opacity=".35" />
          </g>
        </svg>
      </div>

      <div className="p-5">
        <div className="mb-1 flex items-center gap-2">
          <h4 className="text-[13px] font-semibold">{baslik}</h4>
        </div>
        <p className="mb-3 text-[11.5px] text-slate-500">
          {seviye === 'sehir' ? 'En ince kırılım' : 'Satıra tıkla, bir alt kırılıma in'}
        </p>
        <CubukListe
          tiklanabilir={seviye !== 'sehir'}
          onTikla={() => setSeviye(seviye === 'dunya' ? 'ulke' : 'sehir')}
          satirlar={liste.map((k) => ({ ad: k.ad, sol: k.bayrak, sayi: k.sayi, yuzde: k.yuzde }))}
        />
      </div>
    </Card>
  )
}
