import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

/**
 * Taslak (mockup) aşamasında Supabase henüz kurulu değil.
 * Ayarlar eksikse uygulama ÇÖKMEZ — sahte verilerle ekranlar yine açılır.
 * Gerçek sisteme geçince .env doldurulur ve burası kendiliğinden gerçek bağlantıya döner.
 */
export const isSupabaseConfigured = Boolean(url && key)

if (!isSupabaseConfigured) {
  console.warn('[AVIO] Supabase ayarı yok — TASLAK MODU. Ekranlar sahte veriyle çalışıyor.')
}

// Not: .env'de "VITE_SUPABASE_URL=" yazınca değer BOŞ METİN olur, undefined olmaz.
// Bu yüzden ?? değil || kullanılıyor — yoksa createClient boş metinle çöküyor.
export const supabase: SupabaseClient = createClient(
  url || 'http://127.0.0.1:54321',
  key || 'taslak-modu-anahtar-yok',
)
