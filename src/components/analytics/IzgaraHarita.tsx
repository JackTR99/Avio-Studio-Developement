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

/**
 * Bir harita parçası. Çoğu ülke tek parçadır. Uzak toprakları olan ülkeler
 * (ABD'nin Alaska ve Hawaii'si, Fransa'nın Guyana'sı) ayrı kutulara bölünür —
 * yoksa ana kara minicik kalır. `ad` doluysa o parça küçük bir kutudur.
 */
export type Parca = {
  ad: string | null
  sutun: number
  satir: number
  /** [sütun, satır, bölgeIndeksi] */
  noktalar: [number, number, number][]
}

export type Izgara = {
  ad: string
  seviye: 'ulke' | 'il' | 'ilce'
  parcalar: Parca[]
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
  // Dokunmatikte parmak tooltip'i kapatır — onun yerine haritanın altında
  // bir kart açılır, alt kırılıma inmek ayrı bir butonla olur.
  const [dokunulan, setDokunulan] = useState<number | null>(null)
  const sonGirdi = useRef<'mouse' | 'dokunma'>('mouse')

  // Harita değişince (alt kırılıma inildi) seçim sıfırlanır
  useEffect(() => {
    setDokunulan(null)
    setUzerinde(null)
  }, [izgara])

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
   * Her parça için "hangi hücrede hangi bölge var" tablosu — fare takibi için.
   * Anahtar: satır * sütunSayısı + sütun → bölge indeksi
   */
  const hucreHaritalari = useMemo(() => {
    if (!izgara) return []
    return izgara.parcalar.map((p) => {
      const m = new Map<number, number>()
      for (const [sx, sy, bi] of p.noktalar) m.set(sy * p.sutun + sx, bi)
      return m
    })
  }, [izgara])

  /**
   * YERLEŞİM — ana harita üstte tam genişlik, uzak toprak kutuları altta şerit.
   * Her parça kendi en/boy oranını korur; kutular şerit içinde ortalanır.
   */
  const duzen = useMemo(() => {
    if (!izgara || !izgara.parcalar.length) return null
    return (en: number) => {
      const [ana, ...kutular] = izgara.parcalar
      const anaOlcek = en / ana.sutun
      const anaBoy = ana.satir * anaOlcek
      const yerler = [{ px: 0, py: 0, olcek: anaOlcek, parca: ana }]

      if (!kutular.length) return { yerler, toplamBoy: anaBoy }

      const bosluk = 8
      const ust = 10 // ana haritayla şerit arası
      const kutuEn = (en - bosluk * (kutular.length - 1)) / kutular.length
      const seritTavan = anaBoy * 0.4
      const olcekler = kutular.map((k) => Math.min(kutuEn / k.sutun, seritTavan / k.satir))
      const seritBoy = Math.max(...kutular.map((k, i) => k.satir * olcekler[i]))

      kutular.forEach((k, i) => {
        const o = olcekler[i]
        yerler.push({
          px: i * (kutuEn + bosluk) + (kutuEn - k.sutun * o) / 2,
          py: anaBoy + ust + (seritBoy - k.satir * o) / 2,
          olcek: o,
          parca: k,
        })
      })
      return { yerler, toplamBoy: anaBoy + ust + seritBoy }
    }
  }, [izgara])

  /* --- Çizim --- */
  useEffect(() => {
    const cv = canvasRef.current
    const sarmal = sarmalRef.current
    if (!cv || !sarmal || !izgara) return

    function ciz() {
      if (!cv || !sarmal || !izgara || !duzen) return
      const en = sarmal.clientWidth
      const { yerler, toplamBoy } = duzen(en)
      const boy = Math.round(toplamBoy)
      const oran = window.devicePixelRatio || 1

      cv.width = en * oran
      cv.height = boy * oran
      cv.style.width = `${en}px`
      cv.style.height = `${boy}px`

      const ctx = cv.getContext('2d')
      if (!ctx) return
      ctx.setTransform(oran, 0, 0, oran, 0, 0)
      ctx.clearRect(0, 0, en, boy)

      for (const { px, py, olcek, parca } of yerler) {
        const r = Math.max(0.6, olcek * 0.36)

        for (const [sx, sy, bi] of parca.noktalar) {
          const b = bolgeBilgi[bi]
          if (!b) continue
          const vurgulu = uzerinde === bi
          if (b.deger > 0) {
            const a = 0.22 + b.yogunluk * 0.78
            ctx.fillStyle = `rgba(${MARKA[0]},${MARKA[1]},${MARKA[2]},${vurgulu ? 1 : a})`
          } else {
            ctx.fillStyle = vurgulu ? 'rgba(100,116,139,0.7)' : 'rgba(100,116,139,0.28)'
          }
          ctx.beginPath()
          ctx.arc(
            px + (sx + 0.5) * olcek,
            py + (sy + 0.5) * olcek,
            vurgulu ? r * 1.3 : r,
            0,
            Math.PI * 2,
          )
          ctx.fill()
        }

        // Uzak toprak kutusunun etiketi
        if (parca.ad) {
          ctx.fillStyle = 'rgba(100,116,139,0.85)'
          ctx.font = '600 9px ui-sans-serif, system-ui, sans-serif'
          ctx.textBaseline = 'top'
          ctx.fillText(parca.ad, px, py + parca.satir * olcek + 3)
        }
      }
    }

    ciz()
    const gozlemci = new ResizeObserver(ciz)
    gozlemci.observe(sarmal)
    return () => gozlemci.disconnect()
  }, [izgara, bolgeBilgi, uzerinde, duzen])

  /* --- Fare/parmak: hangi parçanın hangi hücresi? Basit bölme işlemi --- */
  function hucreBul(e: { clientX: number; clientY: number }) {
    const cv = canvasRef.current
    if (!cv || !izgara || !duzen) return null
    const k = cv.getBoundingClientRect()
    const x = e.clientX - k.left
    const y = e.clientY - k.top

    const { yerler } = duzen(k.width)
    for (let i = 0; i < yerler.length; i++) {
      const { px, py, olcek, parca } = yerler[i]
      const sx = Math.floor((x - px) / olcek)
      const sy = Math.floor((y - py) / olcek)
      if (sx < 0 || sy < 0 || sx >= parca.sutun || sy >= parca.satir) continue
      const bi = hucreHaritalari[i]?.get(sy * parca.sutun + sx)
      if (bi !== undefined) return bi
    }
    return null
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
  const secili = dokunulan !== null ? bolgeBilgi[dokunulan] : null

  return (
    <div ref={sarmalRef} className={cn('relative w-full', className)}>
      <canvas
        ref={canvasRef}
        className="block w-full touch-manipulation"
        style={{ cursor: aktif && onBolgeTikla ? 'pointer' : 'default' }}
        onPointerDown={(e) => {
          sonGirdi.current = e.pointerType === 'mouse' ? 'mouse' : 'dokunma'
          // Dokunmatikte: seçimi karta taşı, alt kırılıma inme
          if (e.pointerType !== 'mouse') {
            const bi = hucreBul(e)
            setUzerinde(bi)
            setDokunulan(bi)
          }
        }}
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
          // Fare tıklaması doğrudan iner; dokunmatik yukarıdaki kartla ilerler
          if (sonGirdi.current === 'dokunma') return
          const bi = hucreBul(e)
          if (bi === null) return
          const b = bolgeBilgi[bi]
          onBolgeTikla?.({ kod: b.kod, ad: b.ad, deger: b.deger })
        }}
      />

      {/* Masaüstü: imlecin yanında ipucu */}
      {aktif && (
        <div
          className="pointer-events-none absolute z-20 hidden -translate-x-1/2 -translate-y-full rounded-lg bg-popover px-2.5 py-1.5 text-[11px] whitespace-nowrap text-popover-foreground shadow-md ring-1 ring-border sm:block"
          style={{ left: imlec.x, top: imlec.y - 10 }}
        >
          <div className="font-semibold">{aktif.ad}</div>
          <div className="text-muted-foreground">
            {aktif.deger > 0 ? aktif.deger.toLocaleString('tr-TR') : 'veri yok'}
          </div>
        </div>
      )}

      {/* Dokunmatik: haritanın altında kart — parmak ipucunu kapatıyor */}
      {secili && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border bg-card px-3 py-2 sm:hidden">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold">{secili.ad}</div>
            <div className="text-[11px] text-muted-foreground">
              {secili.deger > 0 ? secili.deger.toLocaleString('tr-TR') : 'veri yok'}
            </div>
          </div>
          {onBolgeTikla && (
            <button
              onClick={() => {
                onBolgeTikla({ kod: secili.kod, ad: secili.ad, deger: secili.deger })
                setDokunulan(null)
                setUzerinde(null)
              }}
              className="shrink-0 rounded-md bg-brand px-2.5 py-1.5 text-[11px] font-semibold text-white"
            >
              İçine gir
            </button>
          )}
          <button
            onClick={() => {
              setDokunulan(null)
              setUzerinde(null)
            }}
            aria-label="Kapat"
            className="shrink-0 rounded-md border px-2 py-1.5 text-[11px] text-muted-foreground"
          >
            ✕
          </button>
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
      .then((v: Izgara & Partial<Parca>) => {
        // Tek parça üretilmiş eski dosyalar da tek elemanlı parça listesine çevrilir
        const d: Izgara = v.parcalar
          ? v
          : {
              ...v,
              parcalar: [
                {
                  ad: null,
                  sutun: v.sutun as number,
                  satir: v.satir as number,
                  noktalar: v.noktalar as [number, number, number][],
                },
              ],
            }
        if (!iptal) setIzgara(d)
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
