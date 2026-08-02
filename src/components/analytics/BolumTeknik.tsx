import { useState } from 'react'
import { ChevronDown, ShieldCheck, Trash2, TriangleAlert } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { imhaGecmisi, saklamaSureleri, type AramaSatiri } from '@/lib/mock'
import { useVeri } from '@/lib/veri'
import { Bolum, CizgiGrafik, Ipucu, Rozet, Tablo, type Sutun } from './parts'

const durumRenk = {
  iyi: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  orta: 'text-amber-600 bg-amber-50 border-amber-200',
  kotu: 'text-red-600 bg-red-50 border-red-200',
}

/** 44 — Core Web Vitals kartları. */
export function VitalsBlogu() {
  const { veri } = useVeri()
  return (
    <Bolum no={44} baslik="Hız ölçümleri" aciklama="Gerçek ziyaretçilerin tarayıcısından ölçüldü">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {veri.webVitals.map((v) => (
          <div key={v.kod} className={`rounded-xl border p-4 ${durumRenk[v.durum]}`}>
            <div className="mb-1 flex items-center gap-1.5">
              <span className="text-[11px] font-bold tracking-wide opacity-80">{v.kod}</span>
              <Ipucu metin={v.aciklama} />
            </div>
            <div className="text-2xl leading-none font-bold">{v.deger}</div>
            <div className="mt-1.5 text-[11px] opacity-80">{v.ad}</div>
          </div>
        ))}
      </div>
    </Bolum>
  )
}

/** 45 — hız zaman grafiği. */
export function HizZamanBlogu() {
  const { veri } = useVeri()
  return (
    <Bolum no={45} baslik="Hız zaman içinde" aciklama="Site hızlandı mı yavaşladı mı (LCP, saniye)">
      <CizgiGrafik
        yukseklik={140}
        seriler={[{ ad: 'LCP (sn)', renk: '#c30716', noktalar: veri.hizZaman.map((h) => h.lcp) }]}
      />
    </Bolum>
  )
}

/** 46 — sayfa bazında hız. */
export function SayfaHizBlogu() {
  const { veri } = useVeri()
  return (
    <Bolum no={46} baslik="Sayfa bazında hız" aciklama="Hangi sayfa yavaş">
      <Tablo
        sutunlar={[
          { anahtar: 'yol', baslik: 'Sayfa' },
          { anahtar: 'lcp', baslik: 'LCP', sayisal: true, genislik: '90px' },
          { anahtar: 'cls', baslik: 'CLS', sayisal: true, genislik: '80px' },
          {
            anahtar: 'durum',
            baslik: 'Durum',
            genislik: '90px',
            bicim: (s) => (
              <Rozet ton={s.durum === 'iyi' ? 'emerald' : s.durum === 'orta' ? 'amber' : 'red'}>
                {s.durum === 'iyi' ? 'İyi' : s.durum === 'orta' ? 'Orta' : 'Kötü'}
              </Rozet>
            ),
          },
        ]}
        satirlar={veri.sayfaHizlari}
        varsayilanSira="yol"
      />
    </Bolum>
  )
}

/** 47, 48 — Lighthouse puanları ve geçmişi. */
export function LighthouseBlogu() {
  const { veri } = useVeri()
  return (
    <Bolum
      no={[47, 48]}
      baslik="Lighthouse denetimi"
      aciklama="Laboratuvar ölçümü — belli aralıklarla site test edilir"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="grid grid-cols-2 gap-4">
          {veri.lighthouse.map((l) => {
            const renk = l.puan >= 90 ? '#10b981' : l.puan >= 50 ? '#f59e0b' : '#ef4444'
            const C = 2 * Math.PI * 26
            return (
              <div key={l.ad} className="flex items-center gap-3">
                <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#F1F3F6" strokeWidth="6" />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="none"
                    stroke={renk}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${(l.puan / 100) * C} ${C}`}
                  />
                </svg>
                <div>
                  <div className="text-xl font-bold" style={{ color: renk }}>
                    {l.puan}
                  </div>
                  <div className="text-[11px] text-slate-500">{l.ad}</div>
                </div>
              </div>
            )
          })}
        </div>
        <div>
          <div className="mb-2 text-[13px] font-medium text-slate-600">Performans puanı geçmişi</div>
          <CizgiGrafik
            yukseklik={120}
            seriler={[{ ad: 'Performans', renk: '#c30716', noktalar: veri.lighthouseGecmis.map((g) => g.puan) }]}
          />
          <div className="mt-1 flex justify-between text-[10px] text-slate-400">
            {veri.lighthouseGecmis.map((g) => (
              <span key={g.tarih}>{g.tarih}</span>
            ))}
          </div>
        </div>
      </div>
    </Bolum>
  )
}

/** 49 — JS hataları. */
export function JsHataBlogu() {
  const { veri } = useVeri()
  const [acik, setAcik] = useState<number | null>(0)
  return (
    <Bolum
      no={49}
      baslik="JS hataları"
      aciklama="Sitedeki kod sessizce arıza verdi — ziyaretçi görmez, çıkar gider"
    >
      {veri.jsHatalari.map((h, i) => (
        <div key={h.mesaj} className="border-b border-slate-100 last:border-0">
          <button
            onClick={() => setAcik(acik === i ? null : i)}
            className="flex w-full items-center gap-3 py-3 text-left"
          >
            <TriangleAlert className="h-4 w-4 shrink-0 text-red-500" />
            <span className="min-w-0 flex-1 truncate font-mono text-[12px]">{h.mesaj}</span>
            <Rozet ton="red">{h.kisi} kişi</Rozet>
            <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${acik === i ? 'rotate-180' : ''}`} />
          </button>
          {acik === i && (
            <div className="grid gap-2 pb-3 pl-7 text-[12px] text-slate-600 sm:grid-cols-2">
              <div>
                <span className="text-slate-400">Sayfa: </span>
                {h.yol}
              </div>
              <div>
                <span className="text-slate-400">Dosya: </span>
                <span className="font-mono">{h.dosya}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </Bolum>
  )
}

const aramaSutunlari: Sutun<AramaSatiri>[] = [
  { anahtar: 'kelime', baslik: 'Arama kelimesi' },
  { anahtar: 'tiklama', baslik: 'Tıklama', sayisal: true, genislik: '85px' },
  { anahtar: 'gosterim', baslik: 'Gösterim', sayisal: true, genislik: '90px' },
  {
    anahtar: 'ctr',
    baslik: 'CTR',
    sayisal: true,
    genislik: '70px',
    bicim: (s) => `%${s.ctr.toFixed(1).replace('.', ',')}`,
  },
  {
    anahtar: 'sira',
    baslik: 'Sıra',
    sayisal: true,
    genislik: '70px',
    bicim: (s) => s.sira.toFixed(1).replace('.', ','),
  },
  {
    anahtar: 'degisim',
    baslik: 'Değişim',
    sayisal: true,
    genislik: '90px',
    bicim: (s) => (
      <span className={s.degisim >= 0 ? 'text-emerald-600' : 'text-red-600'}>
        {s.degisim >= 0 ? '▲' : '▼'} {Math.abs(s.degisim).toFixed(1).replace('.', ',')}
      </span>
    ),
  },
]

/** 50,51,52 — arama kelimeleri (Search Console + Bing). */
export function AramaBlogu() {
  const { veri } = useVeri()
  return (
    <Bolum
      no={[50, 51, 52]}
      baslik="Arama kelimeleri"
      aciklama="Google Search Console + Bing Webmaster'dan — ikisi de bedava"
    >
      <Tablo sutunlar={aramaSutunlari} satirlar={veri.aramaKelimeleri} varsayilanSira="tiklama" />
    </Bolum>
  )
}

/** 53, 54 — index durumu + motor karşılaştırma. */
export function SeoDurumBlogu() {
  const { veri } = useVeri()
  const tonlar: Record<string, 'emerald' | 'amber' | 'slate' | 'red'> = {
    emerald: 'emerald',
    amber: 'amber',
    slate: 'slate',
    red: 'red',
  }
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Bolum no={53} baslik="Dizin durumu" aciklama="Sayfalar Google'a kayıtlı mı">
        {veri.indexDurumu.map((d) => (
          <div key={d.durum} className="flex items-center gap-3 border-b border-slate-100 py-2.5 last:border-0">
            <Rozet ton={tonlar[d.renk]}>●</Rozet>
            <span className="flex-1 text-[13px]">{d.durum}</span>
            <span className="font-bold tabular-nums">{d.sayi}</span>
          </div>
        ))}
      </Bolum>

      <Bolum no={54} baslik="Google ve Bing" aciklama="İki arama motoru yan yana">
        {veri.motorKarsilastirma.map((m) => (
          <div key={m.motor} className="border-b border-slate-100 py-3 last:border-0">
            <div className="mb-1.5 flex items-center justify-between text-[13px]">
              <span className="font-medium">{m.motor}</span>
              <span className="text-slate-500">
                CTR %{m.ctr.toFixed(1).replace('.', ',')}
              </span>
            </div>
            <div className="flex gap-4 text-xs text-slate-600">
              <span>
                Tıklama <b className="tabular-nums">{m.tiklama.toLocaleString('tr-TR')}</b>
              </span>
              <span>
                Gösterim <b className="tabular-nums">{m.gosterim.toLocaleString('tr-TR')}</b>
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <i
                className="block h-full bg-brand/75"
                style={{ width: `${(m.tiklama / veri.motorKarsilastirma[0].tiklama) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </Bolum>
    </div>
  )
}

/** 55, 58 — çerez onayı sayacı + bot filtresi. */
export function GizlilikSayaclari() {
  const { veri } = useVeri()
  const onayDurumu = veri.onayDurumu
  const botFiltresi = veri.botFiltresi
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Bolum
        no={55}
        baslik="Çerez onayı"
        aciklama="Kaç kişi kabul etti, kaç kişi reddetti (kimlik yok, sadece sayaç)"
      >
        <div className="mb-4 flex items-end gap-6">
          <div>
            <div className="text-[28px] leading-none font-bold text-emerald-600">
              {onayDurumu.kabul.toLocaleString('tr-TR')}
            </div>
            <div className="mt-1 text-xs text-slate-500">Kabul (%{onayDurumu.kabulYuzde})</div>
          </div>
          <div>
            <div className="text-[28px] leading-none font-bold text-slate-400">
              {onayDurumu.ret.toLocaleString('tr-TR')}
            </div>
            <div className="mt-1 text-xs text-slate-500">Ret (%{100 - onayDurumu.kabulYuzde})</div>
          </div>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full">
          <i className="block bg-emerald-500" style={{ width: `${onayDurumu.kabulYuzde}%` }} />
          <i className="block flex-1 bg-slate-300" />
        </div>
        <p className="mt-3 text-[11px] text-slate-500">
          Reddedenler de anonim olarak sayılır: sayfa, süre, kaynak, şehir ve ısı haritası verileri
          yine toplanır. Sadece kalıcı takip yapılmaz.
        </p>
      </Bolum>

      <Bolum no={58} baslik="Bot filtresi" aciklama="Robot trafiği ayrıldı, raporları şişirmiyor">
        <div className="mb-4 flex items-end gap-6">
          <div>
            <div className="text-[28px] leading-none font-bold">
              {botFiltresi.insan.toLocaleString('tr-TR')}
            </div>
            <div className="mt-1 text-xs text-slate-500">Gerçek ziyaretçi</div>
          </div>
          <div>
            <div className="text-[28px] leading-none font-bold text-slate-400">
              {botFiltresi.bot.toLocaleString('tr-TR')}
            </div>
            <div className="mt-1 text-xs text-slate-500">Bot (%{botFiltresi.botYuzde}) — elendi</div>
          </div>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full">
          <i className="block bg-brand" style={{ width: `${100 - botFiltresi.botYuzde}%` }} />
          <i className="block flex-1 bg-slate-300" />
        </div>
      </Bolum>
    </div>
  )
}

/** 56, 57 — veri saklama paneli + imha geçmişi (KVKK). */
export function ImhaBlogu() {
  return (
    <Card className="gap-0 py-0">
      <div className="flex items-start gap-2 border-b border-slate-200 px-5 py-3.5">
        <span className="mt-0.5">
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-[15px] font-semibold">
            <ShieldCheck className="h-4 w-4 text-brand" />
            Veri saklama ve imha
          </div>
          <div className="mt-0.5 text-xs text-slate-500">
            KVKK gereği süresi dolan veri imha edilir. Sistem uyarır, 10 gün ek süre verir, sonra
            otomatik siler.
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-5 space-y-2">
          {saklamaSureleri.map((s) => (
            <div
              key={s.veri}
              className={`flex flex-wrap items-center gap-3 rounded-lg border px-3.5 py-2.5 ${
                s.durum === 'kritik'
                  ? 'border-red-200 bg-red-50'
                  : s.durum === 'uyari'
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-slate-200'
              }`}
            >
              {s.durum !== 'normal' && (
                <TriangleAlert
                  className={`h-4 w-4 shrink-0 ${s.durum === 'kritik' ? 'text-red-500' : 'text-amber-500'}`}
                />
              )}
              <span className="min-w-0 flex-1 text-[13px] font-medium">{s.veri}</span>
              <span className="text-xs text-slate-500">Saklama: {s.sure}</span>
              {s.kalanGun >= 0 ? (
                <Rozet ton={s.durum === 'kritik' ? 'red' : s.durum === 'uyari' ? 'amber' : 'slate'}>
                  {s.kalanGun} gün kaldı
                </Rozet>
              ) : (
                <Rozet ton="emerald">Anonim — süresiz</Rozet>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-slate-50 px-3.5 py-3 text-[12px] text-slate-600">
          <b>Nasıl çalışıyor:</b> Süre dolmadan sistem uyarır. Sorumluluk kullanıcıdadır (kullanıcı
          sözleşmesinde yazar). Süre dolunca <b>10 gün ek hak</b> verilir. Sonra sistem otomatik imha
          eder. İmhadan önce anonimleştirme algoritması çalışır: tek tek kayıtlar silinir, anonim
          özet kalır.
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold">
            <Trash2 className="h-4 w-4 text-slate-400" />
            İmha geçmişi
          </div>
          <Tablo
            sutunlar={[
              { anahtar: 'tarih', baslik: 'Tarih', genislik: '110px' },
              { anahtar: 'veri', baslik: 'Veri' },
              {
                anahtar: 'adet',
                baslik: 'Kayıt',
                sayisal: true,
                genislik: '110px',
                bicim: (s) => s.adet.toLocaleString('tr-TR'),
              },
              { anahtar: 'yontem', baslik: 'Yöntem', genislik: '200px' },
            ]}
            satirlar={imhaGecmisi}
            varsayilanSira="tarih"
          />
        </div>
      </div>
    </Card>
  )
}
