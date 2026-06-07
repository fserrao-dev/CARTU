'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ClipboardList, Plus, Package, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', label: 'Inicio',         icon: LayoutDashboard },
  { href: '/servicios', label: 'Servicios',       icon: ClipboardList   },
  { href: '/servicios/nuevo', label: 'Nuevo servicio', icon: Plus        },
  { href: '/stock',     label: 'Stock',           icon: Package         },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const nav = (
    <nav className="flex-1 py-4">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href) && href !== '/servicios/nuevo')
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-3 px-5 py-2.5 text-sm transition-all border-l-2',
              active
                ? 'text-white bg-white/10 border-l-gold-200'
                : 'text-white/50 border-transparent hover:text-white/80 hover:bg-white/5'
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-brand-900 flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="font-serif text-white text-lg">CARTU</span>
        <button onClick={() => setOpen(!open)} className="text-white/70">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-brand-900 pt-14 flex flex-col">
          {nav}
          <div className="px-5 py-4 border-t border-white/10 text-xs text-white/30">v1.0 · 2026</div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-52 bg-brand-900 fixed top-0 left-0 h-screen z-40">
        <div className="px-5 pt-6 pb-4 border-b border-white/10">
          <h1 className="font-serif text-white text-xl leading-tight">CARTU</h1>
          <p className="text-xs text-white/30 tracking-widest uppercase mt-1">Sistema de Gestión</p>
        </div>
        {nav}
        <div className="px-5 py-4 border-t border-white/10 text-xs text-white/30">v1.0 · 2026</div>
      </aside>
    </>
  )
}
