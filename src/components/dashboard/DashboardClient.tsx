'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Servicio, EstadoServicio } from '@/types'
import { fmtDate, estadoColor, initiales } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { updateServicio } from '@/lib/db'
import { useToast } from '@/components/ui/ToastProvider'

const ESTADOS: EstadoServicio[] = ['PENDIENTE','EN CURSO','COMPLETADO','CANCELADO']

export default function DashboardClient({ servicios: init }: { servicios: Servicio[] }) {
  const { toast } = useToast()
  const [servicios, setServicios] = useState(init)
  const [changing, setChanging] = useState<string | null>(null)

  async function changeEstado(id: string, estado: EstadoServicio) {
    setChanging(id)
    await updateServicio(id, { estado })
    setServicios(prev => prev.map(s => s.id === id ? { ...s, estado } : s))
    toast(`Estado → ${estado}`)
    setChanging(null)
  }

  if (servicios.length === 0) return <p className="text-sm py-6 text-center" style={{color:'var(--text3)'}}>Sin servicios registrados</p>

  return (
    <div className="flex flex-col gap-2">
      {servicios.map(s => (
        <div key={s.id} className="rounded-lg p-2.5 transition-colors" style={{background:'var(--surface2)'}}>
          <div className="flex items-start gap-2 mb-1.5">
            <Link href={`/servicios/${s.id}`} className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80">
              <div className="w-8 h-8 rounded-full bg-brand-900 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                {initiales(s.ext_apellido, s.ext_nombre)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{s.ext_apellido}, {s.ext_nombre}</p>
                <p className="text-xs" style={{color:'var(--text3)'}}>{fmtDate(s.fecha_servicio)} · #{s.nro_orden}</p>
              </div>
            </Link>
            <Badge variant={s.destino==='CREMACIÓN'?'info':'success'}>{s.destino}</Badge>
          </div>
          {/* Quick estado change */}
          <div className="flex gap-1 flex-wrap">
            {ESTADOS.map(e => (
              <button key={e} disabled={changing === s.id}
                onClick={() => changeEstado(s.id, e)}
                className={`text-xs px-2 py-0.5 rounded-full border transition-all ${s.estado === e ? estadoColor(e) + ' ring-1 ring-offset-1' : 'opacity-40 hover:opacity-70'}`}
                style={s.estado !== e ? {borderColor:'var(--border)'} : {}}>
                {e}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
