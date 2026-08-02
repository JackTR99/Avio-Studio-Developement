import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * IZGARA HARİTA (dot map) — canvas ile çizilir.
 *
 * Harita nokta nokta çizilir. Her nokta bir bölgeye aittir; bölgenin değerine
 * göre renklenir. Denizler çizilmez. Veri gelmeyen bölge gri kalır.
 *
 * NEDEN CANVAS: On binlerce noktayı SVG ile çizmek tarayıcıyı yorar (her nokta
 * ayrı bir DOM ögesi olur). Canvas'ta tek yüzeye çizilir. Normalde canvas'ın
 * zorluğu "fare hangi ögenin üstünde" sorusudur; bizde ızgara DÜZENLİ olduğu
 * için bu basit bir bölme işlemi — arama gerekmiyor.
 *
 * Veri `public/izgara/*.json` içinden gelir; `scripts/izgara-uret.mjs` üretir.
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

/** Bölge adını eşleştirmek için sadeleştirir. */
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

const MARKA = [195, 7, 22] // #c30716

export function IzgaraHarita({
  izgara,
  degerler,
  onBolgeTikla,
  yukleniyor,
  className,
}: {
  izgara: Izgara | null
  degerler: BolgeDegeri[]
  onBolgeTikla?: (bolge: { kod: string; ad: string; deger: number }) => void
  yukleniyor?: boolean
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sarmalRef = useRef<HTMLDivElement>(null)
  const [uzerinde, setUzerinde] = useState<number | null>(null)
  const [imlec, setImlec] = useState({ x: 0, y: 0 })

  /** Bölge indeksi → { ad, kod, deger, yogunluk 0..1 } */
  const bolgeBilgi = useMemo(() => {
    if (!izgara) return []
    // Eşleşme koda, yoksa ada göre. Eşleşince BİZİM adımızı kullanırız —
    // harita verisinde ülke adları İngilizce ("Turkey"), bizde Türkçe.
    const kodaGore = new Map<string, BolgeDegeri>()
    const adaGore = new Map<string, BolgeDegeri>()
    for (const d of degerler) {
      if (d.kod) kodaGore.set(d.kod.toUpperCase(), d)
      adaGore.set(anahtar(d.ad), d)
    }
    const eslesen = izgara.bolgeler.map(
      (b) => kodaGore.get(b.kod.toUpperCase()) ?? adaGore.get(anahtar(b.ad)) ?? null,
    )
    const enBuyuk = Math.max(1, ...eslesen.map((e) => e?.deger ?? 0))
    return izgara.bolgeler.map((b, i) => {
      const e = eslesen[i]
      const deger = e?.deger ?? 0
      return {
        kod: b.kod,
        ad: e?.ad ?? b.ad, // eşleşme varsa Türkçe adımız
        deger,
        // Karekök: küçük değerler de görünür olsun, tek bölge her şeyi ezmesin
        yogunluk: deger > 0 ? Math.sqrt(deger / enBuyuk) : 0,
      }
    })
  }, [izgara, degerler])

  /**
   * Hangi hücrede kaç nokta var — fare takibi için.
   * Anahtar: satır * sütunSayısı + sütun → bölge indeksi
   */
  const hucreHaritasi = useMemo(() => {
    const m = new Map<number, number>()
    if (!izgara) return m
    for (const [sx, sy, bi] of izgara.noktalar) m.set(sy * izgara.sutun + sx, bi)
    return m
  }, [izgara])

  /* --- Çizim --- */
  useEffect(() => {
    const cv = canvasRef.current
    const sarmal = sarmalRef.current
    if (!cv || !sarmal || !izgara) return

    function ciz() {
      if (!cv || !sarmal || !izgara) return
      const en = sarmal.clientWidth
      const boy = Math.round((en * izgara.satir) / izgara.sutun)
      const oran = window.devicePixelRatio || 1

      cv.width = en * oran
      cv.height = boy * oran
      cv.style.width = `${en}px`
      cv.style.height = `${boy}px`

      const ctx = cv.getContext('2d')
      if (!ctx) return
      ctx.setTransform(oran, 0, 0, oran, 0, 0)
      ctx.clearRect(0, 0, en, boy)

      const hucre = en / izgara.sutun
      const r = Math.max(0.6, hucre * 0.36)

      for (const [sx, sy, bi] of izgara.noktalar) {
        const b = bolgeBilgi[bi]
        const vurgulu = uzerinde === bi
        if (b.deger > 0) {
          const a = 0.22 + b.yogunluk * 0.78
          ctx.fillStyle = `rgba(${MARKA[0]},${MARKA[1]},${MARKA[2]},${vurgulu ? 1 : a})`
        } else {
          ctx.fillStyle = vurgulu ? 'rgba(100,116,139,0.7)' : 'rgba(100,116,139,0.28)'
        }
        ctx.beginPath()
        ctx.arc((sx + 0.5) * hucre, (sy + 0.5) * hucre, vurgulu ? r * 1.3 : r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ciz()
    const gozlemci = new ResizeObserver(ciz)
    gozlemci.observe(sarmal)
    return () => gozlemci.disconnect()
  }, [izgara, bolgeBilgi, uzerinde])

  /* --- Fare: hangi hücre? Basit bölme işlemi --- */
  function hucreBul(e: React.MouseEvent) {
    const cv = canvasRef.current
    if (!cv || !izgara) return null
    const k = cv.getBoundingClientRect()
    const hucre = k.width / izgara.sutun
    const sx = Math.floor((e.clientX - k.left) / hucre)
    const sy = Math.floor((e.clientY - k.top) / hucre)
    return hucreHaritasi.get(sy * izgara.sutun + sx) ?? null
  }

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

  const aktif = uzerinde !== null ? bolgeBilgi[uzerinde] : null

  return (
    <div ref={sarmalRef} className={cn('relative w-full', className)}>
      <canvas
        ref={canvasRef}
        className="block w-full"
        style={{ cursor: aktif && onBolgeTikla ? 'pointer' : 'default' }}
        onMouseMove={(e) => {
          const bi = hucreBul(e)
          setUzerinde(bi)
          if (bi !== null) {
            const k = e.currentTarget.getBoundingClientRect()
            setImlec({ x: e.clientX - k.left, y: e.clientY - k.top })
          }
        }}
        onMouseLeave={() => setUzerinde(null)}
        onClick={(e) => {
          const bi = hucreBul(e)
          if (bi === null) return
          const b = bolgeBilgi[bi]
          onBolgeTikla?.({ kod: b.kod, ad: b.ad, deger: b.deger })
        }}
      />

      {aktif && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-lg bg-popover px-2.5 py-1.5 text-[11px] whitespace-nowrap text-popover-foreground shadow-md ring-1 ring-border"
          style={{ left: imlec.x, top: imlec.y - 10 }}
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
