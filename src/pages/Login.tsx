import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, Loader2, TriangleAlert } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import wordmark from '../assets/avio-wordmark.png'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]
const SQUISH: [number, number, number, number] = [0.34, 1.42, 0.5, 1]
const EMAIL_PH = 'ornek@avio.com'
const PW_PH = '••••••••'

const inputCls =
  'w-full rounded-lg border border-transparent bg-white px-3.5 py-2.5 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:ring-2 focus:ring-white/70'

/** Giriş'e basınca kutu üzerinden ortadan sola-sağa geçen kırmızı süpürme. */
function Sweep({ on }: { on: boolean }) {
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 rounded-lg bg-brand"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: on ? 1 : 0 }}
      transition={{ duration: 0.45, ease: EASE }}
    />
  )
}

export default function Login() {
  const { session, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [inverting, setInverting] = useState(false)
  const [emailPh, setEmailPh] = useState('')
  const [pwPh, setPwPh] = useState('')

  // Daktilo: kutular oluştuktan sonra örnek metinler soldan sağa yazılır
  useEffect(() => {
    if (!showForm) return
    const timers: number[] = []
    timers.push(
      window.setTimeout(() => {
        for (let i = 1; i <= EMAIL_PH.length; i++) {
          timers.push(window.setTimeout(() => setEmailPh(EMAIL_PH.slice(0, i)), i * 55))
        }
        const after = EMAIL_PH.length * 55 + 150
        for (let i = 1; i <= PW_PH.length; i++) {
          timers.push(window.setTimeout(() => setPwPh(PW_PH.slice(0, i)), after + i * 55))
        }
      }, 850),
    )
    return () => timers.forEach((t) => clearTimeout(t))
  }, [showForm])

  // Zaten giriş yaptıysa uygulamaya gönder
  if (!authLoading && session) {
    const to = (location.state as { from?: string } | null)?.from ?? '/'
    return <Navigate to={to} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    setInverting(true) // kırmızı süpürme başlasın

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setSubmitting(false)
      setInverting(false) // süpürme geri çekilsin
      setError('E-posta veya şifre hatalı.')
      return
    }

    // Başarılı: süpürme tamamlanınca uygulamaya geç
    window.setTimeout(() => navigate('/', { replace: true }), 350)
  }

  return (
    <div className="min-h-dvh flex flex-col items-center overflow-hidden bg-brand px-4 pt-[30vh] pb-12">
      <div className="w-full max-w-sm">
        {/* Lockup — ortadan açılır: logo sola, Studio sağa */}
        <div className="flex items-center justify-center gap-3">
          <motion.img
            src={wordmark}
            alt="AVIO"
            className="h-8"
            initial={{ x: 34, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE }}
          />
          <motion.span
            className="h-7 w-px bg-white/40"
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ delay: 0.35, duration: 0.4, ease: EASE }}
          />
          <motion.span
            className="font-logo text-2xl font-semibold tracking-tight text-white"
            initial={{ x: -34, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            Studio
          </motion.span>
        </div>

        {!showForm ? (
          <motion.button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-brand shadow-sm transition-colors hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/60"
            initial={{ x: -90, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.6, ease: EASE }}
          >
            Giriş yapmak için tıklayın
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {/* E-POSTA */}
            <div>
              <motion.label
                htmlFor="email"
                className="mb-1.5 block font-logo text-sm font-bold text-white"
                initial={{ y: 18, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.45, ease: EASE }}
              >
                E-posta
              </motion.label>
              <div className="relative">
                <motion.input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={emailPh}
                  className={inputCls}
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: [1, 0.45, 1] }}
                  transition={{ duration: 0.7, ease: EASE, times: [0, 0.42, 1] }}
                />
                <Sweep on={inverting} />
              </div>
            </div>

            {/* ŞİFRE — damla gibi aşağı iner */}
            <div>
              <motion.label
                htmlFor="password"
                className="mb-1.5 block font-logo text-sm font-bold text-white"
                initial={{ y: 18, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.82, duration: 0.45, ease: EASE }}
              >
                Şifre
              </motion.label>
              <div className="relative">
                <motion.input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={pwPh}
                  className={`${inputCls} pr-11`}
                  initial={{ y: -74, scaleX: 0.45, opacity: 0 }}
                  animate={{ y: 0, scaleX: 1, opacity: 1 }}
                  transition={{ delay: 0.22, duration: 0.6, ease: SQUISH }}
                />
                <motion.button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  className="absolute inset-y-0 right-0 z-20 flex items-center px-3 text-slate-400 transition-colors hover:text-slate-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.3 }}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </motion.button>
                <Sweep on={inverting} />
              </div>
            </div>

            {error && (
              <div className="flex items-center justify-center gap-2 rounded-lg bg-white px-3.5 py-2.5 text-sm font-bold text-brand shadow-sm">
                <TriangleAlert className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* GİRİŞ YAP — iner + yazı pop; basınca kırmızı süpürme */}
            <motion.button
              type="submit"
              disabled={submitting}
              className="relative flex w-full items-center justify-center overflow-hidden rounded-lg bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/60 disabled:cursor-not-allowed"
              initial={{ y: -64, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.5, ease: SQUISH }}
            >
              <Sweep on={inverting} />
              <motion.span
                className={`relative z-20 flex items-center justify-center gap-2 ${
                  inverting ? 'text-white' : 'text-brand'
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.05, type: 'spring', stiffness: 480, damping: 15 }}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? 'Giriş yapılıyor…' : 'Giriş Yap'}
              </motion.span>
            </motion.button>
          </form>
        )}
      </div>
    </div>
  )
}
