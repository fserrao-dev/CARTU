'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, ClipboardList, Plus, Package, Calendar,
  BarChart2, Users, Menu, X, LogOut, TrendingUp, UserCog, Moon, Sun
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/auth'
import Logo from './Logo'

const NAV = [
  { href: '/dashboard',       label: 'Inicio',          icon: LayoutDashboard },
  { href: '/servicios',       label: 'Servicios',        icon: ClipboardList   },
  { href: '/servicios/nuevo', label: 'Nuevo servicio',   icon: Plus            },
  { href: '/agenda',          label: 'Agenda',           icon: Calendar        },
  { href: '/stock',           label: 'Stock',            icon: Package         },
  { href: '/finanzas',        label: 'Finanzas',         icon: TrendingUp      },
  { href: '/empleados',       label: 'Empleados',        icon: UserCog         },
  { href: '/clientes',        label: 'Contactos',        icon: Users           },
  { href: '/reportes',        label: 'Reportes',         icon: BarChart2       },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('cartu-dark')
    if (saved === 'true') { setDark(true); document.documentElement.classList.add('dark') }
  }, [])

  function toggleDark() {
    const next = !dark
    setDark(next)
    localStorage.setItem('cartu-dark', String(next))
    document.documentElement.classList.toggle('dark', next)
  }

  async function handleLogout() {
    await signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const isActive = (href: string) => {
    if (href === '/servicios') return pathname === '/servicios'
    if (href === '/servicios/nuevo') return pathname === '/servicios/nuevo'
    return pathname.startsWith(href) && href !== '/servicios/nuevo'
  }

  const navLinks = (
    <nav className="flex-1 py-2 overflow-y-auto">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} onClick={() => setOpen(false)}
          className={cn('sidebar-item',
            isActive(href)
              ? 'text-white bg-white/10 border-l-gold-200'
              : 'text-white/50 border-transparent hover:text-white/80 hover:bg-white/5'
          )}>
          <Icon size={15} />
          <span className="text-sm">{label}</span>
        </Link>
      ))}
    </nav>
  )

  return (
    <>
      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-brand-900 flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Logo size={26} />
          <span className="font-serif text-white text-base">Carunchio-Péculo</span>
        </div>
        <button onClick={() => setOpen(!open)} className="text-white/70 p-1">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-brand-900 pt-14 flex flex-col">
          {navLinks}
          <div className="px-5 py-4 border-t border-white/10 space-y-3">
            <button onClick={toggleDark} className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors w-full">
              {dark ? <Sun size={14} /> : <Moon size={14} />} {dark ? 'Modo claro' : 'Modo oscuro'}
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors w-full">
              <LogOut size={14} /> Cerrar sesión
            </button>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-brand-900 fixed top-0 left-0 h-screen z-40">
        <div className="px-4 pt-5 pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <Logo size={42} />
            <div>
              <h1 className="font-serif text-white text-lg leading-tight">Carunchio</h1>
              <h1 className="font-serif text-white text-lg leading-tight -mt-1">Péculo</h1>
              <p className="text-[9px] text-gold-200/50 tracking-widest uppercase mt-0.5">Gestión Interna</p>
            </div>
          </div>
        </div>
        {navLinks}
        <div className="px-5 py-4 border-t border-white/10 space-y-3 shrink-0">
          <button onClick={toggleDark} className="flex items-center gap-2 text-white/40 hover:text-white text-xs transition-colors w-full">
            {dark ? <Sun size={13} /> : <Moon size={13} />} {dark ? 'Modo claro' : 'Modo oscuro'}
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 text-white/40 hover:text-white text-xs transition-colors w-full">
            <LogOut size={13} /> Cerrar sesión
          </button>
          <p className="text-xs text-white/20">v3.0 · {new Date().getFullYear()}</p>
        </div>
      </aside>
    </>
  )
}
