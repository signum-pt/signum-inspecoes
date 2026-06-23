'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import {
  LayoutDashboard,
  Store,
  ClipboardList,
  FileText,
  Calendar,
  Users,
  MapPin,
  Building2,
  Database,
  Settings,
  LogOut,
  Plug,
} from 'lucide-react'

interface SidebarProps {
  profile: Profile | null
}

const navItems = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard, roles: ['admin', 'tecnico', 'escritorio'] },
  { href: '/dashboard/entidades', label: 'Lojas', icon: Store, roles: ['admin', 'tecnico', 'escritorio'] },
  { href: '/dashboard/visitas', label: 'Relatórios', icon: ClipboardList, roles: ['admin', 'tecnico', 'escritorio'] },
  { href: '/dashboard/campos', label: 'Campos globais', icon: Database, roles: ['admin'] },
  { href: '/dashboard/secoes', label: 'Secções globais', icon: Building2, roles: ['admin'] },
  { href: '/dashboard/templates', label: 'Templates', icon: FileText, roles: ['admin'] },
  { href: '/dashboard/calendario', label: 'Calendário', icon: Calendar, roles: ['admin', 'tecnico', 'escritorio'] },
  { href: '/dashboard/equipa', label: 'Equipa', icon: MapPin, roles: ['admin', 'escritorio'] },
  { href: '/dashboard/utilizadores', label: 'Utilizadores', icon: Users, roles: ['admin'] },
  { href: '/dashboard/configuracoes', label: 'Configurações', icon: Settings, roles: ['admin'] },
  { href: '/dashboard/nextbitt', label: 'Nextbitt', icon: Plug, roles: ['admin'] },
]

const roleLabel: Record<string, string> = {
  admin: 'Administrador',
  tecnico: 'Técnico',
  escritorio: 'Escritório',
}

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const visibleItems = navItems.filter(
    (item) => !profile?.role || item.roles.includes(profile.role)
  )

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#D41317' }}>
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
              <path
                d="M17 5H7a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h8a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H6"
                stroke="white" strokeWidth="2.2" strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none" style={{ color: '#D41317' }}>Signum</p>
            <p className="text-xs text-gray-400 mt-0.5">Energia + segurança</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              style={isActive ? { backgroundColor: '#D41317' } : {}}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Utilizador */}
      <div className="px-3 py-4 border-t border-gray-100">
        <Link href="/dashboard/perfil"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors mb-1 group">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: '#D41317' }}>
            {(profile?.nome ?? 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-gray-900">{profile?.nome || 'Utilizador'}</p>
            <p className="text-xs text-gray-400 truncate">{profile?.role ? roleLabel[profile.role] : ''}</p>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Terminar sessão
        </button>
      </div>
    </aside>
  )
}
