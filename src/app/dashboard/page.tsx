import AppLayout from '@/components/layout/AppLayout'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import { getServicios, getStock } from '@/lib/db'
import { fmtDate, fmtMoney, initiales } from '@/lib/utils'
import Link from 'next/link'
import { AlertTriangle, ArrowRight } from 'lucide-react'

export const revalidate = 0

export default async function DashboardPage() {
  const [servicios, stock] = await Promise.all([getServicios(), getStock()])

  const hoy = new Date().toISOString().slice(0, 10)
  const mes = hoy.slice(0, 7)
  const totalMes = servicios.filter(s => s.fecha_servicio?.startsWith(mes)).length
  const cremaciones = servicios.filter(s => s.destino === 'CREMACIÓN').length
  const saldoPendiente = servicios.filter(s => (s.val_saldo ?? 0) > 0).length
  const stockBajo = stock.filter(s => s.cantidad <= s.minimo)
  const recientes = servicios.slice(0, 5)

  return (
    <AppLayout title="Inicio">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total servicios" value={servicios.length} />
        <StatCard label="Este mes" value={totalMes} variant="gold" />
        <StatCard label="Cremaciones" value={cremaciones} />
        <StatCard label="Saldos pendientes" value={saldoPendiente} variant={saldoPendiente > 0 ? 'danger' : 'default'} />
      </div>

      {/* Alertas stock */}
      {stockBajo.length > 0 && (
        <Link href="/stock" className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-amber-700 hover:bg-amber-100 transition-colors">
          <AlertTriangle size={16} className="shrink-0" />
          <span className="text-sm flex-1">
            Stock bajo: {stockBajo.map(s => `${s.descripcion} (${s.cantidad} ud.)`).join(' · ')}
          </span>
          <ArrowRight size={14} />
        </Link>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Últimos servicios */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg">Últimos servicios</h3>
            <Link href="/servicios" className="text-xs text-brand-500 hover:text-brand-900 flex items-center gap-1">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {recientes.length === 0 && <p className="text-sm text-brand-500 py-4 text-center">Sin servicios registrados</p>}
            {recientes.map(s => (
              <Link key={s.id} href={`/servicios/${s.id}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-brand-50 transition-colors group">
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-xs font-semibold text-brand-700 shrink-0">
                  {initiales(s.ext_apellido, s.ext_nombre)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.ext_apellido}, {s.ext_nombre}</p>
                  <p className="text-xs text-brand-500">{fmtDate(s.fecha_servicio)} · #{s.nro_orden}</p>
                </div>
                <Badge variant={s.destino === 'CREMACIÓN' ? 'info' : 'success'}>{s.destino}</Badge>
              </Link>
            ))}
          </div>
        </div>

        {/* Saldos pendientes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg">Cobros pendientes</h3>
          </div>
          <div className="flex flex-col gap-2">
            {servicios.filter(s => (s.val_saldo ?? 0) > 0).length === 0 && (
              <p className="text-sm text-brand-500 py-4 text-center">Sin saldos pendientes ✓</p>
            )}
            {servicios.filter(s => (s.val_saldo ?? 0) > 0).map(s => (
              <Link key={s.id} href={`/servicios/${s.id}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-brand-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.ext_apellido}, {s.ext_nombre}</p>
                  <p className="text-xs text-brand-500">Resp: {s.resp_apellido} · {fmtDate(s.fecha_servicio)}</p>
                </div>
                <span className="text-sm font-medium text-red-700">{fmtMoney(s.val_saldo)}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
