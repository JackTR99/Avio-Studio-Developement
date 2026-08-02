import {
  ArrowRight,
  Gauge,
  MousePointerClick,
  Search,
  TrendingUp,
  TriangleAlert,
  Users,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { saklamaSureleri } from '@/lib/mock'
import { useVeri } from '@/lib/veri'
import { useSecim, type BolumAdi } from '@/lib/secim'
import { Bolum, CizgiGrafik, Degisim, Ipucu, Rozet } from './parts'

/** Tek bakışta durum kartı. */
function OzetKart({
  ikon: Ikon,
  etiket,
  deger,
  alt,
  degisim,
  tahmini,
  ipucu,
  ton = 'slate',
  onTikla,
}: {
  ikon: typeof Users
  etiket: string
  deger: string
  alt?: string
  degisim?: number
  tahmini?: boolean
  ipucu?: string
  ton?: 'brand' | 'emerald' | 'amber' | 'slate'
  onTikla?: () => void
}) {
  const tonlar = {
    brand: 'bg-brand/10 text-brand',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-500',
  }
  return (
    <div className="group relative flex flex-col rounded-xl border border-slate-200 bg-card p-4 transition hover:border-brand/40 hover:shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${tonlar[ton]}`}>
          <Ikon className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 truncate text-xs text-slate-500">{etiket}</span>
        {ipucu && <Ipucu metin={ipucu} />}
        {onTikla && (
          <button
            onClick={onTikla}
            className="ml-auto shrink-0 rounded p-0.5 text-slate-300 transition hover:bg-slate-100 hover:text-brand"
            aria-label={`${etiket} bölümüne git`}
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="text-[26px] leading-none font-bold tracking-tight">
        {tahmini && <span className="text-brand">~</span>}
        {deger}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        {degisim !== undefined && <Degisim deger={degisim} />}
        {alt && <span className="text-[11px] text-slate-400">{alt}</span>}
      </div>
    </div>
  )
}

/** GENEL ÖZET — Analytics'in ilk bölümü. Tek ekranda "işler nasıl gidiyor". */
export default function BolumOzet() {
  const { veri, aralik } = useVeri()
  const { setIstenenBolum } = useSecim()

  const ziyaretci = veri.ziyaretciMetrikleri[0]
  const donusum = veri.olaylar.reduce((t, o) => t + o.sayi, 0)
  const seoTiklama = veri.motorKarsilastirma.reduce((t, m) => t + m.tiklama, 0)
  const kotuVitals = veri.webVitals.filter((v) => v.durum !== 'iyi').length
  const hizDurum = kotuVitals === 0 ? 'İyi' : kotuVitals <= 2 ? 'Orta' : 'Kötü'

  // Dikkat gerektirenler — her biri ilgili bölüme götürür
  const uyarilar: { metin: string; ton: 'red' | 'amber'; bolum: BolumAdi; ek: string }[] = []

  const yavas = veri.sayfaHizlari.filter((s) => s.durum === 'kotu')
  if (yavas.length)
    uyarilar.push({
      metin: `${yavas.length} sayfa çok yavaş`,
      ek: yavas[0].yol,
      ton: 'red',
      bolum: 'Hız',
    })

  const jsToplam = veri.jsHatalari.reduce((t, h) => t + h.kisi, 0)
  if (jsToplam > 0)
    uyarilar.push({
      metin: `${jsToplam.toLocaleString('tr-TR')} kişide kod hatası çıktı`,
      ek: veri.jsHatalari[0].yol,
      ton: 'red',
      bolum: 'Hız',
    })

  const sinirliToplam = veri.sinirliTiklama.reduce((t, s) => t + s.sayi, 0)
  if (sinirliToplam > 0)
    uyarilar.push({
      metin: `${sinirliToplam.toLocaleString('tr-TR')} sinirli tıklama`,
      ek: veri.sinirliTiklama[0].ogesi,
      ton: 'amber',
      bolum: 'Isı Haritası',
    })

  const sakla = saklamaSureleri.filter((s) => s.durum !== 'normal')
  sakla.forEach((s) =>
    uyarilar.push({
      metin: `${s.veri} — ${s.kalanGun} gün kaldı`,
      ek: 'KVKK imha',
      ton: s.durum === 'kritik' ? 'red' : 'amber',
      bolum: 'Gizlilik',
    }),
  )

  const enIyiSayfa = veri.enCokGezilen[0]
  const enIyiKaynak = veri.trafikKaynaklari[0]
  const huniSon = veri.huni[veri.huni.length - 1]
  const donusumOrani = ((huniSon.sayi / veri.huni[0].sayi) * 100).toFixed(1).replace('.', ',')

  return (
    <div className="space-y-5">
      {/* Dört ana rakam */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OzetKart
          ikon={Users}
          etiket="Ziyaretçi"
          deger={ziyaretci.deger}
          degisim={ziyaretci.degisim}
          tahmini={ziyaretci.tahmini}
          alt={ziyaretci.tahmini ? 'tahmini' : 'kesin sayım'}
          ipucu={ziyaretci.aciklama}
          ton="brand"
          onTikla={() => setIstenenBolum('Ziyaretçiler')}
        />
        <OzetKart
          ikon={TrendingUp}
          etiket="Dönüşüm (lead)"
          deger={donusum.toLocaleString('tr-TR')}
          alt={`huni sonu %${donusumOrani}`}
          degisim={16.2}
          ton="emerald"
          onTikla={() => setIstenenBolum('Dönüşüm')}
        />
        <OzetKart
          ikon={Gauge}
          etiket="Site hızı"
          deger={hizDurum}
          alt={`LCP ${veri.webVitals[0].deger}`}
          ton={hizDurum === 'İyi' ? 'emerald' : hizDurum === 'Orta' ? 'amber' : 'brand'}
          onTikla={() => setIstenenBolum('Hız')}
        />
        <OzetKart
          ikon={Search}
          etiket="Aramadan gelen tıklama"
          deger={seoTiklama.toLocaleString('tr-TR')}
          alt="Google + Bing"
          degisim={9.4}
          ton="slate"
          onTikla={() => setIstenenBolum('SEO')}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* Eğilim */}
        <Bolum
          no={8}
          baslik="Eğilim"
          aciklama={`${aralik.gun} günlük ziyaretçi hareketi`}
          sag={
            <button
              onClick={() => setIstenenBolum('Ziyaretçiler')}
              className="shrink-0 text-xs font-medium text-brand hover:underline"
            >
              Ziyaretçiler →
            </button>
          }
        >
          <CizgiGrafik
            seriler={[
              { ad: 'Bu dönem', renk: '#c30716', noktalar: veri.zamanSerisi.map((z) => z.ziyaretci) },
              {
                ad: 'Önceki dönem',
                renk: '#cbd5e1',
                noktalar: veri.zamanSerisi.map((z) => z.onceki),
                kesikli: true,
              },
            ]}
            etiketler={veri.zamanSerisi.map((z) => z.etiket)}
          />
        </Bolum>

        {/* Dikkat gerektirenler */}
        <Card className="gap-0 py-0">
          <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-3.5">
            <TriangleAlert className="h-4 w-4 text-amber-500" />
            <span className="text-[15px] font-semibold">Dikkat gerektiren</span>
            <span className="ml-auto rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
              {uyarilar.length}
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {uyarilar.length === 0 && (
              <div className="px-5 py-6 text-center text-[13px] text-slate-400">
                Her şey yolunda görünüyor.
              </div>
            )}
            {uyarilar.map((u, i) => (
              <button
                key={i}
                onClick={() => setIstenenBolum(u.bolum)}
                className="group flex w-full items-center gap-2.5 px-5 py-2.5 text-left transition hover:bg-slate-50/60"
              >
                <Rozet ton={u.ton}>●</Rozet>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px]">{u.metin}</span>
                  <span className="block truncate text-[11px] text-slate-400">{u.ek}</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:text-brand" />
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Hızlı bakış: en iyi sayfa / kaynak / davranış */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Bolum no={11} baslik="En çok gezilen sayfa" aciklama="Bu dönemin birincisi">
          <div className="text-[15px] font-semibold text-slate-800">{enIyiSayfa.yol}</div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <span>
              <b className="text-slate-700">{enIyiSayfa.goruntuleme.toLocaleString('tr-TR')}</b>{' '}
              görüntüleme
            </span>
            <span>
              ort. <b className="text-slate-700">{enIyiSayfa.ortSure}</b>
            </span>
          </div>
          <button
            onClick={() => setIstenenBolum('Sayfalar')}
            className="mt-3 text-xs font-medium text-brand hover:underline"
          >
            Tüm sayfalar →
          </button>
        </Bolum>

        <Bolum no={17} baslik="En büyük kaynak" aciklama="Ziyaretçiler ağırlıklı buradan geliyor">
          <div className="text-[15px] font-semibold text-slate-800">{enIyiKaynak.ad}</div>
          <div className="mt-1 text-xs text-slate-500">
            <b className="text-slate-700">{enIyiKaynak.sayi.toLocaleString('tr-TR')}</b> ziyaretçi ·
            toplamın %{enIyiKaynak.yuzde}'i
          </div>
          <button
            onClick={() => setIstenenBolum('Kaynaklar')}
            className="mt-3 text-xs font-medium text-brand hover:underline"
          >
            Tüm kaynaklar →
          </button>
        </Bolum>

        <Bolum no={34} baslik="En çok takılan yer" aciklama="Sinirli tıklama alan öge">
          <div className="flex items-start gap-2">
            <MousePointerClick className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <div className="min-w-0">
              <div className="truncate text-[15px] font-semibold text-slate-800">
                {veri.sinirliTiklama[0].ogesi}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                <b className="text-slate-700">{veri.sinirliTiklama[0].sayi}</b> kez ·{' '}
                {veri.sinirliTiklama[0].yol}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIstenenBolum('Isı Haritası')}
            className="mt-3 text-xs font-medium text-brand hover:underline"
          >
            Isı haritası →
          </button>
        </Bolum>
      </div>
    </div>
  )
}
