import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, PlugZap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BOLUMLER, useSecim, type BolumAdi } from '@/lib/secim'
import { useVeri } from '@/lib/veri'
import SiteSecici from '@/components/SiteSecici'
import BolumOzet from '@/components/analytics/BolumOzet'
import { TarihSecici } from '@/components/analytics/parts'
import {
  CanliSayac,
  KonumBlogu,
  ZamanGrafigi,
  ZiyaretciBlogu,
} from '@/components/analytics/BolumZiyaretci'
import {
  BaglantiBlogu,
  CihazBlogu,
  GezintiYolu,
  Hata404Blogu,
  KaynaklarBlogu,
  SayfalarBlogu,
  UtmBlogu,
  YonlendirenSiteler,
} from '@/components/analytics/BolumIcerik'
import {
  DisLinkIndirmeBlogu,
  HedeflerBlogu,
  HuniBlogu,
  HusranBlogu,
  IsiHaritasiBlogu,
  OlaylarBlogu,
  ReplayBlogu,
} from '@/components/analytics/BolumDavranis'
import {
  AramaBlogu,
  GizlilikSayaclari,
  HizZamanBlogu,
  ImhaBlogu,
  JsHataBlogu,
  LighthouseBlogu,
  SayfaHizBlogu,
  SeoDurumBlogu,
  VitalsBlogu,
} from '@/components/analytics/BolumTeknik'

/** İçeriğin kaydırıldığı kapsayıcıyı en üste alır (AppShell'deki main). */
function basaKaydir() {
  const kap = document.querySelector<HTMLElement>('[data-kaydirma-alani]')
  kap?.scrollTo({ top: 0, behavior: 'smooth' })
}

export default function Analytics() {
  const [bolum, setBolum] = useState<BolumAdi>(BOLUMLER[0])
  const { istenenBolum, setIstenenBolum } = useSecim()
  const { site } = useVeri()

  function bolumDegistir(yeni: string) {
    setBolum(yeni as BolumAdi)
    basaKaydir()
  }

  // Genel Özet'teki kartlardan "şu bölüme git" denince sekmeyi değiştir + başa dön.
  useEffect(() => {
    if (istenenBolum !== null) {
      setBolum(istenenBolum)
      setIstenenBolum(null)
      basaKaydir()
    }
  }, [istenenBolum, setIstenenBolum])

  const beklemede = site.durum === 'beklemede'

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
      {/* Site seçici + tarih aralığı */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <SiteSecici />
        <TarihSecici />
      </div>

      {beklemede ? (
        <Card className="items-center gap-0 border-dashed px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-500">
            <PlugZap className="h-7 w-7" />
          </span>
          <h2 className="mt-5 text-lg font-semibold">Henüz veri yok</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            <b>{site.alan}</b> için takip kodu siteye eklenmemiş. Kod eklendikten sonra veriler
            birkaç dakika içinde buraya akmaya başlar.
          </p>
          <Button asChild className="mt-5">
            <Link to="/siteler">
              Takip kodunu al
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Card>
      ) : (
        <Tabs value={bolum} onValueChange={bolumDegistir}>
          <div className="no-scrollbar -mx-4 mb-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <TabsList className="h-auto w-max gap-1 rounded-none border-b bg-transparent p-0">
              {BOLUMLER.map((b) => (
                <TabsTrigger
                  key={b}
                  value={b}
                  className="rounded-none border-0 border-b-2 border-transparent px-3.5 py-2.5 text-[13px] font-medium text-muted-foreground shadow-none data-[state=active]:border-brand data-[state=active]:bg-transparent data-[state=active]:text-brand data-[state=active]:shadow-none"
                >
                  {b}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="Genel Özet">
            <BolumOzet />
          </TabsContent>

          <TabsContent value="Ziyaretçiler" className="space-y-5">
            <ZiyaretciBlogu />
            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
              <ZamanGrafigi />
              <CanliSayac />
            </div>
          </TabsContent>

          <TabsContent value="Konum">
            <KonumBlogu />
          </TabsContent>

          <TabsContent value="Sayfalar" className="space-y-5">
            <SayfalarBlogu />
            <GezintiYolu />
            <Hata404Blogu />
          </TabsContent>

          <TabsContent value="Kaynaklar" className="space-y-5">
            <KaynaklarBlogu />
            <div className="grid gap-5 lg:grid-cols-2">
              <YonlendirenSiteler />
              <UtmBlogu />
            </div>
          </TabsContent>

          <TabsContent value="Cihaz" className="space-y-5">
            <CihazBlogu />
            <BaglantiBlogu />
          </TabsContent>

          <TabsContent value="Isı Haritası" className="space-y-5">
            <IsiHaritasiBlogu />
            <HusranBlogu />
          </TabsContent>

          <TabsContent value="Kayıtlar">
            <ReplayBlogu />
          </TabsContent>

          <TabsContent value="Dönüşüm" className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <OlaylarBlogu />
              <HuniBlogu />
            </div>
            <HedeflerBlogu />
            <DisLinkIndirmeBlogu />
          </TabsContent>

          <TabsContent value="Hız" className="space-y-5">
            <VitalsBlogu />
            <div className="grid gap-5 lg:grid-cols-2">
              <HizZamanBlogu />
              <SayfaHizBlogu />
            </div>
            <LighthouseBlogu />
            <JsHataBlogu />
          </TabsContent>

          <TabsContent value="SEO" className="space-y-5">
            <AramaBlogu />
            <SeoDurumBlogu />
          </TabsContent>

          <TabsContent value="Gizlilik" className="space-y-5">
            <GizlilikSayaclari />
            <ImhaBlogu />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
