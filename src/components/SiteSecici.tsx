import { ChevronDown, Globe } from 'lucide-react'
import { siteler } from '@/lib/mock'
import { useVeri } from '@/lib/veri'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * 61 — Site seçici.
 * Kaan kararı: navbarda DEĞİL, sayfanın içinde durur.
 */
export default function SiteSecici() {
  const { site, setSite } = useVeri()

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-left outline-none transition hover:border-slate-300">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Globe className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[14px] leading-tight font-semibold text-slate-800">
              {site.alan}
            </span>
            <span className="block truncate text-[11px] text-slate-500">{site.ad}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" sideOffset={6} className="w-72">
          <div className="px-2 py-1.5 text-[11px] font-semibold tracking-wide text-slate-400">
            TAKİP EDİLEN SİTELER
          </div>
          {siteler.map((s) => (
            <DropdownMenuItem key={s.alan} onClick={() => setSite(s.alan)}>
              <Globe className="h-4 w-4" />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{s.alan}</span>
                <span className="block truncate text-[11px] text-slate-400">{s.ad}</span>
              </span>
              {s.durum === 'beklemede' && (
                <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                  beklemede
                </span>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Globe className="h-4 w-4" />
            Yeni site ekle
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
