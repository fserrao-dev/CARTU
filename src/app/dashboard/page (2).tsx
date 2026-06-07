import AppLayout from '@/components/layout/AppLayout'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { getServicios, getStock } from '@/lib/db'
import { fmtDate, fmtMoney, fmtMoneyShort, initiales, estadoColor } from '@/lib/utils'
import Link from 'next/link'
import { AlertTriangle, ArrowRight, TrendingUp, Plus } from 'lucide-react'

export const revalidate = 0

export default async function DashboardPage() {
  const [servicios, stock] = await Promise.all([getServicios(), getStock()])

  const hoy = new Date().toISOString().slice(0, 10)
  const mes = hoy.slice(0, 7)
  const mesAnterior = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().slice(0, 7)

  const delMes = servicios.filter(s => s.fecha_servicio?.startsWith(mes))
  const delMesAnt = servicios.filter(s => s.fecha_servicio?.startsWith(mesAnterior))
  const pendientes = servicios.filter(s => (s.val_saldo ?? 0) > 0)
  const stockBajo = stock.filter(s => s.cantidad <= s.minimo)

  const facturacionMes = delMes.reduce((acc, s) => acc + (s.val_total_impuestos ?? 0), 0)
  const cobradoMes = delMes.reduce((acc, s) => acc + (s.val_abonado ?? 0), 0)
  const saldoTotal = pendientes.reduce((acc, s) => acc + (s.val_saldo ?? 0), 0)

  const recientes = servicios.slice(0, 6)

  return (
    <AppLayout title="Inicio" actions={
      <Link href="/servicios/nuevo" className="btn btn-primary btn-sm">
        <Plus size={14} /> Nuevo servicio
      </Link>
    }>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Este mes" value={delMes.length} sub={`${delMesAnt.length} el mes anterior`} variant="gold" />
        <StatCard label="Total servicios" value={servicios.length} />
        <StatCard label="Facturado (mes)" value={fmtMoneyShort(facturacionMes)} sub={`Cobrado: ${fmtMoneyShort(cobradoMes)}`} />
        <StatCard label="Saldo pendiente" value={fmtMoneyShort(saldoTotal)} sub={`${pendientes.length} servicios`} variant={saldoTotal > 0 ? 'danger' : 'default'} />
      </div>

      {/* Alertas */}
      {stockBajo.length > 0 && (
        <Link href="/stock" className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-amber-700 hover:bg-amber-100 transition-colors group">
          <AlertTriangle size={16} className="shrink-0" />
          <span className="text-sm flex-1">Stock bajo: {stockBajo.map(s => `${s.descripcion} (${s.cantidad})`).join(' · ')}</span>
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Últimos servicios */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg">Últimos servicios</h3>
            <Link href="/servicios" className="text-xs text-brand-400 hover:text-brand-900 flex items-center gap-1 transition-colors">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          <div className="flex flex-col gap-1">
            {recientes.length === 0 && <p className="text-sm text-brand-400 py-6 text-center">Sin servicios registrados</p>}
            {recientes.map(s => (
              <Link key={s.id} href={`/servicios/${s.id}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-brand-50 transition-colors group">
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-xs font-semibold text-brand-600 shrink-0">
                  {initiales(s.ext_apellido, s.ext_nombre)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.ext_apellido}, {s.ext_nombre}</p>
                  <p className="text-xs text-brand-400">{fmtDate(s.fecha_servicio)} · #{s.nro_orden} · {s.asesor}</p>
                </div>
                <span className={`badge text-xs border ${estadoColor(s.estado)}`}>{s.estado}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Cobros pendientes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg">Cobros pendientes</h3>
            <span className="text-xs text-brand-400">{fmtMoney(saldoTotal)} total</span>
          </div>
          <div className="flex flex-col gap-1">
            {pendientes.length === 0 && (
              <p className="text-sm text-brand-400 py-6 text-center">Sin saldos pendientes ✓</p>
            )}
            {pendientes.slice(0, 6).map(s => (
              <Link key={s.id} href={`/servicios/${s.id}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-brand-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.ext_apellido}, {s.ext_nombre}</p>
                  <p className="text-xs text-brand-400">Resp: {s.resp_apellido} · {fmtDate(s.fecha_servicio)}</p>
                </div>
                <span className="text-sm font-semibold text-red-700">{fmtMoney(s.val_saldo)}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Resumen por tipo */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {(['CREMACIÓN', 'INHUMACIÓN'] as const).map(d => {
          const count = servicios.filter(s => s.destino === d).length
          const pct = servicios.length ? Math.round(count / servicios.length * 100) : 0
          return (
            <div key={d} className="card">
              <p className="text-xs text-brand-400 uppercase tracking-wider mb-1">{d}</p>
              <p className="font-serif text-3xl">{count}</p>
              <div className="mt-2 bg-brand-100 rounded-full h-1.5">
                <div className="bg-brand-700 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-brand-400 mt-1">{pct}% del total</p>
            </div>
          )
        })}
        <div className="card">
          <p className="text-xs text-brand-400 uppercase tracking-wider mb-1">Completados</p>
          <p className="font-serif text-3xl">{servicios.filter(s => s.estado === 'COMPLETADO').length}</p>
          <div className="mt-2 bg-brand-100 rounded-full h-1.5">
            <div className="bg-green-600 h-1.5 rounded-full" style={{ width: `${servicios.length ? Math.round(servicios.filter(s => s.estado === 'COMPLETADO').length / servicios.length * 100) : 0}%` }} />
          </div>
          <p className="text-xs text-brand-400 mt-1">de {servicios.length} totales</p>
        </div>
      </div>
    </AppLayout>
  )
}
