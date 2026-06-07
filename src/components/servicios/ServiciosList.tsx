'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search, Filter } from 'lucide-react'
import type { Servicio } from '@/types'
import { fmtDate, fmtMoney, initiales } from '@/lib/utils'
import Badge from '@/components/ui/Badge'

export default function ServiciosList({ servicios }: { servicios: Servicio[] }) {
  const [q, setQ] = useState('')
  const [destino, setDestino] = useState('')

  const filtered = servicios.filter(s => {
    const match = `${s.ext_apellido} ${s.ext_nombre} ${s.nro_orden} ${s.resp_apellido} ${s.asesor}`.toLowerCase().includes(q.toLowerCase())
    const matchDest = !destino || s.destino === destino
    return match && matchDest
  })

  return (
    <>
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" />
          <input
            className="input pl-9"
            placeholder="Buscar por apellido, nombre, orden, asesor..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" />
          <select
            className="input pl-8 pr-3 w-auto"
            value={destino}
            onChange={e => setDestino(e.target.value)}
          >
            <option value="">Todos</option>
            <option>CREMACIÓN</option>
            <option>INHUMACIÓN</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="card text-center py-12 text-brand-500">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm">No se encontraron servicios</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {filtered.map(s => (
          <Link
            key={s.id}
            href={`/servicios/${s.id}`}
            className="bg-white border border-brand-100 rounded-xl p-4 hover:border-brand-200 hover:shadow-sm transition-all flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-sm font-semibold text-brand-700 shrink-0">
              {initiales(s.ext_apellido, s.ext_nombre)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{s.ext_apellido}, {s.ext_nombre}</p>
              <p className="text-xs text-brand-500 flex gap-3 mt-0.5 flex-wrap">
                <span>📅 {fmtDate(s.fecha_servicio)}</span>
                <span>📋 Orden #{s.nro_orden}</span>
                <span>👤 Resp: {s.resp_apellido}, {s.resp_nombre}</span>
                {s.asesor && <span>Asesor: {s.asesor}</span>}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Badge variant={s.destino === 'CREMACIÓN' ? 'info' : 'success'}>{s.destino}</Badge>
              <Badge variant={s.cobertura === 'PARTICULAR' ? 'default' : 'gold'}>{s.cobertura}</Badge>
              {(s.val_saldo ?? 0) > 0 && <Badge variant="danger">Saldo: {fmtMoney(s.val_saldo)}</Badge>}
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
