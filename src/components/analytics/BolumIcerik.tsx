import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useVeri } from '@/lib/veri'
import type { SayfaSatiri } from '@/lib/mock'
import { Bolum, CubukListe, Halka, Rozet, Tablo, type Sutun } from './parts'

const sayfaSutunlari: Sutun<SayfaSatiri>[] = [
  { anahtar: 'yol', baslik: 'Sayfa' },
  { anahtar: 'goruntuleme', baslik: 'Görüntüleme', sayisal: true, genislik: '120px' },
  { anahtar: 'ortSure', baslik: 'Ort. süre', sayisal: true, genislik: '90px' },
  {
    anahtar: 'cikisOrani',
    baslik: 'Çıkış oranı',
    sayisal: true,
    genislik: '100px',
    bicim: (s) => (
      <span className={s.cikisOrani > 60 ? 'font-semibold text-red-600' : ''}>%{s.cikisOrani}</span>
    ),
  },
]

/** 11,12,13,15 — sayfa listeleri (sekmeli). */
export function SayfalarBlogu() {
  const { veri } = useVeri()
  const [sekme, setSekme] = useState<'tum' | 'giris' | 'cikis'>('tum')

  const veriler = {
    tum: veri.enCokGezilen,
    giris: veri.girisSayfalari,
    cikis: veri.cikisSayfalari,
  }
  const no = sekme === 'tum' ? [11, 15] : sekme === 'giris' ? 12 : 13

  return (
    <Bolum
      no={no}
      baslik="Sayfalar"
      aciklama="Başlığa tıklayarak sıralayabilirsin"
      sag={
        <div className="flex shrink-0 gap-1 rounded-lg border p-0.5">
          {[
            { k: 'tum' as const, e: 'En çok gezilen' },
            { k: 'giris' as const, e: 'Giriş' },
            { k: 'cikis' as const, e: 'Çıkış' },
          ].map((s) => (
            <Button
              key={s.k}
              size="sm"
              variant={sekme === s.k ? 'default' : 'ghost'}
              onClick={() => setSekme(s.k)}
              className="h-7 px-2.5 text-xs"
            >
              {s.e}
            </Button>
          ))}
        </div>
      }
    >
      <Tablo sutunlar={sayfaSutunlari} satirlar={veriler[sekme]} varsayilanSira="goruntuleme" />
    </Bolum>
  )
}

/** 14 — gezinti yolu. */
export function GezintiYolu() {
  const { veri } = useVeri()
  return (
    <Bolum no={14} baslik="Gezinti yolu" aciklama="Bir ziyarette hangi sayfalar sırayla gezildi">
      <div className="space-y-3">
        {veri.gezintiYollari.map((g, i) => (
          <div key={i} className="flex items-center gap-2">
            {/* Sayı sabit kalır */}
            <span className="w-12 shrink-0 text-[13px] font-semibold tabular-nums">{g.sayi}</span>
            {/* Yol sığmazsa alt satıra kırılmaz, yatay kayar */}
            <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
              {g.adimlar.map((a, j) => (
                <span key={j} className="flex shrink-0 items-center gap-1.5">
                  <span className="rounded-md bg-muted px-2 py-1 text-[12px] whitespace-nowrap text-foreground/80">
                    {a}
                  </span>
                  {j < g.adimlar.length - 1 && (
                    <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                  )}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Bolum>
  )
}

/** 16 — 404 hataları. */
export function Hata404Blogu() {
  const { veri } = useVeri()
  return (
    <Bolum no={16} baslik="404 hataları" aciklama="Olmayan sayfaya girmeye çalışanlar — kırık link demek">
      <Tablo
        sutunlar={[
          { anahtar: 'yol', baslik: 'Adres' },
          { anahtar: 'kaynak', baslik: 'Nereden', genislik: '110px' },
          { anahtar: 'sayi', baslik: 'Deneme', sayisal: true, genislik: '90px' },
        ]}
        satirlar={veri.hata404}
        varsayilanSira="sayi"
      />
    </Bolum>
  )
}

/** 17,20 — trafik kaynakları + dağılım. */
export function KaynaklarBlogu() {
  const { veri } = useVeri()

  const turToplami = veri.trafikKaynaklari.reduce<Record<string, number>>((acc, k) => {
    acc[k.tur] = (acc[k.tur] ?? 0) + k.yuzde
    return acc
  }, {})
  const dilimler = Object.entries(turToplami)
    .map(([ad, yuzde]) => ({ ad, yuzde }))
    .sort((a, b) => b.yuzde - a.yuzde)

  return (
    <Bolum no={[17, 20]} baslik="Trafik kaynakları" aciklama="Ziyaretçiler siteye nereden geldi">
      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <CubukListe
          satirlar={veri.trafikKaynaklari.map((k) => ({
            ad: k.ad,
            sayi: k.sayi,
            yuzde: k.yuzde,
            ek: k.tur,
          }))}
        />
        <Halka dilimler={dilimler} />
      </div>
    </Bolum>
  )
}

/** 18 — yönlendiren siteler. */
export function YonlendirenSiteler() {
  const { veri } = useVeri()
  return (
    <Bolum no={18} baslik="Yönlendiren siteler" aciklama="Hangi siteler bize link vermiş">
      <Tablo
        sutunlar={[
          { anahtar: 'site', baslik: 'Site' },
          { anahtar: 'sayi', baslik: 'Ziyaretçi', sayisal: true, genislik: '100px' },
        ]}
        satirlar={veri.yonlendirenSiteler}
        varsayilanSira="sayi"
      />
    </Bolum>
  )
}

/** 19 — UTM reklam kampanyaları. */
export function UtmBlogu() {
  const { veri } = useVeri()
  return (
    <Bolum no={19} baslik="Reklam kampanyaları (UTM)" aciklama="Reklam linklerine göre ayrı sayım">
      <Tablo
        sutunlar={[
          { anahtar: 'kampanya', baslik: 'Kampanya' },
          { anahtar: 'kaynak', baslik: 'Kaynak', genislik: '110px' },
          { anahtar: 'ziyaret', baslik: 'Ziyaret', sayisal: true, genislik: '90px' },
          {
            anahtar: 'donusum',
            baslik: 'Dönüşüm',
            sayisal: true,
            genislik: '90px',
            bicim: (s) => <span className="font-semibold text-brand">{s.donusum}</span>,
          },
        ]}
        satirlar={veri.utmKampanyalari}
        varsayilanSira="ziyaret"
      />
    </Bolum>
  )
}

/** 25,26,27,28 — cihaz, tarayıcı, işletim sistemi, ekran, dil (sekmeli). */
export function CihazBlogu() {
  const { veri } = useVeri()
  const [sekme, setSekme] = useState(0)

  const sekmeler = [
    { ad: 'Cihaz', no: 25, veri: veri.cihazTuru, halka: true },
    { ad: 'Tarayıcı', no: 26, veri: veri.tarayicilar, halka: false },
    { ad: 'İşletim sistemi', no: 26, veri: veri.isletimSistemleri, halka: false },
    { ad: 'Ekran ölçüsü', no: 27, veri: veri.ekranOlculeri, halka: false },
    { ad: 'Dil', no: 28, veri: veri.diller, halka: false },
  ]
  const aktif = sekmeler[sekme]

  return (
    <Bolum
      no={aktif.no}
      baslik="Cihaz ve teknik"
      aciklama={`${aktif.ad} dağılımı`}
      sag={
        <div className="flex shrink-0 flex-wrap gap-1 rounded-lg border p-0.5">
          {sekmeler.map((s, i) => (
            <Button
              key={s.ad}
              size="sm"
              variant={sekme === i ? 'default' : 'ghost'}
              onClick={() => setSekme(i)}
              className="h-7 px-2.5 text-xs"
            >
              {s.ad}
            </Button>
          ))}
        </div>
      }
    >
      {aktif.halka ? (
        <Halka dilimler={aktif.veri.map((d) => ({ ad: d.ad, yuzde: d.yuzde }))} />
      ) : (
        <CubukListe satirlar={aktif.veri.map((d) => ({ ad: d.ad, sayi: d.sayi, yuzde: d.yuzde }))} />
      )}
    </Bolum>
  )
}

/** 29 — bağlantı türü. */
export function BaglantiBlogu() {
  const { veri } = useVeri()
  const yavas = veri.baglantiTurleri.find((b) => b.ad.includes('3G'))

  return (
    <Bolum
      no={29}
      baslik="Bağlantı türü"
      aciklama="Ziyaretçiler hangi hızla bağlanıyor — site optimizasyonu için önemli"
    >
      <div className="space-y-3">
        {veri.baglantiTurleri.map((b) => (
          <div key={b.ad} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-[13px] font-medium">{b.ad}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <i className="block h-full rounded-full bg-brand/75" style={{ width: `${b.yuzde}%` }} />
            </div>
            <span className="w-12 text-right text-[13px] font-semibold tabular-nums">%{b.yuzde}</span>
            <span className="w-20 text-right text-xs text-slate-500">{b.ortHiz}</span>
          </div>
        ))}
      </div>
      {yavas && (
        <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <Rozet ton="amber">Dikkat</Rozet>
          Ziyaretçilerin %{yavas.yuzde}'i yavaş bağlantıda ({yavas.sayi.toLocaleString('tr-TR')} kişi).
          Ağır görseller bu kesimi kaybettiriyor olabilir.
        </p>
      )}
    </Bolum>
  )
}
