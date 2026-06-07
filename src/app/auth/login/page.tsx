'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import Logo from '@/components/layout/Logo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signIn(email, password)
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Email o contraseña incorrectos')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo + nombre */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <Logo size={72} />
          <div className="text-center">
            <h1 className="font-serif text-3xl text-white leading-tight">Carunchio-Péculo</h1>
            <p className="text-gold-200/50 text-xs tracking-widest uppercase mt-1">Tradición en Servicios Fúnebres</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-2xl">
          <h2 className="font-serif text-xl mb-5 text-brand-900">Acceso al sistema</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-4">
            <div>
              <label className="label">Email</label>
              <input type="email" required className="input" placeholder="usuario@carunchio.com.ar"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} required className="input pr-10"
                  placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-700"
                  onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full justify-center mt-1" disabled={loading}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Ingresando...</> : 'Ingresar'}
            </button>
          </div>
        </form>
        <p className="text-center text-white/20 text-xs mt-6">Sistema de gestión interno · {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}
