'use client'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { CheckCircle, AlertCircle, X } from 'lucide-react'

interface Toast { id: number; msg: string; type: 'success' | 'error' }
interface Ctx { toast: (msg: string, type?: 'success' | 'error') => void }
const ToastCtx = createContext<Ctx>({ toast: () => {} })
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const toast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])
  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium animate-fade-in pointer-events-auto ${t.type === 'success' ? 'bg-brand-900 text-white' : 'bg-red-700 text-white'}`}>
            {t.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span className="flex-1">{t.msg}</span>
            <button onClick={() => setToasts(ts => ts.filter(x => x.id !== t.id))} className="opacity-60 hover:opacity-100"><X size={14} /></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
