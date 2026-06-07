'use client'
import { useState, useMemo } from 'react'
import type { Servicio } from '@/types'
import { fmtMoney, fmtMoneyShort, mesNombre } from '@/lib/utils'
import { StatCard } from '@/components/ui/StatCard'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import * as XLSX from 'xlsx'
import { Download } from 'lucide-react'

export default function ReportesView({ servicios }: { servicios: Servicio[] }) {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)

  const years = useMemo(() => {
    const ys = new Set(servicios.map(s => s.fecha_servicio?.slice(0, 4)).filter(Boolean))
    return [currentYear, ...Array.from(ys).map(Number).filter(y => y !== currentYear)].sort((a, b) => b - a)
  }, [servicios, currentYear])

  const delAnio = useMemo(() => servicios.filter(s => s.fecha_servicio?.startsWith(String(year))), [servicios, year])

  // Por mes
  const porMes = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0')
    const svcs = delAnio.filter(s => s.fecha_servicio?.slice(5, 7) === m)
    return {
      mes: mesNombre(i + 1),
      servicios: svcs.length,
      facturado: svcs.reduce((a, s) => a + (s.val_total_impuestos ?? 0), 0),
      cobrado: svcs.reduce((a, s) => a + (s.val_abonado ?? 0), 0),
    }
  }), [delAnio])

  // Por asesor
  const porAsesor = useMemo(() => {
    const map: Record<string, { servicios: number; facturado: number }> = {}
    delAnio.forEach(s => {
      const a = s.asesor || 'Sin asignar'
      if (!map[a]) map[a] = { servicios: 0, facturado: 0 }
      map[a].servicios++
      map[a].facturado += s.val_total_impuestos ?? 0
    })
    return Object.entries(map).map(([nombre, d]) => ({ nombre, ...d })).sort((a, b) => b.servicios - a.servicios)
  }, [delAnio])

  // Totales
  const totalFact = delAnio.reduce((a, s) => a + (s.val_total_impuestos ?? 0), 0)
  const totalCob = delAnio.reduce((a, s) => a + (s.val_abonado ?? 0), 0)
  const totalSaldo = delAnio.reduce((a, s) => a + (s.val_saldo ?? 0), 0)
  const cremaciones = delAnio.filter(s => s.destino === 'CREMACIÓN').length
  const inhumaciones = delAnio.filter(s => s.destino === 'INHUMACIÓN').length

  function exportExcel() {
    const wb = XLSX.utils.book_new()
    // Resumen mensual
    const wsMes = XLSX.utils.json_to_sheet(porMes.map(m => ({
      Mes: m.mes, Servicios: m.servicios,
      'Facturado': m.facturado, 'Cobrado': m.cobrado,
    })))
    XLSX.utils.book_append_sheet(wb, wsMes, 'Por mes')
    // Por asesor
    const wsAsesor = XLSX.utils.json_to_sheet(porAsesor.map(a => ({
      Asesor: a.nombre, Servicios: a.servicios, Facturado: a.facturado
    })))
    XLSX.utils.book_append_sheet(wb, wsAsesor, 'Por asesor')
    // Listado completo
    const wsAll = XLSX.utils.json_to_sheet(delAnio.map(s => ({
      'N° Orden': s.nro_orden, Fecha: s.fecha_servicio,
      Apellido: s.ext_apellido, Nombre: s.ext_nombre,
      Destino: s.destino, Estado: s.estado, Asesor: s.asesor,
      Cobertura: s.cobertura, Total: s.val_total_impuestos,
      Abonado: s.val_abonado, Saldo: s.val_saldo,
    })))
    XLSX.utils.book_append_sheet(wb, wsAll, 'Detalle')
    XLSX.writeFile(wb, `cartu-reporte-${year}.xlsx`)
  }

  const COLORS = ['#1A1410', '#3D3228', '#6B5E4A', '#9E9280', '#D4CDBF']

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <select className="input w-auto" value={year} onChange={e => setYear(Number(e.target.value))}>
            {years.map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
        <button className="btn btn-sm btn-gold" onClick={exportExcel}><Download size={14} /> Exportar Excel</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Servicios" value={delAnio.length} sub={`Crem: ${cremaciones} · Inhu: ${inhumaciones}`} />
        <StatCard label="Facturado" value={fmtMoneyShort(totalFact)} sub="total del período" variant="gold" />
        <StatCard label="Cobrado" value={fmtMoneyShort(totalCob)} sub={`${totalFact ? Math.round(totalCob / totalFact * 100) : 0}% del facturado`} />
        <StatCard label="Pendiente cobro" value={fmtMoneyShort(totalSaldo)} variant={totalSaldo > 0 ? 'danger' : 'default'} />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* Servicios por mes */}
        <div className="card">
          <h3 className="font-serif text-lg mb-4">Servicios por mes</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={porMes} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip formatter={(v: number) => [v, 'Servicios']} />
              <Bar dataKey="servicios" radius={[4, 4, 0, 0]}>
                {porMes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Facturación por mes */}
        <div className="card">
          <h3 className="font-serif text-lg mb-4">Facturación mensual</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={porMes} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => fmtMoneyShort(v)} />
              <Tooltip formatter={(v: number) => [fmtMoney(v), '']} />
              <Bar dataKey="facturado" name="Facturado" fill="#8B6914" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cobrado" name="Cobrado" fill="#2A6B3A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Por asesor */}
      <div className="card">
        <h3 className="font-serif text-lg mb-4">Rendimiento por asesor</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="table-head">
              <th className="text-left py-2 px-3">Asesor</th>
              <th className="text-center py-2 px-3">Servicios</th>
              <th className="text-right py-2 px-3">Facturado</th>
              <th className="text-right py-2 px-3">Ticket promedio</th>
            </tr>
          </thead>
          <tbody>
            {porAsesor.map(a => (
              <tr key={a.nombre} className="table-row">
                <td className="py-3 px-3 font-medium">{a.nombre}</td>
                <td className="py-3 px-3 text-center">
                  <span className="badge bg-brand-100 text-brand-700">{a.servicios}</span>
                </td>
                <td className="py-3 px-3 text-right">{fmtMoney(a.facturado)}</td>
                <td className="py-3 px-3 text-right text-brand-500">{a.servicios > 0 ? fmtMoney(Math.round(a.facturado / a.servicios)) : '—'}</td>
              </tr>
            ))}
            {porAsesor.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-brand-400">Sin datos para este período</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}
