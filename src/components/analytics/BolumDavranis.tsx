import { useEffect, useRef, useState } from 'react'
import { MousePointerClick, Pause, Play, RotateCcw, Smartphone, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { isiHaritasi, type Kayit } from '@/lib/mock'
import { useVeri } from '@/lib/veri'
import { Bolum, Degisim, Rozet, Tablo } from './parts'

/** Sahte sayfa iskeleti — ısı haritası ve replay bunun üstüne biner. */
function SahteSayfa({ mobil = false }: { mobil?: boolean }) {
  return (
    <div className="absolute inset-0 p-[6%]">
      <div className="mb-[4%] flex items-center justify-between">
        <div className="h-[2.2%] w-[22%] rounded bg-slate-300" style={{ minHeight: 8 }} />
        {!mobil && (
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-2 w-10 rounded bg-slate-200" />
            ))}
          </div>
        )}
      </div>
      <div className="mb-[3%] h-[16%] rounded-lg bg-slate-200" />
      <div className="mb-[2%] h-3 w-[70%] rounded bg-slate-200" />
      <div className="mb-[4%] h-3 w-[52%] rounded bg-slate-200" />
      <div className="mx-auto mb-[5%] h-8 w-[36%] rounded-lg bg-slate-300" />
      <div className={`mb-[4%] grid gap-3 ${mobil ? 'grid-cols-1' : 'grid-cols-3'}`}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-slate-100" />
        ))}
      </div>
      <div className="mb-[2%] h-3 w-[60%] rounded bg-slate-200" />
      <div className="mb-[4%] h-3 w-[44%] rounded bg-slate-200" />
      <div className="mx-auto h-8 w-[30%] rounded-lg bg-slate-300" />
    </div>
  )
}

/** 30,31,32,33 — ısı haritaları (tıklama / kaydırma / fare hareketi). */
export function IsiHaritasiBlogu() {
  const { veri } = useVeri()
  const [tur, setTur] = useState<'tiklama' | 'kaydirma' | 'hareket'>('tiklama')
  const [zaman, setZaman] = useState('Günlük')
  const [mobil, setMobil] = useState(false)

  const noktalar = isiHaritasi[tur]
  const no = tur === 'tiklama' ? 30 : tur === 'kaydirma' ? 31 : 32

  return (
    <Bolum
      no={[no, 33]}
      baslik="Isı haritası"
      aciklama="Kırmızı = yoğun. Ham noktalar değil, özetten çiziliyor."
      sag={
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-lg border p-0.5">
            {(['tiklama', 'kaydirma', 'hareket'] as const).map((t) => (
              <Button
                key={t}
                size="sm"
                variant={tur === t ? 'default' : 'ghost'}
                onClick={() => setTur(t)}
                className="h-7 px-2.5 text-xs"
              >
                {t === 'tiklama' ? 'Tıklama' : t === 'kaydirma' ? 'Kaydırma' : 'Fare'}
              </Button>
            ))}
          </div>
          <div className="flex gap-1 rounded-lg border p-0.5">
            {['Saatlik', 'Günlük', 'Haftalık'].map((z) => (
              <Button
                key={z}
                size="sm"
                variant={zaman === z ? 'secondary' : 'ghost'}
                onClick={() => setZaman(z)}
                className="h-7 px-2 text-xs"
              >
                {z}
              </Button>
            ))}
          </div>
          <Button
            size="icon"
            variant="outline"
            onClick={() => setMobil((m) => !m)}
            className="h-8 w-8"
            title={mobil ? 'Masaüstü görünümü' : 'Mobil görünüm'}
          >
            {mobil ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
          </Button>
        </div>
      }
    >
      <div className="flex justify-center">
        <div
          className={`relative w-full overflow-hidden rounded-lg border border-slate-200 bg-white ${
            mobil ? 'max-w-[300px] aspect-[300/520]' : 'max-w-[640px] aspect-[640/440]'
          }`}
        >
          <SahteSayfa mobil={mobil} />
          {/* ısı katmanı */}
          <div className="absolute inset-0">
            {noktalar.map((n, i) => (
              <span
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${n.x}%`,
                  top: `${n.y}%`,
                  width: tur === 'kaydirma' ? '100%' : `${70 * n.agirlik + 30}px`,
                  height: tur === 'kaydirma' ? '18%' : `${70 * n.agirlik + 30}px`,
                  transform: 'translate(-50%, -50%)',
                  background:
                    tur === 'kaydirma'
                      ? `rgba(195,7,22,${0.06 + n.agirlik * 0.3})`
                      : `radial-gradient(circle, rgba(195,7,22,${0.55 * n.agirlik}) 0%, rgba(195,7,22,${0.22 * n.agirlik}) 45%, rgba(195,7,22,0) 72%)`,
                  borderRadius: tur === 'kaydirma' ? 0 : '50%',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <i className="h-2.5 w-8 rounded" style={{ background: 'linear-gradient(90deg,#fde8ea,#c30716)' }} />
          az → çok
        </span>
        <span>
          {zaman} özet ·{' '}
          {tur === 'tiklama'
            ? `${veri.isiOzet.tiklama} tıklama`
            : tur === 'kaydirma'
              ? `${veri.isiOzet.kaydirma} oturum`
              : `${veri.isiOzet.hareket} hareket noktası`}
        </span>
      </div>
    </Bolum>
  )
}

/** 34, 35 — hüsran sinyalleri. */
export function HusranBlogu() {
  const { veri } = useVeri()
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Bolum no={34} baslik="Sinirli tıklama" aciklama="Aynı yere üst üste tıklıyorlar — bir şey çalışmıyor">
        {veri.sinirliTiklama.map((s) => (
          <div key={s.ogesi} className="flex items-center gap-3 border-b border-slate-100 py-2.5 last:border-0">
            <MousePointerClick className="h-4 w-4 shrink-0 text-red-500" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium">{s.ogesi}</div>
              <div className="text-xs text-slate-500">{s.yol}</div>
            </div>
            <Rozet ton="red">{s.sayi}</Rozet>
          </div>
        ))}
      </Bolum>

      <Bolum no={35} baslik="Boşa tıklama" aciklama="Tıkladı ama bir şey olmadı — buton sanıyorlar">
        {veri.bosaTiklama.map((s) => (
          <div key={s.ogesi} className="flex items-center gap-3 border-b border-slate-100 py-2.5 last:border-0">
            <MousePointerClick className="h-4 w-4 shrink-0 text-amber-500" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium">{s.ogesi}</div>
              <div className="text-xs text-slate-500">{s.yol}</div>
            </div>
            <Rozet ton="amber">{s.sayi}</Rozet>
          </div>
        ))}
      </Bolum>
    </div>
  )
}

/** 36, 37 — ziyaret kaydı listesi + kendi oynatıcımız. */
export function ReplayBlogu() {
  const { veri } = useVeri()
  const kayitlar = veri.kayitlar
  const [seciliId, setSeciliId] = useState<string | null>(null)
  const [oynuyor, setOynuyor] = useState(false)
  const [an, setAn] = useState(0) // 0..1
  const rafRef = useRef<number | null>(null)

  const secili: Kayit = kayitlar.find((k) => k.id === seciliId) ?? kayitlar[0]

  useEffect(() => {
    if (!oynuyor) return
    let onceki = performance.now()
    const dongu = (simdi: number) => {
      const fark = (simdi - onceki) / 1000
      onceki = simdi
      setAn((a) => {
        const yeni = a + fark / secili.sure
        if (yeni >= 1) {
          setOynuyor(false)
          return 1
        }
        return yeni
      })
      rafRef.current = requestAnimationFrame(dongu)
    }
    rafRef.current = requestAnimationFrame(dongu)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [oynuyor, secili])

  // imleç yolu — koordinat verisinden canlandırma (gerçekte veritabanından gelecek)
  const yol = [
    { x: 20, y: 12 }, { x: 48, y: 20 }, { x: 52, y: 34 }, { x: 30, y: 44 },
    { x: 50, y: 52 }, { x: 66, y: 60 }, { x: 50, y: 72 }, { x: 48, y: 86 },
  ]
  const i = Math.min(yol.length - 2, Math.floor(an * (yol.length - 1)))
  const t = an * (yol.length - 1) - i
  const imlec = {
    x: yol[i].x + (yol[i + 1].x - yol[i].x) * t,
    y: yol[i].y + (yol[i + 1].y - yol[i].y) * t,
  }

  const sn = Math.floor(an * secili.sure)
  const bicimle = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <Bolum
      no={[36, 37]}
      baslik="Ziyaret kayıtları"
      aciklama="Ağır video değil — koordinat verisinden kendi oynatıcımız canlandırıyor"
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Oynatıcı */}
        <div>
          <div className="relative mx-auto aspect-[560/380] w-full max-w-[560px] overflow-hidden rounded-lg border border-slate-200 bg-white">
            <SahteSayfa />
            {/* imleç */}
            <span
              className="pointer-events-none absolute z-10 transition-none"
              style={{ left: `${imlec.x}%`, top: `${imlec.y}%`, transform: 'translate(-50%,-50%)' }}
            >
              <span className="block h-4 w-4 rounded-full bg-brand/25 ring-2 ring-brand" />
            </span>
            {!oynuyor && an === 0 && (
              <button
                onClick={() => setOynuyor(true)}
                className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/10 backdrop-blur-[1px]"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg">
                  <Play className="ml-0.5 h-6 w-6" />
                </span>
              </button>
            )}
          </div>

          {/* Kontroller */}
          <div className="mx-auto mt-3 flex items-center gap-3" style={{ maxWidth: 560 }}>
            <Button
              size="icon"
              onClick={() => setOynuyor((o) => !o)}
              className="h-9 w-9 shrink-0 rounded-full bg-brand hover:bg-brand-dark"
            >
              {oynuyor ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => { setAn(0); setOynuyor(false) }}
              className="h-9 w-9 shrink-0 rounded-full"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <input
              type="range"
              min={0}
              max={1000}
              value={Math.round(an * 1000)}
              onChange={(e) => setAn(Number(e.target.value) / 1000)}
              className="flex-1 accent-[#c30716]"
            />
            <span className="w-20 text-right text-xs tabular-nums text-slate-500">
              {bicimle(sn)} / {bicimle(secili.sure)}
            </span>
          </div>
          <p className="mx-auto mt-2 text-center text-[11px] text-slate-400" style={{ maxWidth: 560 }}>
            {secili.cihaz} · {secili.ekran} · {secili.ulke}
          </p>
        </div>

        {/* Kayıt listesi */}
        <div>
          <h4 className="mb-2 text-[13px] font-semibold">Kayıtlar</h4>
          <div className="space-y-1.5">
            {kayitlar.map((k) => (
              <button
                key={k.id}
                onClick={() => { setSeciliId(k.id); setAn(0); setOynuyor(false) }}
                className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                  secili.id === k.id
                    ? 'border-brand bg-brand/5'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13px] font-medium">{k.yol}</span>
                  {k.sinirli && <Rozet ton="red">sinirli</Rozet>}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                  <span>{bicimle(k.sure)}</span>
                  <span>·</span>
                  <span className="truncate">{k.cihaz}</span>
                  <span className="ml-auto">{k.tarih}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Bolum>
  )
}

/** 38, 39 — olaylar ve dönüşümler. */
export function OlaylarBlogu() {
  const { veri } = useVeri()
  return (
    <Bolum no={[38, 39]} baslik="Olaylar ve dönüşümler" aciklama="Ziyaretçi ne yaptı, kaç lead geldi">
      {veri.olaylar.map((o) => (
        <div key={o.ad} className="flex items-center gap-3 border-b border-slate-100 py-2.5 last:border-0">
          <span className="flex-1 text-[13px]">{o.ad}</span>
          <span className="text-[15px] font-bold tabular-nums">{o.sayi}</span>
          <span className="w-16 text-right">
            <Degisim deger={o.degisim} />
          </span>
        </div>
      ))}
    </Bolum>
  )
}

/** 40 — hedef tanımlama. */
export function HedeflerBlogu() {
  const { veri } = useVeri()
  const [kapali, setKapali] = useState<string[]>(
    veri.hedefler.filter((h) => !h.aktif).map((h) => h.ad),
  )
  const liste = veri.hedefler.map((h) => ({ ...h, aktif: !kapali.includes(h.ad) }))
  return (
    <Bolum no={40} baslik="Hedefler" aciklama="Hangi hareket 'başarı' sayılsın — anahtarla aç/kapa">
      {liste.map((h) => (
        <div key={h.ad} className="flex items-center gap-3 border-b py-3 last:border-0">
          <Switch
            checked={h.aktif}
            onCheckedChange={() =>
              setKapali((k) => (k.includes(h.ad) ? k.filter((x) => x !== h.ad) : [...k, h.ad]))
            }
            className="data-[state=checked]:bg-brand"
          />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium">{h.ad}</div>
            <div className="truncate text-xs text-slate-500">{h.kural}</div>
          </div>
          <span className="text-[15px] font-bold tabular-nums">{h.sayi.toLocaleString('tr-TR')}</span>
        </div>
      ))}
    </Bolum>
  )
}

/** 41 — huni. */
export function HuniBlogu() {
  const { veri } = useVeri()
  const huni = veri.huni
  const enBuyuk = huni[0].sayi
  return (
    <Bolum no={41} baslik="Dönüşüm hunisi" aciklama="Adım adım kaç kişi kaldı">
      <div className="space-y-2">
        {huni.map((h, i) => {
          const oncekiSayi = i === 0 ? h.sayi : huni[i - 1].sayi
          const kayip = i === 0 ? 0 : Math.round(((oncekiSayi - h.sayi) / oncekiSayi) * 100)
          return (
            <div key={h.adim}>
              <div className="mb-1 flex items-center justify-between text-[13px]">
                <span>{h.adim}</span>
                <span className="flex items-center gap-2">
                  <b className="tabular-nums">{h.sayi.toLocaleString('tr-TR')}</b>
                  {i > 0 && <span className="text-xs text-red-600">−%{kayip}</span>}
                </span>
              </div>
              <div className="h-7 overflow-hidden rounded-md bg-slate-100">
                <div
                  className="h-full rounded-md bg-gradient-to-r from-brand to-brand/70"
                  style={{ width: `${(h.sayi / enBuyuk) * 100}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Girenlerin <b>%{((huni[huni.length - 1].sayi / huni[0].sayi) * 100).toFixed(1).replace('.', ',')}</b>'i
        form gönderdi.
      </p>
    </Bolum>
  )
}

/** 42, 43 — dış link tıklamaları ve dosya indirmeleri. */
export function DisLinkIndirmeBlogu() {
  const { veri } = useVeri()
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Bolum no={42} baslik="Dış link tıklamaları" aciklama="Siteden başka yere çıkan tıklamalar">
        <Tablo
          sutunlar={[
            { anahtar: 'hedef', baslik: 'Hedef' },
            { anahtar: 'sayi', baslik: 'Tıklama', sayisal: true, genislik: '90px' },
          ]}
          satirlar={veri.disLinkler}
          varsayilanSira="sayi"
        />
      </Bolum>
      <Bolum no={43} baslik="Dosya indirmeleri" aciklama="PDF ve benzeri dosyalar">
        <Tablo
          sutunlar={[
            { anahtar: 'dosya', baslik: 'Dosya' },
            { anahtar: 'sayi', baslik: 'İndirme', sayisal: true, genislik: '90px' },
          ]}
          satirlar={veri.indirmeler}
          varsayilanSira="sayi"
        />
      </Bolum>
    </div>
  )
}
