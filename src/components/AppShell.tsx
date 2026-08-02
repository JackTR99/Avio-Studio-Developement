import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  Activity,
  Bell,
  FileText,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  User,
  X,
  type LucideIcon,
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import wordmark from '../assets/avio-wordmark-red.png'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type NavItem = { to: string; label: string; end?: boolean; icon: LucideIcon }

const mainNav: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/siteler', label: 'Siteler', icon: Globe },
  { to: '/analytics', label: 'Analytics', icon: Activity },
  { to: '/raporlar', label: 'Raporlar', icon: FileText },
]

const bottomNav: NavItem[] = [{ to: '/ayarlar', label: 'Ayarlar', icon: Settings }]

const navCls = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition hover:opacity-80 ${
    isActive ? 'text-brand' : 'text-slate-600'
  }`

function NavItemLink({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <NavLink to={item.to} end={item.end} className={navCls}>
      <span className="flex w-[52px] shrink-0 items-center justify-center">
        <Icon className="h-4 w-4" />
      </span>
      {item.label}
    </NavLink>
  )
}

export default function AppShell() {
  const { session } = useAuth()
  const email = session?.user.email ?? (isSupabaseConfigured ? '' : 'taslak@avio.com')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobilAcik, setMobilAcik] = useState(false)

  async function handleLogout() {
    if (isSupabaseConfigured) await supabase.auth.signOut()
  }

  return (
    // h-dvh (h-screen değil): mobil tarayıcılarda 100vh adres çubuğunu da sayar,
    // uygulamanın altı görünen alanın dışında kalır ve en aşağıya inilemez.
    <div className="flex h-dvh flex-col bg-slate-50">
      {/* Üst bar */}
      <header className="border-b border-slate-200 bg-white">
        <div className="flex h-16 items-center justify-between gap-4 px-4">
          <div className="flex min-w-0 shrink items-center gap-3">
            {/* Mobil: menüyü aç */}
            <button
              onClick={() => setMobilAcik(true)}
              className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
              aria-label="Menüyü aç"
            >
              <Menu className="h-5 w-5" />
            </button>
            {/* Masaüstü: kapalıysa geri aç */}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="hidden rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 lg:block"
                aria-label="Menüyü aç"
              >
                <PanelLeftOpen className="h-5 w-5" />
              </button>
            )}
            <img src={wordmark} alt="AVIO" className="anim-logo h-5 shrink-0 sm:h-6" />
            <span className="anim-divider hidden h-5 w-px bg-brand/30 sm:block" />
            <span className="anim-title hidden font-logo font-semibold text-brand sm:block">
              Studio
            </span>
          </div>

          <div className="flex-1" />

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full outline-none transition-opacity hover:opacity-90">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-brand text-brand">
                <User className="h-5 w-5" />
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-64">
              <div className="flex items-center gap-3 px-2 py-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand text-brand">
                  <User className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">Hesabım</p>
                  <p className="truncate text-xs text-muted-foreground">{email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="h-4 w-4" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4" />
                Ayarlar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="h-4 w-4" />
                Bildirimler
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Çıkış
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Sidebar + içerik */}
      <div className="flex min-h-0 flex-1">
        {/* Masaüstü yan menü */}
        {sidebarOpen && (
          <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white p-3 lg:flex">
            <div className="mb-1 flex justify-end">
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Menüyü kapat"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>
            <nav className="space-y-1">
              {mainNav.map((item) => (
                <NavItemLink key={item.to} item={item} />
              ))}
            </nav>
            <nav className="mt-auto space-y-1">
              {bottomNav.map((item) => (
                <NavItemLink key={item.to} item={item} />
              ))}
            </nav>
          </aside>
        )}

        {/* Mobil çekmece */}
        {mobilAcik && (
          <>
            <div
              onClick={() => setMobilAcik(false)}
              className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
            />
            <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white p-3 lg:hidden">
              <div className="mb-2 flex items-center justify-between px-1">
                <img src={wordmark} alt="AVIO" className="h-5" />
                <button
                  onClick={() => setMobilAcik(false)}
                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100"
                  aria-label="Menüyü kapat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="space-y-1" onClick={() => setMobilAcik(false)}>
                {mainNav.map((item) => (
                  <NavItemLink key={item.to} item={item} />
                ))}
              </nav>
              <nav className="mt-auto space-y-1" onClick={() => setMobilAcik(false)}>
                {bottomNav.map((item) => (
                  <NavItemLink key={item.to} item={item} />
                ))}
              </nav>
            </aside>
          </>
        )}

        {/* overscroll-contain: iç alanın sonuna gelince kaydırma dışarı devredilmesin.
            Yoksa üstte/altta macOS'un zıplama davranışı "takılma" hissi veriyor. */}
        <main
          data-kaydirma-alani
          className="flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain"
        >
          <Outlet />
        </main>
      </div>

    </div>
  )
}
