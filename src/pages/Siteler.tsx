import { useState } from 'react'
import { Check, Copy, Globe, Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { siteler } from '@/lib/mock'
import { Bolum, Degisim, Rozet } from '@/components/analytics/parts'

function TakipKodu({ anahtar }: { anahtar: string }) {
  const [kopyalandi, setKopyalandi] = useState(false)
  const kod = `<script defer src="https://cdn.avio.com/t.js" data-site="${anahtar}"></script>`

  function kopyala() {
    navigator.clipboard?.writeText(kod)
    setKopyalandi(true)
    setTimeout(() => setKopyalandi(false), 1800)
  }

  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg bg-slate-900 px-3.5 py-3 pr-12 text-[11.5px] leading-relaxed text-slate-100">
        {kod}
      </pre>
      <button
        onClick={kopyala}
        className="absolute top-2.5 right-2.5 rounded-md bg-white/10 p-1.5 text-white transition hover:bg-white/20"
        title="Kopyala"
      >
        {kopyalandi ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

export default function Siteler() {
  const [acik, setAcik] = useState<string | null>(siteler[0].alan)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 pt-5 pb-16 sm:px-6 sm:pt-6 sm:pb-20">
      <div className="flex justify-end">
        <button className="inline-flex items-center gap-2 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark">
          <Plus className="h-4 w-4" />
          Yeni site ekle
        </button>
      </div>

      <Card className="gap-0 py-0">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-3.5">
          <span className="text-[15px] font-semibold">Site listesi</span>
        </div>

        <div className="divide-y divide-slate-100">
          {siteler.map((s) => (
            <div key={s.alan}>
              <button
                onClick={() => setAcik(acik === s.alan ? null : s.alan)}
                className="flex w-full flex-wrap items-center gap-3 px-5 py-4 text-left transition hover:bg-slate-50/60"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <Globe className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-medium">{s.alan}</span>
                    <Rozet ton={s.durum === 'aktif' ? 'emerald' : 'amber'}>
                      {s.durum === 'aktif' ? 'Aktif' : 'Beklemede'}
                    </Rozet>
                  </div>
                  <div className="truncate text-xs text-slate-500">{s.ad}</div>
                </div>
                <div className="text-right">
                  <div className="text-[15px] font-bold tabular-nums">
                    {s.ziyaretci.toLocaleString('tr-TR')}
                  </div>
                  <div className="text-[11px] text-slate-500">30 günlük ziyaretçi</div>
                </div>
                <div className="w-16 text-right">
                  <Degisim deger={s.degisim} />
                </div>
                <div className="w-16 text-right text-xs text-slate-500">LCP {s.lcp}</div>
              </button>

              {acik === s.alan && (
                <div className="bg-slate-50/70 px-5 pt-1 pb-5">
                  <div className="mb-2 text-xs font-medium text-slate-600">
                    Takip kodu — sitenin {'<head>'} bölümüne yapıştır
                  </div>
                  <TakipKodu anahtar={s.anahtar} />
                  <p className="mt-2 text-[11px] text-slate-500">
                    Bu kod veriyi doğrudan Supabase'e gönderir. Cloudflare istek kotasından hiçbir
                    şey yemez.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Bolum
        no={61}
        baslik="Site seçici"
        aciklama="Analytics sayfasının içinde duruyor (navbarda değil)"
      >
        <p className="text-[13px] text-slate-600">
          Analytics sayfasının başındaki açılır menüden site değiştirilir. Seçim değişince tüm
          rakamlar, grafikler ve tablolar o siteye göre yeniden hesaplanır.
        </p>
      </Bolum>
    </div>
  )
}
