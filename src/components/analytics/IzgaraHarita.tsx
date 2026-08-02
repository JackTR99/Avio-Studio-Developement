import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * IZGARA HARİTA (dot map)
 *
 * Harita nokta nokta çizilir. Her nokta bir bölgeye aittir; bölgenin değerine
 * göre renklenir. Denizler çizilmez. Veri gelmeyen bölge gri kalır.
 *
 * Veri `public/izgara/*.json` içinden gelir — uygulama hesap yapmaz, hazır
 * listeyi çizer. Dosyalar `scripts/izgara-uret.mjs` ile üretilir.
 * Sınır verisi: geoBoundaries (CC BY 4.0).
 */

export type Izgara = {
  ad: string
  seviye: 'ulke' | 'il' | 'ilce'
  adim: number
  sutun: number
  satir: number
  /** [sütun, satır, bölgeIndeksi] */
  noktalar: [number, number, number][]
  bolgeler: { kod: string; ad: string }[]
}

/** Haritaya verilen değerler. `kod` varsa önce onunla, yoksa adla eşleşir. */
export type BolgeDegeri = { ad: string; kod?: string; deger: number }

/** Bölge adını eşleştirmek için sadeleştirir (büyük/küçük, aksan, boşluk). */
function anahtar(s: string) {
  return s
    .toLocaleLowerCase('tr')
    .replace(/[ıİ]/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '')
}

export function IzgaraHarita({
  izgara,
  degerler,
  seciliKod,
  onBolgeTikla,
  yukleniyor,
  className,
}: {
  izgara: Izgara | null
  degerler: BolgeDegeri[]
  seciliKod?: string | null
  onBolgeTikla?: (bolge: { kod: string; ad: string; deger: number }) => void
  yukleniyor?: boolean
  className?: string
}) {
  const [uzerinde, setUzerinde] = useState<number | null>(null)
  const [imlec, setImlec] = useState({ x: 0, y: 0 })
  const ref = useRef<SVGSVGElement>(null)

  /** Bölge indeksi → { ad, kod, deger, yogunluk 0..1 } */
  const bolgeBilgi = useMemo(() => {
    if (!izgara) return []
    // Önce koda, sonra ada göre eşleştir (dünyada ülke adları İngilizce gelir)
    const kodaGore = new Map<string, number>()
    const adaGore = new Map<string, number>()
    for (const d of degerler) {
      if (d.kod) kodaGore.set(d.kod.toUpperCase(), d.deger)
      adaGore.set(anahtar(d.ad), d.deger)
    }
    const ham = izgara.bolgeler.map(
      (b) => kodaGore.get(b.kod.toUpperCase()) ?? adaGore.get(anahtar(b.ad)) ?? 0,
    )
    const enBuyuk = Math.max(1, ...ham)
    return izgara.bolgeler.map((b, i) => ({
      ...b,
      deger: ham[i],
      // Karekök: küçük değerler de görünür olsun, tek bölge her şeyi ezmesin
      yogunluk: ham[i] > 0 ? Math.sqrt(ham[i] / enBuyuk) : 0,
    }))
  }, [izgara, degerler])

  if (yukleniyor || !izgara) {
    return (
      <div
        className={cn(
          'flex aspect-[2/1] w-full items-center justify-center rounded-lg border bg-muted/30',
          className,
        )}
      >
        <span className="text-xs text-muted-foreground">Harita yükleniyor…</span>
      </div>
    )
  }

  // Nokta yarıçapı: ızgara sıklığına göre; aralarında hafif boşluk kalsın
  const r = 0.36
  const G = izgara.sutun
  const Y = izgara.satir

  const aktif = uzerinde !== null ? bolgeBilgi[uzerinde] : null

  return (
    <div className={cn('relative w-full', className)}>
      <svg
        ref={ref}
        viewBox={`0 0 ${G} ${Y}`}
        className="block w-full"
        role="img"
        aria-label={`${izgara.ad} haritası`}
        onMouseLeave={() => setUzerinde(null)}
      >
        {izgara.noktalar.map(([sx, sy, bi], i) => {
          const b = bolgeBilgi[bi]
          const vurgulu = uzerinde === bi || (seciliKod != null && b.kod === seciliKod)
          const dolu = b.deger > 0
          return (
            <circle
              key={i}
              cx={sx + 0.5}
              cy={sy + 0.5}
              r={vurgulu ? r * 1.25 : r}
              fill={dolu ? '#c30716' : 'currentColor'}
              className={dolu ? '' : 'text-muted-foreground/25'}
              fillOpacity={dolu ? 0.22 + b.yogunluk * 0.78 : 1}
              onMouseEnter={(e) => {
                setUzerinde(bi)
                const kap = ref.current?.getBoundingClientRect()
                if (kap) setImlec({ x: e.clientX - kap.left, y: e.clientY - kap.top })
              }}
              onClick={() => onBolgeTikla?.({ kod: b.kod, ad: b.ad, deger: b.deger })}
              style={{ cursor: onBolgeTikla ? 'pointer' : 'default' }}
            />
          )
        })}
      </svg>

      {aktif && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-lg bg-popover px-2.5 py-1.5 text-[11px] whitespace-nowrap text-popover-foreground shadow-md ring-1 ring-border"
          style={{ left: imlec.x, top: imlec.y - 8 }}
        >
          <div className="font-semibold">{aktif.ad}</div>
          <div className="text-muted-foreground">
            {aktif.deger > 0 ? aktif.deger.toLocaleString('tr-TR') : 'veri yok'}
          </div>
        </div>
      )}
    </div>
  )
}

/** Izgara dosyasını yükler (tembel — sadece bakılan bölge indirilir). */
export function useIzgara(dosya: string | null) {
  const [izgara, setIzgara] = useState<Izgara | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)

  useEffect(() => {
    if (!dosya) {
      setIzgara(null)
      return
    }
    let iptal = false
    setYukleniyor(true)
    setHata(null)
    fetch(`/izgara/${dosya}`)
      .then((c) => {
        if (!c.ok) throw new Error(`Harita bulunamadı (${c.status})`)
        return c.json()
      })
      .then((v: Izgara) => {
        if (!iptal) setIzgara(v)
      })
      .catch((e) => {
        if (!iptal) setHata(e.message)
      })
      .finally(() => {
        if (!iptal) setYukleniyor(false)
      })
    return () => {
      iptal = true
    }
  }, [dosya])

  return { izgara, yukleniyor, hata }
}
