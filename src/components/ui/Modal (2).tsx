'use client'
import { useEffect } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidth?: string
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-xl' }: Props) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={cn('bg-white rounded-t-2xl md:rounded-xl shadow-2xl w-full md:w-auto', maxWidth, 'max-h-[90vh] overflow-y-auto animate-fade-in')}>
        <div className="flex items-center justify-between p-5 border-b border-brand-100 sticky top-0 bg-white z-10">
          <h3 className="font-serif text-xl font-medium">{title}</h3>
          <button onClick={onClose} className="text-brand-400 hover:text-brand-900 transition-colors p-1"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

import { cn } from '@/lib/utils'
