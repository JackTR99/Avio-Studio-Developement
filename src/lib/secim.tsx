import { createContext, useContext, useState, type ReactNode } from 'react'

/** Analytics sekmelerinin tek doğru listesi. Sıra buradan okunur. */
export const BOLUMLER = [
  'Genel Özet',
  'Ziyaretçiler',
  'Konum',
  'Sayfalar',
  'Kaynaklar',
  'Cihaz',
  'Isı Haritası',
  'Kayıtlar',
  'Dönüşüm',
  'Hız',
  'SEO',
  'Gizlilik',
] as const

export type BolumAdi = (typeof BOLUMLER)[number]

/**
 * Bölümler arası yönlendirme.
 * Genel Özet'teki kartlar "şu bölüme git" dediğinde Analytics sayfası bunu okur.
 * NUMARA DEĞİL İSİM kullanılır — sekme sırası değişince yanlış yere gitmesin diye.
 */
type SecimDurumu = {
  istenenBolum: BolumAdi | null
  setIstenenBolum: (b: BolumAdi | null) => void
}

const SecimContext = createContext<SecimDurumu>({
  istenenBolum: null,
  setIstenenBolum: () => {},
})

export function SecimProvider({ children }: { children: ReactNode }) {
  const [istenenBolum, setIstenenBolum] = useState<BolumAdi | null>(null)
  return (
    <SecimContext.Provider value={{ istenenBolum, setIstenenBolum }}>
      {children}
    </SecimContext.Provider>
  )
}

export function useSecim() {
  return useContext(SecimContext)
}
