import { useMemo, useState, type ReactNode } from 'react'
import { CalendarDays, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { tarihYaz, useVeri, type AralikAdi } from '@/lib/veri'

/* ---------------------------------------------------------------- İPUCU */

/** Üzerine gelince açıklama gösteren küçük "i". shadcn Tooltip. */
export function Ipucu({ metin }: { metin: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-[11.5px] leading-relaxed">{metin}</TooltipContent>
    </Tooltip>
  )
}

/* ---------------------------------------------------------------- TARİH SEÇİCİ */

/** Tarih aralığı seçici. "Özel" shadcn Popover içinde tarih kutuları açar. */
export function TarihSecici() {
  const { aralikAdi, setAralikAdi, ozelBas, ozelBit, setOzel, aralik } = useVeri()
  const secenekler: AralikAdi[] = ['Bugün', '7 gün', '30 gün', '3 ay']

  function kisayol(gun: number) {
    const bit = new Date(ozelBit)
    const bas = new Date(bit.getTime() - (gun - 1) * 86400000)
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    setOzel(iso(bas), ozelBit)
  }

  return (
    <div className="min-w-0">
      <div className="no-scrollbar flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border bg-card p-1">
        {secenekler.map((t) => (
          <Button
            key={t}
            size="sm"
            variant={aralikAdi === t ? 'default' : 'ghost'}
            onClick={() => setAralikAdi(t)}
            className="h-7 shrink-0 px-3 text-[13px]"
          >
            {t}
          </Button>
        ))}

        <Popover>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant={aralikAdi === 'Özel' ? 'default' : 'ghost'}
              className="h-7 shrink-0 gap-1.5 px-3 text-[13px]"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Özel
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72">
            <div className="mb-3 text-[13px] font-semibold">Özel aralık</div>
            <label className="mb-2 block">
              <span className="mb-1 block text-[11px] text-muted-foreground">Başlangıç</span>
              <input
                type="date"
                value={ozelBas}
                max={ozelBit}
                onChange={(e) => setOzel(e.target.value, ozelBit)}
                className="h-9 w-full rounded-md border bg-transparent px-2.5 text-[13px] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </label>
            <label className="mb-3 block">
              <span className="mb-1 block text-[11px] text-muted-foreground">Bitiş</span>
              <input
                type="date"
                value={ozelBit}
                min={ozelBas}
                onChange={(e) => setOzel(ozelBas, e.target.value)}
                className="h-9 w-full rounded-md border bg-transparent px-2.5 text-[13px] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </label>
            <Separator className="mb-3" />
            <div className="flex flex-wrap gap-1.5">
              {[
                { e: 'Son 14 gün', g: 14 },
                { e: 'Son 60 gün', g: 60 },
                { e: 'Son 6 ay', g: 180 },
                { e: 'Son 1 yıl', g: 365 },
              ].map((h) => (
                <Button
                  key={h.e}
                  size="sm"
                  variant="outline"
                  onClick={() => kisayol(h.g)}
                  className="h-7 px-2 text-[11px]"
                >
                  {h.e}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="mt-1 text-right text-[11px] text-muted-foreground">
        {tarihYaz(aralik.baslangic)} – {tarihYaz(aralik.bitis)} · {aralik.gun} gün
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- BÖLÜM KARTI */

/**
 * Standart bölüm kartı — shadcn Card üstüne kurulu.
 * `no` sadece kaynak kodda 68'lik listedeki karşılığını belirtir, ekranda görünmez.
 */
export function Bolum({
  baslik,
  aciklama,
  sag,
  children,
  className,
  govdeClassName,
}: {
  no?: number | number[]
  baslik: string
  aciklama?: string
  sag?: ReactNode
  children: ReactNode
  className?: string
  govdeClassName?: string
}) {
  return (
    <Card className={cn('gap-0 py-0', className)}>
      <CardHeader className="flex flex-col items-start gap-3 border-b px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <CardTitle className="text-[15px]">{baslik}</CardTitle>
          {aciklama && <CardDescription className="mt-0.5 text-xs">{aciklama}</CardDescription>}
        </div>
        {sag}
      </CardHeader>
      <CardContent className={cn('px-4 py-4 sm:px-5 sm:py-5', govdeClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}

/* ---------------------------------------------------------------- ROZET */

export type RozetTonu = 'brand' | 'emerald' | 'amber' | 'red' | 'slate'

/** Renkli durum rozeti — shadcn Badge üstüne kurulu. */
export function Rozet({ ton = 'slate', children }: { ton?: RozetTonu; children: ReactNode }) {
  const tonlar: Record<RozetTonu, string> = {
    brand: 'border-transparent bg-brand/10 text-brand',
    emerald: 'border-transparent bg-emerald-50 text-emerald-700',
    amber: 'border-transparent bg-amber-50 text-amber-700',
    red: 'border-transparent bg-red-50 text-red-700',
    slate: 'border-transparent bg-muted text-muted-foreground',
  }
  return (
    <Badge variant="secondary" className={cn('font-semibold', tonlar[ton])}>
      {children}
    </Badge>
  )
}

/* ---------------------------------------------------------------- DEĞİŞİM */

export function Degisim({ deger }: { deger: number }) {
  if (deger === 0) return <span className="text-xs text-muted-foreground">—</span>
  const artis = deger > 0
  return (
    <span className={cn('text-xs', artis ? 'text-emerald-600' : 'text-destructive')}>
      {artis ? '▲' : '▼'} %{Math.abs(deger).toFixed(1).replace('.', ',')}
    </span>
  )
}

/* ---------------------------------------------------------------- ÇUBUKLU LİSTE */

export function CubukListe({
  satirlar,
  onTikla,
  tiklanabilir = false,
}: {
  satirlar: { ad: string; sol?: string; sayi: number; yuzde: number; ek?: string }[]
  onTikla?: (ad: string) => void
  tiklanabilir?: boolean
}) {
  return (
    <div className="space-y-2.5">
      {satirlar.map((s) => (
        <div key={s.ad}>
          <button
            onClick={() => onTikla?.(s.ad)}
            disabled={!tiklanabilir}
            className="flex w-full items-center gap-2.5 text-left text-[13px] transition disabled:cursor-default enabled:hover:text-brand"
          >
            {s.sol && <span className="w-5 shrink-0 text-center">{s.sol}</span>}
            <span className="flex-1 truncate">{s.ad}</span>
            {s.ek && <span className="text-xs text-muted-foreground">{s.ek}</span>}
            <span className="font-semibold tabular-nums">{s.sayi.toLocaleString('tr-TR')}</span>
            <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
              %{s.yuzde}
            </span>
          </button>
          <div className="mt-1 h-[3px] overflow-hidden rounded-full bg-muted">
            <i className="block h-full bg-brand/75" style={{ width: `${s.yuzde}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------- TABLO */

export type Sutun<T> = {
  anahtar: keyof T & string
  baslik: string
  sayisal?: boolean
  genislik?: string
  bicim?: (satir: T) => ReactNode
}

/** Sıralanabilir tablo — shadcn Table üstüne kurulu. */
export function Tablo<T extends Record<string, unknown>>({
  sutunlar,
  satirlar,
  varsayilanSira,
}: {
  sutunlar: Sutun<T>[]
  satirlar: T[]
  varsayilanSira?: keyof T & string
}) {
  const [sira, setSira] = useState<{ anahtar: string; yon: 'asc' | 'desc' }>({
    anahtar: varsayilanSira ?? sutunlar[0].anahtar,
    yon: 'desc',
  })

  const sirali = useMemo(() => {
    const kopya = [...satirlar]
    kopya.sort((a, b) => {
      const x = a[sira.anahtar]
      const y = b[sira.anahtar]
      if (typeof x === 'number' && typeof y === 'number') return sira.yon === 'asc' ? x - y : y - x
      return sira.yon === 'asc'
        ? String(x).localeCompare(String(y), 'tr')
        : String(y).localeCompare(String(x), 'tr')
    })
    return kopya
  }, [satirlar, sira])

  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
      <Table className="min-w-[520px]">
        <TableHeader>
          <TableRow>
            {sutunlar.map((s) => (
              <TableHead
                key={s.anahtar}
                style={{ width: s.genislik }}
                onClick={() =>
                  setSira((o) =>
                    o.anahtar === s.anahtar
                      ? { anahtar: s.anahtar, yon: o.yon === 'asc' ? 'desc' : 'asc' }
                      : { anahtar: s.anahtar, yon: 'desc' },
                  )
                }
                className={cn(
                  'cursor-pointer text-xs select-none hover:text-foreground',
                  s.sayisal && 'text-right',
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {s.baslik}
                  {sira.anahtar === s.anahtar &&
                    (sira.yon === 'asc' ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    ))}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sirali.map((satir, i) => (
            <TableRow key={i}>
              {sutunlar.map((s) => (
                <TableCell
                  key={s.anahtar}
                  className={cn('text-[13px]', s.sayisal && 'text-right tabular-nums')}
                >
                  {s.bicim ? s.bicim(satir) : String(satir[s.anahtar])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/* ---------------------------------------------------------------- GRAFİKLER */

/** Basit çizgi grafik (kendi SVG'miz — Recharts geçişi ayrı adımda). */
export function CizgiGrafik({
  seriler,
  yukseklik = 160,
  etiketler,
}: {
  seriler: { ad: string; renk: string; noktalar: number[]; kesikli?: boolean }[]
  yukseklik?: number
  etiketler?: string[]
}) {
  const [aktif, setAktif] = useState<number | null>(null)
  const G = 600
  const Y = yukseklik
  const hepsi = seriler.flatMap((s) => s.noktalar)
  const enAz = Math.min(...hepsi) * 0.9
  const enCok = Math.max(...hepsi) * 1.05
  const adet = seriler[0]?.noktalar.length ?? 0

  const x = (i: number) => (i / Math.max(1, adet - 1)) * G
  const y = (v: number) => Y - ((v - enAz) / (enCok - enAz)) * Y

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${G} ${Y}`}
        className="w-full"
        preserveAspectRatio="none"
        style={{ height: Y }}
      >
        {[0.25, 0.5, 0.75].map((o) => (
          <line
            key={o}
            x1="0"
            x2={G}
            y1={Y * o}
            y2={Y * o}
            stroke="currentColor"
            strokeWidth="1"
            className="text-border"
          />
        ))}
        {seriler.map((s) => (
          <polyline
            key={s.ad}
            fill="none"
            stroke={s.renk}
            strokeWidth="2"
            strokeDasharray={s.kesikli ? '4 4' : undefined}
            strokeLinejoin="round"
            points={s.noktalar.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
          />
        ))}
        {aktif !== null && (
          <line
            x1={x(aktif)}
            x2={x(aktif)}
            y1="0"
            y2={Y}
            stroke="#c30716"
            strokeWidth="1"
            opacity=".4"
          />
        )}
        {Array.from({ length: adet }).map((_, i) => (
          <rect
            key={i}
            x={x(i) - G / adet / 2}
            y="0"
            width={G / adet}
            height={Y}
            fill="transparent"
            onMouseEnter={() => setAktif(i)}
            onMouseLeave={() => setAktif(null)}
          />
        ))}
      </svg>

      {aktif !== null && (
        <div
          className="pointer-events-none absolute -top-1 rounded-lg bg-popover px-2.5 py-1.5 text-[11px] text-popover-foreground shadow-md ring-1 ring-border"
          style={{
            left: `${(aktif / Math.max(1, adet - 1)) * 100}%`,
            transform: 'translateX(-50%)',
          }}
        >
          {etiketler?.[aktif] && (
            <div className="mb-0.5 border-b pb-0.5 font-semibold whitespace-nowrap">
              {etiketler[aktif]}
            </div>
          )}
          {seriler.map((s) => (
            <div key={s.ad} className="whitespace-nowrap">
              {s.ad}: <b>{s.noktalar[aktif].toLocaleString('tr-TR')}</b>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 flex gap-4">
        {seriler.map((s) => (
          <span key={s.ad} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <i className="h-0.5 w-4 rounded" style={{ background: s.renk }} />
            {s.ad}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Halka grafik (dağılımlar için). */
export function Halka({ dilimler }: { dilimler: { ad: string; yuzde: number }[] }) {
  const renkler = ['#c30716', '#e0574f', '#f0968d', '#f7c6c0', '#e5e7eb']
  let acik = 0
  const C = 2 * Math.PI * 40
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
        {dilimler.map((d, i) => {
          const uzunluk = (d.yuzde / 100) * C
          const el = (
            <circle
              key={d.ad}
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={renkler[i % renkler.length]}
              strokeWidth="14"
              strokeDasharray={`${uzunluk} ${C - uzunluk}`}
              strokeDashoffset={-acik}
            />
          )
          acik += uzunluk
          return el
        })}
      </svg>
      <div className="space-y-1.5">
        {dilimler.map((d, i) => (
          <div key={d.ad} className="flex items-center gap-2 text-[13px]">
            <i
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: renkler[i % renkler.length] }}
            />
            <span className="flex-1">{d.ad}</span>
            <span className="font-semibold tabular-nums">%{d.yuzde}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
