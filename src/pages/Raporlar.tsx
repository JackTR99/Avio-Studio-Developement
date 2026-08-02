import { useState } from 'react'
import { CalendarClock, Download, FileSpreadsheet, FileText, Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { raporlar } from '@/lib/mock'
import { Bolum, Rozet } from '@/components/analytics/parts'

const secenekler = [
  'Ziyaretçi sayıları',
  'Konum (ülke/şehir/ilçe)',
  'Trafik kaynakları',
  'Sayfalar',
  'Cihaz ve bağlantı',
  'Isı haritası özeti',
  'Dönüşümler',
  'Hız (Core Web Vitals)',
  'Lighthouse',
  'Arama kelimeleri (SEO)',
]

export default function Raporlar() {
  const [secili, setSecili] = useState<string[]>([secenekler[0], secenekler[2], secenekler[6]])

  function degistir(ad: string) {
    setSecili((s) => (s.includes(ad) ? s.filter((x) => x !== ad) : [...s, ad]))
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-5 sm:px-6 sm:py-6">
      {/* 62 — rapor oluşturma */}
      <Bolum
        no={62}
        baslik="Rapor oluştur"
        aciklama="İstediğin bölümleri seç, rapor hazırlansın"
        sag={
          <button className="inline-flex items-center gap-2 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark">
            <Plus className="h-4 w-4" />
            Oluştur
          </button>
        }
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {secenekler.map((s) => {
            const acik = secili.includes(s)
            return (
              <button
                key={s}
                onClick={() => degistir(s)}
                className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-[13px] transition ${
                  acik ? 'border-brand bg-brand/5 text-brand' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    acik ? 'border-brand bg-brand text-white' : 'border-slate-300'
                  }`}
                >
                  {acik && <span className="text-[9px]">✓</span>}
                </span>
                {s}
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-xs text-slate-500">{secili.length} bölüm seçildi</p>
      </Bolum>

      {/* 63 — dışa aktarma */}
      <Bolum no={63} baslik="Dışa aktar" aciklama="Hazır raporu indir">
        <div className="flex flex-wrap gap-2.5">
          {[
            { ad: 'PDF olarak indir', ikon: FileText },
            { ad: 'Excel olarak indir', ikon: FileSpreadsheet },
            { ad: 'CSV olarak indir', ikon: Download },
          ].map((d) => (
            <button
              key={d.ad}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300"
            >
              <d.ikon className="h-4 w-4 text-slate-400" />
              {d.ad}
            </button>
          ))}
        </div>
      </Bolum>

      {/* 64 — kayıtlı + zamanlanmış raporlar */}
      <Card className="gap-0 py-0">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-3.5">
          <span className="text-[15px] font-semibold">Kayıtlı raporlar</span>
          <span className="text-xs text-slate-500">— zamanlanmış olanlar kendiliğinden çalışır</span>
        </div>
        <div className="divide-y divide-slate-100">
          {raporlar.map((r) => (
            <div key={r.ad} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[14px] font-medium">{r.ad}</span>
                  {r.zamanli && (
                    <Rozet ton="brand">
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />
                        Zamanlı
                      </span>
                    </Rozet>
                  )}
                </div>
                <div className="truncate text-xs text-slate-500">{r.kapsam}</div>
              </div>
              <span className="text-xs text-slate-500">Son: {r.sonCalisma}</span>
              <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300">
                Çalıştır
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
