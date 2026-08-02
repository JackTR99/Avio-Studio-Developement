import { useState } from 'react'
import { Link2, Plus, Search, UserPlus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { baglantilar, kullanicilar, uyarilar } from '@/lib/mock'
import { Bolum, Rozet } from '@/components/analytics/parts'
import { ImhaBlogu } from '@/components/analytics/BolumTeknik'

export default function Ayarlar() {
  const [uyariListesi, setUyariListesi] = useState(uyarilar)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 pt-5 pb-16 sm:px-6 sm:pt-6 sm:pb-20">
      {/* 66 — arama motoru bağlantıları */}
      <Bolum
        no={66}
        baslik="Arama motoru bağlantısı"
        aciklama="Google Search Console ve Bing Webmaster — ikisi de bedava"
      >
        {baglantilar.map((b) => (
          <div key={b.servis} className="flex flex-wrap items-center gap-3 border-b border-slate-100 py-3 last:border-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <Search className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-medium">{b.servis}</div>
              <div className="truncate text-xs text-slate-500">{b.hesap}</div>
            </div>
            {b.durum === 'bagli' ? (
              <Rozet ton="emerald">Bağlı</Rozet>
            ) : (
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark">
                <Link2 className="h-3.5 w-3.5" />
                Bağla
              </button>
            )}
          </div>
        ))}
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[11.5px] text-slate-600">
          Bu iki servis ücretsizdir, sadece günlük istek sınırı vardır. Paralı olan
          Google Custom Search ve Bing Search (Azure) <b>kullanılmaz</b> — isimleri benzer ama
          tamamen farklı iştir.
        </p>
      </Bolum>

      {/* 65 — kullanıcılar */}
      <Bolum
        no={65}
        baslik="Kullanıcılar"
        aciklama="Panele kim girebilir"
        sag={
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300">
            <UserPlus className="h-3.5 w-3.5" />
            Kullanıcı ekle
          </button>
        }
      >
        {kullanicilar.map((k) => (
          <div key={k.email} className="flex flex-wrap items-center gap-3 border-b border-slate-100 py-3 last:border-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand text-[11px] font-bold text-brand">
              {k.email[0].toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px]">{k.email}</span>
            <Rozet ton={k.rol === 'Yönetici' ? 'brand' : 'slate'}>{k.rol}</Rozet>
            <span className="text-xs text-slate-500">{k.sonGiris}</span>
          </div>
        ))}
      </Bolum>

      {/* 67 — uyarı ayarları */}
      <Bolum
        no={67}
        baslik="Bildirimler"
        aciklama="Ne olduğunda haber verilsin"
        sag={
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300">
            <Plus className="h-3.5 w-3.5" />
            Yeni kural
          </button>
        }
      >
        {uyariListesi.map((u, i) => (
          <div key={u.ad} className="flex items-center gap-3 border-b py-3 last:border-0">
            <Switch
              checked={u.acik}
              onCheckedChange={() =>
                setUyariListesi((l) => l.map((x, j) => (j === i ? { ...x, acik: !x.acik } : x)))
              }
              className="data-[state=checked]:bg-brand"
            />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium">{u.ad}</div>
              <div className="truncate text-xs text-slate-500">{u.aciklama}</div>
            </div>
          </div>
        ))}
      </Bolum>

      {/* 56, 57 — veri saklama ve imha (KVKK) */}
      <ImhaBlogu />

      {/* Takip kodu hatırlatma */}
      <Card className="gap-0 px-5 py-4">
        <div className="flex items-center gap-2 text-[13px] text-slate-600">
          Takip kodları <b className="mx-1">Siteler</b> sayfasında, her sitenin altında duruyor.
        </div>
      </Card>
    </div>
  )
}
