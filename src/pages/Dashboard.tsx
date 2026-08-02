import { Link } from 'react-router-dom'
import { ArrowUpRight, Globe } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { saklamaSureleri, siteler } from '@/lib/mock'
import { useVeri } from '@/lib/veri'
import { Bolum, CizgiGrafik, Degisim, Rozet, TarihSecici } from '@/components/analytics/parts'

export default function Dashboard() {
  const { veri, aralik } = useVeri()
  const kritik = saklamaSureleri.filter((s) => s.durum !== 'normal')

  // Tüm siteler toplamı: seçili sitenin verisi × site sayısı oranı (taslak yaklaşımı)
  const carpan = 2.54
  const sayi = (metin: string) =>
    Math.round(Number(metin.replace(/\./g, '').replace(',', '.')) * carpan).toLocaleString('tr-TR')

  const donusum = veri.olaylar.reduce((t, o) => t + o.sayi, 0)

  const ozet = [
    {
      etiket: 'Toplam ziyaretçi',
      deger: sayi(veri.ziyaretciMetrikleri[0].deger),
      degisim: veri.ziyaretciMetrikleri[0].degisim,
      tahmini: aralik.gun > 1,
    },
    {
      etiket: 'Sayfa görüntüleme',
      deger: sayi(veri.ziyaretciMetrikleri[1].deger),
      degisim: veri.ziyaretciMetrikleri[1].degisim,
    },
    { etiket: 'Dönüşüm (lead)', deger: donusum.toLocaleString('tr-TR'), degisim: 16.2 },
    { etiket: 'Takip edilen site', deger: String(siteler.length), degisim: 0 },
  ]

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-start justify-end gap-3">
        <TarihSecici />
      </div>

      {/* Üst özet kartları */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ozet.map((o) => (
          <Card key={o.etiket} className="gap-0 p-5 py-5">
            <div className="mb-2 text-xs text-slate-500">{o.etiket}</div>
            <div className="text-[26px] leading-none font-bold tracking-tight">
              {o.tahmini && <span className="text-brand">~</span>}
              {o.deger}
            </div>
            <div className="mt-1.5">
              <Degisim deger={o.degisim} />
            </div>
          </Card>
        ))}
      </div>

      {/* Uyarılar */}
      {kritik.length > 0 && (
        <Card className="gap-0 border-amber-200 bg-amber-50/60 px-5 py-4">
          <div className="mb-2 text-[13px] font-semibold text-amber-800">Dikkat gerektiren</div>
          <div className="space-y-1.5">
            {kritik.map((k) => (
              <div key={k.veri} className="flex flex-wrap items-center gap-2 text-[13px] text-amber-900">
                <Rozet ton={k.durum === 'kritik' ? 'red' : 'amber'}>{k.kalanGun} gün</Rozet>
                <span>{k.veri} — saklama süresi doluyor</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Bolum no={8} baslik="Ziyaretçi eğilimi" aciklama="Tüm siteler toplamı">
          <CizgiGrafik
            seriler={[
              { ad: 'Bu dönem', renk: '#c30716', noktalar: veri.zamanSerisi.map((z) => z.ziyaretci) },
              { ad: 'Önceki dönem', renk: '#cbd5e1', noktalar: veri.zamanSerisi.map((z) => z.onceki), kesikli: true },
            ]}
          />
        </Bolum>

        <Bolum no={44} baslik="Hız durumu" aciklama="Ortalama Core Web Vitals">
          <div className="space-y-2.5">
            {veri.webVitals.map((v) => (
              <div key={v.kod} className="flex items-center gap-3">
                <span className="w-12 text-[11px] font-bold text-slate-400">{v.kod}</span>
                <span className="flex-1 text-[13px]">{v.ad}</span>
                <span className="font-semibold tabular-nums">{v.deger}</span>
                <Rozet ton={v.durum === 'iyi' ? 'emerald' : v.durum === 'orta' ? 'amber' : 'red'}>
                  {v.durum === 'iyi' ? 'İyi' : v.durum === 'orta' ? 'Orta' : 'Kötü'}
                </Rozet>
              </div>
            ))}
          </div>
        </Bolum>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Siteler özeti */}
        <Card className="gap-0 py-0">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
            <span className="text-[15px] font-semibold">Siteler</span>
            <Link
              to="/siteler"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
            >
              Tümü
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {siteler.map((s) => (
              <Link
                key={s.alan}
                to="/analytics"
                className="flex items-center gap-3 px-5 py-3 transition hover:bg-slate-50/60"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <Globe className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{s.alan}</span>
                <span className="font-semibold tabular-nums">
                  {s.ziyaretci.toLocaleString('tr-TR')}
                </span>
                <span className="w-14 text-right">
                  <Degisim deger={s.degisim} />
                </span>
              </Link>
            ))}
          </div>
        </Card>

        {/* Dönüşümler */}
        <Bolum no={39} baslik="Dönüşümler" aciklama="En çok gerçekleşen hedefler">
          {veri.olaylar.slice(0, 4).map((o) => (
            <div key={o.ad} className="flex items-center gap-3 border-b border-slate-100 py-2.5 last:border-0">
              <span className="flex-1 text-[13px]">{o.ad}</span>
              <span className="font-bold tabular-nums">{o.sayi}</span>
              <span className="w-16 text-right">
                <Degisim deger={o.degisim} />
              </span>
            </div>
          ))}
        </Bolum>
      </div>
    </div>
  )
}
