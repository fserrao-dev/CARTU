'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Filter, Download } from 'lucide-react'
import type { Servicio, EstadoServicio } from '@/types'
import { fmtDate, fmtMoney, initiales, estadoColor } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import * as XLSX from 'xlsx'

const ESTADOS: EstadoServicio[] = ['PENDIENTE', 'EN CURSO', 'COMPLETADO', 'CANCELADO']
const PAGE_SIZE = 20

export default function ServiciosList({ servicios }: { servicios: Servicio[] }) {
  const [q, setQ] = useState('')
  const [destino, setDestino] = useState('')
  const [estado, setEstado] = useState('')
  const [asesor, setAsesor] = useState('')
  const [page, setPage] = useState(1)

  const asesores = useMemo(() => [...new Set(servicios.map(s => s.asesor).filter(Boolean))], [servicios])

  const filtered = useMemo(() => servicios.filter(s => {
    const matchQ = !q || `${s.ext_apellido} ${s.ext_nombre} ${s.nro_orden} ${s.resp_apellido} ${s.asesor}`.toLowerCase().includes(q.toLowerCase())
    const matchD = !destino || s.destino === destino
    const matchE = !estado || s.estado === estado
    const matchA = !asesor || s.asesor === asesor
    return matchQ && matchD && matchE && matchA
  }), [servicios, q, destino, estado, asesor])

  const paginated = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = filtered.length > paginated.length

  function exportExcel() {
    const rows = filtered.map(s => ({
      'N° Orden': s.nro_orden,
      'Fecha': s.fecha_servicio,
      'Apellido': s.ext_apellido,
      'Nombre': s.ext_nombre,
      'Documento': s.ext_documento,
      'Destino': s.destino,
      'Estado': s.estado,
      'Asesor': s.asesor,
      'Cobertura': s.cobertura,
      'Total': s.val_total_impuestos,
      'Abonado': s.val_abonado,
      'Saldo': s.val_saldo,
      'Responsable': `${s.resp_apellido}, ${s.resp_nombre}`,
      'Tel. Responsable': s.resp_celular || s.resp_telefono,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Servicios')
    XLSX.writeFile(wb, `cartu-servicios-${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  return (
    <>
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
          <input className="input pl-8" placeholder="Buscar apellido, nombre, orden, asesor..." value={q} onChange={e => { setQ(e.target.value); setPage(1) }} />
        </div>
        <select className="input w-auto" value={destino} onChange={e => { setDestino(e.target.value); setPage(1) }}>
          <option value="">Todos los destinos</option>
          <option>CREMACIÓN</option>
          <option>INHUMACIÓN</option>
        </select>
        <select className="input w-auto" value={estado} onChange={e => { setEstado(e.target.value); setPage(1) }}>
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e}>{e}</option>)}
        </select>
        <select className="input w-auto" value={asesor} onChange={e => { setAsesor(e.target.value); setPage(1) }}>
          <option value="">Todos los asesores</option>
          {asesores.map(a => <option key={a}>{a}</option>)}
        </select>
        <button className="btn btn-sm" onClick={exportExcel} title="Exportar a Excel">
          <Download size={14} /> Excel
        </button>
      </div>

      <p className="text-xs text-brand-400 mb-3">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>

      {filtered.length === 0 && (
        <div className="card text-center py-12 text-brand-400">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm">No se encontraron servicios</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {paginated.map(s => (
          <Link key={s.id} href={`/servicios/${s.id}`}
            className="bg-white border border-brand-100 rounded-xl p-4 hover:border-brand-200 hover:shadow-sm transition-all flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-sm font-semibold text-brand-600 shrink-0">
              {initiales(s.ext_apellido, s.ext_nombre)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{s.ext_apellido}, {s.ext_nombre}</p>
              <p className="text-xs text-brand-400 flex gap-3 mt-0.5 flex-wrap">
                <span>📅 {fmtDate(s.fecha_servicio)}</span>
                <span>📋 #{s.nro_orden}</span>
                <span>👤 {s.resp_apellido}, {s.resp_nombre}</span>
                {s.asesor && <span>Asesor: {s.asesor}</span>}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className={`badge border text-xs ${estadoColor(s.estado)}`}>{s.estado}</span>
              <Badge variant={s.destino === 'CREMACIÓN' ? 'info' : 'success'}>{s.destino}</Badge>
              {(s.val_saldo ?? 0) > 0 && <Badge variant="danger">Saldo: {fmtMoney(s.val_saldo)}</Badge>}
            </div>
          </Link>
        ))}
      </div>

      {hasMore && (
        <button className="btn w-full justify-center mt-4" onClick={() => setPage(p => p + 1)}>
          Cargar más ({filtered.length - paginated.length} restantes)
        </button>
      )}
    </>
  )
}
