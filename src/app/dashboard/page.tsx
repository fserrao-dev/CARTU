import AppLayout from '@/components/layout/AppLayout'
import { getServicios, getStock, getEmpleados } from '@/lib/db'
import { fmtDate, fmtMoney, fmtMoneyShort, initiales, estadoColor } from '@/lib/utils'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import { AlertTriangle, ArrowRight, Plus, Clock } from 'lucide-react'
import DashboardClient from '@/components/dashboard/DashboardClient'

export const revalidate = 0

export default async function DashboardPage() {
  const [servicios, stock, empleados] = await Promise.all([getServicios(), getStock(), getEmpleados()])

  const hoy = new Date()
  const hoyStr = hoy.toISOString().slice(0, 10)
  const mes = hoyStr.slice(0, 7)

  const delMes = servicios.filter(s => s.fecha_servicio?.startsWith(mes))
  const cremaciones = servicios.filter(s => s.destino === 'CREMACIÓN').length
  const pendientes = servicios.filter(s => (s.val_saldo ?? 0) > 0)
  const stockBajo = stock.filter(s => s.cantidad <= s.minimo)

  // Saldos vencidos (+30 días)
  const hace30 = new Date(hoy); hace30.setDate(hace30.getDate() - 30)
  const saldosVencidos = pendientes.filter(s => {
    if (!s.fecha_servicio) return false
    return new Date(s.fecha_servicio) < hace30
  })

  const facturacionMes = delMes.reduce((a, s) => a + (s.val_total_impuestos ?? 0), 0)
  const cobradoMes = delMes.reduce((a, s) => a + (s.val_abonado ?? 0), 0)
  const saldoTotal = pendientes.reduce((a, s) => a + (s.val_saldo ?? 0), 0)
  const recientes = servicios.slice(0, 6)

  return (
    <AppLayout title="Inicio" actions={
      <Link href="/servicios/nuevo" className="btn btn-primary btn-sm">
        <Plus size={14} /> Nuevo servicio
      </Link>
    }>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label="Este mes" value={delMes.length} sub={`Total: ${servicios.length}`} variant="gold" />
        <StatCard label="Facturado mes" value={fmtMoneyShort(facturacionMes)} sub={`Cobrado: ${fmtMoneyShort(cobradoMes)}`} />
        <StatCard label="Saldo pendiente" value={fmtMoneyShort(saldoTotal)} sub={`${pendientes.length} servicios`} variant={saldoTotal > 0 ? 'danger' : 'default'} />
        <StatCard label="Empleados activos" value={empleados.filter(e => e.estado === 'ACTIVO').length} sub={`${empleados.filter(e => e.rol === 'ASESOR' && e.estado === 'ACTIVO').length} asesores`} />
      </div>

      {/* Alertas */}
      {saldosVencidos.length > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-3 text-red-700 text-sm">
          <Clock size={16} className="shrink-0" />
          <span className="flex-1">
            <strong>{saldosVencidos.length} saldo{saldosVencidos.length > 1 ? 's' : ''} vencido{saldosVencidos.length > 1 ? 's' : ''}</strong> (más de 30 días): {saldosVencidos.map(s => `${s.ext_apellido} ${fmtMoney(s.val_saldo)}`).join(' · ')}
          </span>
          <Link href="/servicios" className="shrink-0"><ArrowRight size={14} /></Link>
        </div>
      )}
      {stockBajo.length > 0 && (
        <Link href="/stock" className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-amber-700 hover:bg-amber-100 transition-colors group">
          <AlertTriangle size={16} className="shrink-0" />
          <span className="text-sm flex-1">Stock bajo: {stockBajo.map(s => `${s.descripcion} (${s.cantidad})`).join(' · ')}</span>
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Últimos servicios con cambio de estado rápido */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg">Últimos servicios</h3>
            <Link href="/servicios" className="text-xs flex items-center gap-1 hover:opacity-70 transition-opacity" style={{color:'var(--text3)'}}>
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          <DashboardClient servicios={recientes} />
        </div>

        {/* Cobros pendientes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg">Cobros pendientes</h3>
            <span className="text-xs" style={{color:'var(--text3)'}}>{fmtMoney(saldoTotal)} total</span>
          </div>
          <div className="flex flex-col gap-1">
            {pendientes.length === 0 && <p className="text-sm py-6 text-center" style={{color:'var(--text3)'}}>Sin saldos pendientes ✓</p>}
            {pendientes.slice(0, 6).map(s => (
              <Link key={s.id} href={`/servicios/${s.id}`}
                className="flex items-center gap-3 p-2.5 rounded-lg transition-colors"
                style={{}} onMouseEnter={e=>(e.currentTarget.style.background='var(--surface2)')} onMouseLeave={e=>(e.currentTarget.style.background='')}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.ext_apellido}, {s.ext_nombre}</p>
                  <p className="text-xs" style={{color:'var(--text3)'}}>
                    {fmtDate(s.fecha_servicio)}
                    {saldosVencidos.find(v => v.id === s.id) && <span className="ml-2 text-red-600 font-medium">· Vencido</span>}
                  </p>
                </div>
                <span className={`text-sm font-semibold ${saldosVencidos.find(v => v.id === s.id) ? 'text-red-700' : 'text-amber-700'}`}>
                  {fmtMoney(s.val_saldo)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {(['CREMACIÓN','INHUMACIÓN'] as const).map(d => {
          const count = servicios.filter(s => s.destino === d).length
          const pct = servicios.length ? Math.round(count / servicios.length * 100) : 0
          return (
            <div key={d} className="card">
              <p className="text-xs uppercase tracking-wider mb-1" style={{color:'var(--text3)'}}>{d}</p>
              <p className="font-serif text-3xl">{count}</p>
              <div className="mt-2 rounded-full h-1.5" style={{background:'var(--surface2)'}}>
                <div className={`h-1.5 rounded-full ${d==='CREMACIÓN'?'bg-blue-600':'bg-green-600'}`} style={{width:`${pct}%`}} />
              </div>
              <p className="text-xs mt-1" style={{color:'var(--text3)'}}>{pct}% del total</p>
            </div>
          )
        })}
        <div className="card">
          <p className="text-xs uppercase tracking-wider mb-1" style={{color:'var(--text3)'}}>Completados</p>
          <p className="font-serif text-3xl">{servicios.filter(s=>s.estado==='COMPLETADO').length}</p>
          <div className="mt-2 rounded-full h-1.5" style={{background:'var(--surface2)'}}>
            <div className="bg-green-600 h-1.5 rounded-full" style={{width:`${servicios.length?Math.round(servicios.filter(s=>s.estado==='COMPLETADO').length/servicios.length*100):0}%`}} />
          </div>
          <p className="text-xs mt-1" style={{color:'var(--text3)'}}>de {servicios.length} totales</p>
        </div>
      </div>
    </AppLayout>
  )
}
