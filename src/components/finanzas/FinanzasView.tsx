'use client'
import { useState, useMemo } from 'react'
import type { Servicio, Egreso, CobranzaOS, GastoFijo, StockItem, TipoEgreso, EstadoCobro } from '@/types'
import { fmtMoney, fmtMoneyShort, fmtDate, mesNombre } from '@/lib/utils'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { useToast } from '@/components/ui/ToastProvider'
import {
  createEgreso, deleteEgreso, updateEgreso,
  createCobranzaOS, updateCobranzaOS, deleteCobranzaOS,
  createGastoFijo, updateGastoFijo, deleteGastoFijo,
} from '@/lib/db'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { Plus, Trash2, Edit2, TrendingUp, TrendingDown, DollarSign,
  AlertTriangle, CheckCircle, Clock, Building2, Download } from 'lucide-react'
import * as XLSX from 'xlsx'

type Tab = 'dashboard' | 'egresos' | 'cobranzas_os' | 'gastos_fijos' | 'rentabilidad'

const TIPOS_EGRESO: TipoEgreso[] = [
  'STOCK','CREMATORIO','COMBUSTIBLE','MANTENIMIENTO','PERSONAL',
  'ALQUILER','SERVICIOS','SEGUROS','SUBCONTRATADO','IMPUESTOS','BANCARIO','OTRO'
]

const ESTADOS_COBRO: EstadoCobro[] = ['PENDIENTE','PRESENTADO','COBRADO','INCOBRABLE']

const EGRESO_COLORS: Record<TipoEgreso, string> = {
  STOCK: '#1A1410', CREMATORIO: '#3D3228', COMBUSTIBLE: '#6B5E4A',
  MANTENIMIENTO: '#8B6914', PERSONAL: '#9E9280', ALQUILER: '#D4CDBF',
  SERVICIOS: '#2A6B3A', SEGUROS: '#1A4A7A', SUBCONTRATADO: '#7A1A2A',
  IMPUESTOS: '#4A1A7A', BANCARIO: '#7A5A1A', OTRO: '#555'
}

const COBRO_BADGE: Record<EstadoCobro, 'default' | 'warn' | 'success' | 'danger'> = {
  PENDIENTE: 'warn', PRESENTADO: 'info' as never, COBRADO: 'success', INCOBRABLE: 'danger'
}

interface Props {
  servicios: Servicio[]
  egresos: Egreso[]
  cobranzas: CobranzaOS[]
  gastosFijos: GastoFijo[]
  stock: StockItem[]
}

export default function FinanzasView({ servicios, egresos: initEgresos, cobranzas: initCobranzas, gastosFijos: initGastosFijos, stock }: Props) {
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('dashboard')
  const [egresos, setEgresos] = useState(initEgresos)
  const [cobranzas, setCobranzas] = useState(initCobranzas)
  const [gastosFijos, setGastosFijos] = useState(initGastosFijos)

  const now = new Date()
  const currentMes = now.toISOString().slice(0, 7)
  const [mesFiltro, setMesFiltro] = useState(currentMes)

  // ── Modales ──
  const [egresoModal, setEgresoModal] = useState(false)
  const [egresoEdit, setEgresoEdit] = useState<Egreso | null>(null)
  const [cobranzaModal, setCobranzaModal] = useState(false)
  const [cobranzaEdit, setCobranzaEdit] = useState<CobranzaOS | null>(null)
  const [gastoFijoModal, setGastoFijoModal] = useState(false)
  const [gastoFijoEdit, setGastoFijoEdit] = useState<GastoFijo | null>(null)
  const [saving, setSaving] = useState(false)

  // ── Forms ──
  const EGRESO_DEFAULT = { fecha: currentMes + '-01', tipo: 'OTRO' as TipoEgreso, descripcion: '', proveedor: '', monto: '', comprobante: '', notas: '', servicio_id: '' }
  const [egresoForm, setEgresoForm] = useState(EGRESO_DEFAULT)

  const COB_DEFAULT = { servicio_id: '', obra_social: '', codigo_prestacion: '', arancel: '', monto_presentado: '', fecha_presentacion: '', fecha_cobro_estimada: '', fecha_cobro_real: '', estado: 'PENDIENTE' as EstadoCobro, notas: '' }
  const [cobForm, setCobForm] = useState(COB_DEFAULT)

  const GF_DEFAULT = { nombre: '', tipo: 'ALQUILER' as TipoEgreso, monto_mensual: '' as string, activo: true, notas: '' }
  const [gfForm, setGfForm] = useState<typeof GF_DEFAULT & { activo: boolean }>(GF_DEFAULT)

  // ── Cálculos globales ──────────────────────────────────────────────────────
  const serviciosDelMes = useMemo(() =>
    servicios.filter(s => s.fecha_servicio?.startsWith(mesFiltro)), [servicios, mesFiltro])

  const egresosDelMes = useMemo(() =>
    egresos.filter(e => e.fecha?.startsWith(mesFiltro)), [egresos, mesFiltro])

  const totalGastosFijosActivos = useMemo(() =>
    gastosFijos.filter(g => g.activo).reduce((a, g) => a + g.monto_mensual, 0), [gastosFijos])

  const facturadoMes = useMemo(() =>
    serviciosDelMes.reduce((a, s) => a + (s.val_total_impuestos ?? 0), 0), [serviciosDelMes])

  const cobradoMes = useMemo(() =>
    serviciosDelMes.reduce((a, s) => a + (s.val_abonado ?? 0), 0), [serviciosDelMes])

  const pendienteFamilias = useMemo(() =>
    servicios.filter(s => (s.val_saldo ?? 0) > 0).reduce((a, s) => a + (s.val_saldo ?? 0), 0), [servicios])

  const pendienteOS = useMemo(() =>
    cobranzas.filter(c => c.estado !== 'COBRADO' && c.estado !== 'INCOBRABLE')
      .reduce((a, c) => a + c.monto_presentado, 0), [cobranzas])

  const egresosVarMes = useMemo(() =>
    egresosDelMes.reduce((a, e) => a + e.monto, 0), [egresosDelMes])

  const totalEgresosMes = egresosVarMes + totalGastosFijosActivos
  const resultadoMes = cobradoMes - totalEgresosMes

  const valorStock = useMemo(() =>
    stock.reduce((a, s) => a + ((s.precio_unitario ?? 0) * s.cantidad), 0), [stock])

  // ── Datos gráficos ─────────────────────────────────────────────────────────
  const datosMensuales = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
      const mes = d.toISOString().slice(0, 7)
      const svcs = servicios.filter(s => s.fecha_servicio?.startsWith(mes))
      const egs = egresos.filter(e => e.fecha?.startsWith(mes))
      return {
        mes: mesNombre(d.getMonth() + 1),
        facturado: svcs.reduce((a, s) => a + (s.val_total_impuestos ?? 0), 0),
        cobrado: svcs.reduce((a, s) => a + (s.val_abonado ?? 0), 0),
        egresos: egs.reduce((a, e) => a + e.monto, 0) + totalGastosFijosActivos,
        servicios: svcs.length,
      }
    })
  }, [servicios, egresos, totalGastosFijosActivos])

  const egresoPorTipo = useMemo(() => {
    const map: Record<string, number> = {}
    egresosDelMes.forEach(e => { map[e.tipo] = (map[e.tipo] ?? 0) + e.monto })
    gastosFijos.filter(g => g.activo).forEach(g => { map[g.tipo] = (map[g.tipo] ?? 0) + g.monto_mensual })
    return Object.entries(map).map(([tipo, monto]) => ({ tipo, monto })).sort((a, b) => b.monto - a.monto)
  }, [egresosDelMes, gastosFijos])

  const rentabilidadPorServicio = useMemo(() => {
    return servicios
      .filter(s => s.val_total_impuestos && s.val_total_impuestos > 0)
      .map(s => {
        const egresosAsoc = egresos.filter(e => e.servicio_id === s.id).reduce((a, e) => a + e.monto, 0)
        const margen = (s.val_total_impuestos ?? 0) - egresosAsoc
        const pct = s.val_total_impuestos ? Math.round(margen / s.val_total_impuestos * 100) : 0
        return { ...s, egresos_asoc: egresosAsoc, margen, pct_margen: pct }
      })
      .sort((a, b) => b.margen - a.margen)
      .slice(0, 10)
  }, [servicios, egresos])

  const mesesDisponibles = useMemo(() => {
    const meses = new Set(servicios.map(s => s.fecha_servicio?.slice(0, 7)).filter(Boolean))
    egresos.forEach(e => e.fecha && meses.add(e.fecha.slice(0, 7)))
    return Array.from(meses).sort().reverse()
  }, [servicios, egresos])

  // ── CRUD Egresos ───────────────────────────────────────────────────────────
  function openEgresoCreate() { setEgresoForm(EGRESO_DEFAULT); setEgresoEdit(null); setEgresoModal(true) }
  function openEgresoEdit(e: Egreso) {
    setEgresoForm({ fecha: e.fecha, tipo: e.tipo, descripcion: e.descripcion, proveedor: e.proveedor ?? '', monto: String(e.monto), comprobante: e.comprobante ?? '', notas: e.notas ?? '', servicio_id: e.servicio_id ?? '' })
    setEgresoEdit(e); setEgresoModal(true)
  }

  async function saveEgreso() {
    if (!egresoForm.descripcion || !egresoForm.monto) { toast('Completá descripción y monto', 'error'); return }
    setSaving(true)
    try {
      const payload = { fecha: egresoForm.fecha, tipo: egresoForm.tipo, descripcion: egresoForm.descripcion, proveedor: egresoForm.proveedor, monto: Number(egresoForm.monto), comprobante: egresoForm.comprobante, notas: egresoForm.notas, servicio_id: egresoForm.servicio_id || undefined }
      if (egresoEdit) {
        await updateEgreso(egresoEdit.id, payload)
        setEgresos(prev => prev.map(e => e.id === egresoEdit.id ? { ...e, ...payload } : e))
        toast('Egreso actualizado')
      } else {
        const e = await createEgreso(payload)
        setEgresos(prev => [e, ...prev])
        toast('Egreso registrado')
      }
      setEgresoModal(false)
    } catch { toast('Error al guardar', 'error') }
    setSaving(false)
  }

  async function removeEgreso(id: string) {
    if (!confirm('¿Eliminar este egreso?')) return
    await deleteEgreso(id)
    setEgresos(prev => prev.filter(e => e.id !== id))
    toast('Egreso eliminado')
  }

  // ── CRUD Cobranzas OS ──────────────────────────────────────────────────────
  function openCobCreate() { setCobForm(COB_DEFAULT); setCobranzaEdit(null); setCobranzaModal(true) }
  function openCobEdit(c: CobranzaOS) {
    setCobForm({ servicio_id: c.servicio_id, obra_social: c.obra_social, codigo_prestacion: c.codigo_prestacion ?? '', arancel: String(c.arancel), monto_presentado: String(c.monto_presentado), fecha_presentacion: c.fecha_presentacion ?? '', fecha_cobro_estimada: c.fecha_cobro_estimada ?? '', fecha_cobro_real: c.fecha_cobro_real ?? '', estado: c.estado, notas: c.notas ?? '' })
    setCobranzaEdit(c); setCobranzaModal(true)
  }

  async function saveCob() {
    if (!cobForm.obra_social || !cobForm.monto_presentado) { toast('Completá obra social y monto', 'error'); return }
    setSaving(true)
    try {
      const payload = { servicio_id: cobForm.servicio_id, obra_social: cobForm.obra_social, codigo_prestacion: cobForm.codigo_prestacion, arancel: Number(cobForm.arancel), monto_presentado: Number(cobForm.monto_presentado), fecha_presentacion: cobForm.fecha_presentacion || undefined, fecha_cobro_estimada: cobForm.fecha_cobro_estimada || undefined, fecha_cobro_real: cobForm.fecha_cobro_real || undefined, estado: cobForm.estado, notas: cobForm.notas }
      if (cobranzaEdit) {
        await updateCobranzaOS(cobranzaEdit.id, payload)
        setCobranzas(prev => prev.map(c => c.id === cobranzaEdit.id ? { ...c, ...payload } : c))
        toast('Cobranza actualizada')
      } else {
        const c = await createCobranzaOS(payload)
        setCobranzas(prev => [c, ...prev])
        toast('Cobranza registrada')
      }
      setCobranzaModal(false)
    } catch { toast('Error al guardar', 'error') }
    setSaving(false)
  }

  async function removeCob(id: string) {
    if (!confirm('¿Eliminar esta cobranza?')) return
    await deleteCobranzaOS(id)
    setCobranzas(prev => prev.filter(c => c.id !== id))
    toast('Eliminado')
  }

  async function marcarCobrado(c: CobranzaOS) {
    const fecha = new Date().toISOString().slice(0, 10)
    await updateCobranzaOS(c.id, { estado: 'COBRADO', fecha_cobro_real: fecha })
    setCobranzas(prev => prev.map(x => x.id === c.id ? { ...x, estado: 'COBRADO', fecha_cobro_real: fecha } : x))
    toast('Marcada como cobrada')
  }

  // ── CRUD Gastos Fijos ──────────────────────────────────────────────────────
  function openGFCreate() { setGfForm(GF_DEFAULT); setGastoFijoEdit(null); setGastoFijoModal(true) }
  function openGFEdit(g: GastoFijo) {
    setGfForm({ nombre: g.nombre, tipo: g.tipo, monto_mensual: String(g.monto_mensual), activo: g.activo, notas: g.notas ?? '' })
    setGastoFijoEdit(g); setGastoFijoModal(true)
  }

  async function saveGF() {
    if (!gfForm.nombre || !gfForm.monto_mensual) { toast('Completá nombre y monto', 'error'); return }
    setSaving(true)
    try {
      const payload = { nombre: gfForm.nombre, tipo: gfForm.tipo, monto_mensual: Number(gfForm.monto_mensual), activo: gfForm.activo, notas: gfForm.notas }
      if (gastoFijoEdit) {
        await updateGastoFijo(gastoFijoEdit.id, payload)
        setGastosFijos(prev => prev.map(g => g.id === gastoFijoEdit.id ? { ...g, ...payload } : g))
        toast('Gasto fijo actualizado')
      } else {
        const g = await createGastoFijo(payload)
        setGastosFijos(prev => [...prev, g])
        toast('Gasto fijo agregado')
      }
      setGastoFijoModal(false)
    } catch { toast('Error al guardar', 'error') }
    setSaving(false)
  }

  async function removeGF(id: string) {
    if (!confirm('¿Eliminar este gasto fijo?')) return
    await deleteGastoFijo(id)
    setGastosFijos(prev => prev.filter(g => g.id !== id))
    toast('Eliminado')
  }

  // ── Export Excel ───────────────────────────────────────────────────────────
  function exportar() {
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(egresos.map(e => ({ Fecha: e.fecha, Tipo: e.tipo, Descripcion: e.descripcion, Proveedor: e.proveedor, Monto: e.monto, Comprobante: e.comprobante }))), 'Egresos')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cobranzas.map(c => ({ 'Obra Social': c.obra_social, Arancel: c.arancel, Presentado: c.monto_presentado, Estado: c.estado, 'F. Presentacion': c.fecha_presentacion, 'F. Cobro': c.fecha_cobro_real }))), 'Cobranzas OS')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(gastosFijos.map(g => ({ Nombre: g.nombre, Tipo: g.tipo, Mensual: g.monto_mensual, Activo: g.activo }))), 'Gastos Fijos')
    XLSX.writeFile(wb, `finanzas-${mesFiltro}.xlsx`)
  }

  const PIE_COLORS = ['#1A1410','#8B6914','#2A6B3A','#1A4A7A','#7A1A2A','#4A1A7A','#6B5E4A','#9E9280']

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-white border border-brand-100 rounded-xl p-1 w-full overflow-x-auto">
        {([
          ['dashboard','Dashboard'],['egresos','Egresos'],
          ['cobranzas_os','Cobranzas OS'],['gastos_fijos','Gastos fijos'],['rentabilidad','Rentabilidad'],
        ] as [Tab, string][]).map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm rounded-lg transition-all whitespace-nowrap ${tab === t ? 'bg-brand-900 text-white' : 'text-brand-500 hover:bg-brand-50'}`}>
            {l}
          </button>
        ))}
        <div className="flex-1" />
        <button className="btn btn-sm btn-gold" onClick={exportar}><Download size={13} /> Excel</button>
      </div>

      {/* Selector de mes */}
      {tab !== 'rentabilidad' && tab !== 'gastos_fijos' && (
        <div className="flex items-center gap-2 mb-4">
          <label className="text-xs text-brand-400 uppercase tracking-wider">Período</label>
          <select className="input w-auto text-sm" value={mesFiltro} onChange={e => setMesFiltro(e.target.value)}>
            {[currentMes, ...mesesDisponibles.filter(m => m !== currentMes)].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      )}

      {/* ── DASHBOARD ────────────────────────────────────────────────────── */}
      {tab === 'dashboard' && (
        <>
          {/* KPIs del mes */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <StatCard label="Facturado" value={fmtMoneyShort(facturadoMes)} sub={`${serviciosDelMes.length} servicios`} variant="gold" icon={<TrendingUp size={16} />} />
            <StatCard label="Cobrado" value={fmtMoneyShort(cobradoMes)} sub={`${facturadoMes ? Math.round(cobradoMes / facturadoMes * 100) : 0}% del facturado`} />
            <StatCard label="Egresos" value={fmtMoneyShort(totalEgresosMes)} sub={`Fijos: ${fmtMoneyShort(totalGastosFijosActivos)}`} variant={totalEgresosMes > cobradoMes ? 'danger' : 'default'} icon={<TrendingDown size={16} />} />
            <StatCard label="Resultado neto" value={fmtMoneyShort(resultadoMes)} sub="cobrado − egresos" variant={resultadoMes >= 0 ? 'default' : 'danger'} />
          </div>

          {/* Segunda fila KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <StatCard label="Pendiente familias" value={fmtMoneyShort(pendienteFamilias)} variant={pendienteFamilias > 0 ? 'danger' : 'default'} />
            <StatCard label="Pendiente OS" value={fmtMoneyShort(pendienteOS)} variant={pendienteOS > 0 ? 'warn' : 'default'} />
            <StatCard label="Valor stock" value={fmtMoneyShort(valorStock)} sub={`${stock.length} ítems`} />
            <StatCard label="Gastos fijos/mes" value={fmtMoneyShort(totalGastosFijosActivos)} sub={`${gastosFijos.filter(g => g.activo).length} conceptos activos`} />
          </div>

          {/* Alerta resultado negativo */}
          {resultadoMes < 0 && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-red-700 text-sm">
              <AlertTriangle size={16} className="shrink-0" />
              <span>Resultado negativo en {mesFiltro}: los egresos superan lo cobrado por {fmtMoney(Math.abs(resultadoMes))}</span>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            {/* Evolución 6 meses */}
            <div className="card">
              <h3 className="font-serif text-lg mb-4">Evolución últimos 6 meses</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={datosMensuales} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradFact" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B6914" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B6914" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradCob" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2A6B3A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2A6B3A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => fmtMoneyShort(v)} />
                  <Tooltip formatter={(v: number, n: string) => [fmtMoney(v), n === 'facturado' ? 'Facturado' : n === 'cobrado' ? 'Cobrado' : 'Egresos']} />
                  <Area type="monotone" dataKey="facturado" stroke="#8B6914" fill="url(#gradFact)" strokeWidth={2} />
                  <Area type="monotone" dataKey="cobrado" stroke="#2A6B3A" fill="url(#gradCob)" strokeWidth={2} />
                  <Area type="monotone" dataKey="egresos" stroke="#7A1A2A" fill="none" strokeWidth={1.5} strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 justify-center text-xs text-brand-400">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-gold-500 inline-block"></span>Facturado</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-700 inline-block"></span>Cobrado</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-700 inline-block"></span>Egresos</span>
              </div>
            </div>

            {/* Composición egresos */}
            <div className="card">
              <h3 className="font-serif text-lg mb-4">Composición de egresos</h3>
              {egresoPorTipo.length === 0 ? (
                <p className="text-sm text-brand-400 text-center py-8">Sin egresos en este período</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={egresoPorTipo} dataKey="monto" nameKey="tipo" cx="40%" cy="50%" outerRadius={80} label={({ tipo, percent }) => `${percent > 0.05 ? tipo : ''}`} labelLine={false}>
                      {egresoPorTipo.map((entry, i) => (
                        <Cell key={i} fill={EGRESO_COLORS[entry.tipo as TipoEgreso] ?? PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmtMoney(v)} />
                    <Legend formatter={v => v} layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Pendientes urgentes */}
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="font-serif text-lg mb-3">Saldos pendientes — Familias</h3>
              {servicios.filter(s => (s.val_saldo ?? 0) > 0).length === 0
                ? <p className="text-sm text-brand-400 text-center py-4">Sin pendientes ✓</p>
                : servicios.filter(s => (s.val_saldo ?? 0) > 0).slice(0, 5).map(s => (
                  <div key={s.id} className="flex items-center gap-2 py-2 border-b border-brand-50 last:border-0 text-sm">
                    <DollarSign size={13} className="text-red-400 shrink-0" />
                    <span className="flex-1 truncate">{s.ext_apellido}, {s.ext_nombre}</span>
                    <span className="text-xs text-brand-400">{fmtDate(s.fecha_servicio)}</span>
                    <span className="font-semibold text-red-700">{fmtMoney(s.val_saldo)}</span>
                  </div>
                ))
              }
            </div>
            <div className="card">
              <h3 className="font-serif text-lg mb-3">Cobranzas OS pendientes</h3>
              {cobranzas.filter(c => c.estado !== 'COBRADO' && c.estado !== 'INCOBRABLE').length === 0
                ? <p className="text-sm text-brand-400 text-center py-4">Sin pendientes ✓</p>
                : cobranzas.filter(c => c.estado !== 'COBRADO' && c.estado !== 'INCOBRABLE').slice(0, 5).map(c => (
                  <div key={c.id} className="flex items-center gap-2 py-2 border-b border-brand-50 last:border-0 text-sm">
                    <Building2 size={13} className="text-amber-500 shrink-0" />
                    <span className="flex-1 truncate">{c.obra_social}</span>
                    <Badge variant={COBRO_BADGE[c.estado]}>{c.estado}</Badge>
                    <span className="font-semibold text-amber-700">{fmtMoney(c.monto_presentado)}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </>
      )}

      {/* ── EGRESOS ───────────────────────────────────────────────────────── */}
      {tab === 'egresos' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-brand-400">{egresosDelMes.length} egresos · Total: <strong>{fmtMoney(egresosVarMes)}</strong></p>
              <p className="text-xs text-brand-400">+ {fmtMoney(totalGastosFijosActivos)} gastos fijos = <strong>{fmtMoney(totalEgresosMes)}</strong> total del período</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={openEgresoCreate}><Plus size={14} /> Registrar egreso</button>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-head">
                  <th className="text-left py-2 px-3">Fecha</th>
                  <th className="text-left py-2 px-3">Tipo</th>
                  <th className="text-left py-2 px-3">Descripción</th>
                  <th className="text-left py-2 px-3">Proveedor</th>
                  <th className="text-right py-2 px-3">Monto</th>
                  <th className="py-2 px-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {egresosDelMes.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-brand-400">Sin egresos en este período</td></tr>
                )}
                {egresosDelMes.map(e => (
                  <tr key={e.id} className="table-row">
                    <td className="py-3 px-3">{fmtDate(e.fecha)}</td>
                    <td className="py-3 px-3">
                      <span className="badge bg-brand-100 text-brand-700 text-xs">{e.tipo}</span>
                    </td>
                    <td className="py-3 px-3 font-medium">{e.descripcion}</td>
                    <td className="py-3 px-3 text-brand-400 text-xs">{e.proveedor || '—'}</td>
                    <td className="py-3 px-3 text-right font-semibold text-red-700">{fmtMoney(e.monto)}</td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEgresoEdit(e)} className="text-brand-400 hover:text-brand-700 p-1"><Edit2 size={13} /></button>
                        <button onClick={() => removeEgreso(e.id)} className="text-brand-400 hover:text-red-700 p-1"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {egresosDelMes.length > 0 && (
                  <tr className="bg-brand-50 font-semibold">
                    <td colSpan={4} className="py-3 px-3 text-right text-brand-500 text-xs uppercase tracking-wider">Total egresos variables</td>
                    <td className="py-3 px-3 text-right text-red-700">{fmtMoney(egresosVarMes)}</td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── COBRANZAS OS ─────────────────────────────────────────────────── */}
      {tab === 'cobranzas_os' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-brand-400">
                Pendiente: <strong className="text-amber-700">{fmtMoney(pendienteOS)}</strong> ·
                Cobrado: <strong className="text-green-700">{fmtMoney(cobranzas.filter(c => c.estado === 'COBRADO').reduce((a, c) => a + c.monto_presentado, 0))}</strong>
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={openCobCreate}><Plus size={14} /> Nueva cobranza</button>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-head">
                  <th className="text-left py-2 px-3">Obra social</th>
                  <th className="text-left py-2 px-3">Cód. prestación</th>
                  <th className="text-right py-2 px-3">Arancel OS</th>
                  <th className="text-right py-2 px-3">Presentado</th>
                  <th className="text-left py-2 px-3">F. presentación</th>
                  <th className="text-left py-2 px-3">Estado</th>
                  <th className="py-2 px-3 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {cobranzas.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-brand-400">Sin cobranzas registradas</td></tr>
                )}
                {cobranzas.map(c => (
                  <tr key={c.id} className="table-row">
                    <td className="py-3 px-3 font-medium">{c.obra_social}</td>
                    <td className="py-3 px-3 text-brand-400 text-xs">{c.codigo_prestacion || '—'}</td>
                    <td className="py-3 px-3 text-right text-brand-600">{fmtMoney(c.arancel)}</td>
                    <td className="py-3 px-3 text-right font-semibold">{fmtMoney(c.monto_presentado)}</td>
                    <td className="py-3 px-3 text-brand-400 text-xs">{fmtDate(c.fecha_presentacion)}</td>
                    <td className="py-3 px-3">
                      <Badge variant={c.estado === 'COBRADO' ? 'success' : c.estado === 'INCOBRABLE' ? 'danger' : c.estado === 'PRESENTADO' ? 'info' as never : 'warn'}>
                        {c.estado}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1">
                        {c.estado !== 'COBRADO' && (
                          <button onClick={() => marcarCobrado(c)} className="text-brand-400 hover:text-green-700 p-1" title="Marcar cobrado"><CheckCircle size={13} /></button>
                        )}
                        <button onClick={() => openCobEdit(c)} className="text-brand-400 hover:text-brand-700 p-1"><Edit2 size={13} /></button>
                        <button onClick={() => removeCob(c.id)} className="text-brand-400 hover:text-red-700 p-1"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── GASTOS FIJOS ─────────────────────────────────────────────────── */}
      {tab === 'gastos_fijos' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-brand-400">
              Total mensual activo: <strong>{fmtMoney(totalGastosFijosActivos)}</strong>
            </p>
            <button className="btn btn-primary btn-sm" onClick={openGFCreate}><Plus size={14} /> Agregar gasto fijo</button>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-head">
                  <th className="text-left py-2 px-3">Concepto</th>
                  <th className="text-left py-2 px-3">Tipo</th>
                  <th className="text-right py-2 px-3">Mensual</th>
                  <th className="text-right py-2 px-3">Anual</th>
                  <th className="text-center py-2 px-3">Estado</th>
                  <th className="py-2 px-3 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {gastosFijos.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-brand-400">Sin gastos fijos registrados</td></tr>
                )}
                {gastosFijos.map(g => (
                  <tr key={g.id} className={`table-row ${!g.activo ? 'opacity-50' : ''}`}>
                    <td className="py-3 px-3 font-medium">{g.nombre}</td>
                    <td className="py-3 px-3"><span className="badge bg-brand-100 text-brand-700 text-xs">{g.tipo}</span></td>
                    <td className="py-3 px-3 text-right font-semibold">{fmtMoney(g.monto_mensual)}</td>
                    <td className="py-3 px-3 text-right text-brand-400">{fmtMoney(g.monto_mensual * 12)}</td>
                    <td className="py-3 px-3 text-center">
                      <Badge variant={g.activo ? 'success' : 'default'}>{g.activo ? 'Activo' : 'Inactivo'}</Badge>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1">
                        <button onClick={() => openGFEdit(g)} className="text-brand-400 hover:text-brand-700 p-1"><Edit2 size={13} /></button>
                        <button onClick={() => removeGF(g.id)} className="text-brand-400 hover:text-red-700 p-1"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {gastosFijos.filter(g => g.activo).length > 0 && (
                  <tr className="bg-brand-50 font-semibold">
                    <td colSpan={2} className="py-3 px-3 text-right text-brand-500 text-xs uppercase tracking-wider">Total activos</td>
                    <td className="py-3 px-3 text-right text-brand-900">{fmtMoney(totalGastosFijosActivos)}</td>
                    <td className="py-3 px-3 text-right text-brand-900">{fmtMoney(totalGastosFijosActivos * 12)}</td>
                    <td colSpan={2} />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── RENTABILIDAD ─────────────────────────────────────────────────── */}
      {tab === 'rentabilidad' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <StatCard label="Ticket promedio" value={fmtMoneyShort(servicios.length ? servicios.reduce((a, s) => a + (s.val_total_impuestos ?? 0), 0) / servicios.filter(s => s.val_total_impuestos).length : 0)} />
            <StatCard label="Cremación promedio" value={fmtMoneyShort(servicios.filter(s => s.destino === 'CREMACIÓN' && s.val_total_impuestos).reduce((a, s, _, arr) => a + (s.val_total_impuestos ?? 0) / arr.length, 0))} />
            <StatCard label="Inhumación promedio" value={fmtMoneyShort(servicios.filter(s => s.destino === 'INHUMACIÓN' && s.val_total_impuestos).reduce((a, s, _, arr) => a + (s.val_total_impuestos ?? 0) / arr.length, 0))} />
            <StatCard label="Servicios con OS" value={`${servicios.filter(s => s.cobertura !== 'PARTICULAR').length}`} sub={`de ${servicios.length} totales`} />
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            {/* Servicios por mes (barras) */}
            <div className="card">
              <h3 className="font-serif text-lg mb-4">Servicios por mes (6 meses)</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={datosMensuales}>
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="servicios" name="Servicios" fill="#8B6914" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Cremación vs Inhumación */}
            <div className="card">
              <h3 className="font-serif text-lg mb-4">Cremación vs Inhumación</h3>
              <div className="flex flex-col gap-3 pt-2">
                {(['CREMACIÓN', 'INHUMACIÓN'] as const).map(d => {
                  const svcs = servicios.filter(s => s.destino === d)
                  const fact = svcs.reduce((a, s) => a + (s.val_total_impuestos ?? 0), 0)
                  const pct = servicios.length ? Math.round(svcs.length / servicios.length * 100) : 0
                  return (
                    <div key={d}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{d}</span>
                        <span className="text-brand-400">{svcs.length} servicios · {fmtMoneyShort(fact)}</span>
                      </div>
                      <div className="bg-brand-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${d === 'CREMACIÓN' ? 'bg-blue-600' : 'bg-green-600'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-brand-400 mt-0.5">{pct}% del total</p>
                    </div>
                  )
                })}
                <div className="divider" />
                {(['PARTICULAR', 'OBRA SOCIAL', 'MUTUAL', 'PREPAGA'] as const).map(c => {
                  const svcs = servicios.filter(s => s.cobertura === c)
                  if (!svcs.length) return null
                  const pct = servicios.length ? Math.round(svcs.length / servicios.length * 100) : 0
                  return (
                    <div key={c} className="flex items-center gap-3 text-sm">
                      <span className="flex-1 text-brand-700">{c}</span>
                      <span className="text-brand-400 text-xs">{svcs.length} svc</span>
                      <div className="w-24 bg-brand-100 rounded-full h-1.5">
                        <div className="bg-gold-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-brand-400 w-8 text-right">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Top rentabilidad por servicio */}
          <div className="card">
            <h3 className="font-serif text-lg mb-4">Margen por servicio (top 10)</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="table-head">
                  <th className="text-left py-2 px-3">Servicio</th>
                  <th className="text-left py-2 px-3">Destino</th>
                  <th className="text-right py-2 px-3">Facturado</th>
                  <th className="text-right py-2 px-3">Egresos asoc.</th>
                  <th className="text-right py-2 px-3">Margen</th>
                  <th className="text-right py-2 px-3">%</th>
                </tr>
              </thead>
              <tbody>
                {rentabilidadPorServicio.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-6 text-brand-400">Sin datos suficientes</td></tr>
                )}
                {rentabilidadPorServicio.map(s => (
                  <tr key={s.id} className="table-row">
                    <td className="py-3 px-3 font-medium">{s.ext_apellido}, {s.ext_nombre}</td>
                    <td className="py-3 px-3">
                      <Badge variant={s.destino === 'CREMACIÓN' ? 'info' : 'success'}>{s.destino}</Badge>
                    </td>
                    <td className="py-3 px-3 text-right">{fmtMoney(s.val_total_impuestos)}</td>
                    <td className="py-3 px-3 text-right text-red-600">{fmtMoney(s.egresos_asoc)}</td>
                    <td className="py-3 px-3 text-right font-semibold text-green-700">{fmtMoney(s.margen)}</td>
                    <td className="py-3 px-3 text-right">
                      <span className={`badge ${s.pct_margen >= 50 ? 'bg-green-50 text-green-700' : s.pct_margen >= 30 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                        {s.pct_margen}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-brand-400 mt-3">* El margen se calcula sobre egresos registrados y asociados al servicio. Para mayor precisión, asociá los egresos variables a cada servicio.</p>
          </div>
        </>
      )}

      {/* ── MODALES ───────────────────────────────────────────────────────── */}

      {/* Modal Egreso */}
      <Modal open={egresoModal} onClose={() => setEgresoModal(false)} title={egresoEdit ? 'Editar egreso' : 'Registrar egreso'} maxWidth="max-w-lg">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha"><input type="date" className="input" value={egresoForm.fecha} onChange={e => setEgresoForm(p => ({ ...p, fecha: e.target.value }))} /></Field>
          <Field label="Tipo">
            <select className="input" value={egresoForm.tipo} onChange={e => setEgresoForm(p => ({ ...p, tipo: e.target.value as TipoEgreso }))}>
              {TIPOS_EGRESO.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Descripción" className="col-span-2"><input className="input" value={egresoForm.descripcion} onChange={e => setEgresoForm(p => ({ ...p, descripcion: e.target.value }))} placeholder="Detalle del gasto" /></Field>
          <Field label="Proveedor"><input className="input" value={egresoForm.proveedor} onChange={e => setEgresoForm(p => ({ ...p, proveedor: e.target.value }))} placeholder="Nombre del proveedor" /></Field>
          <Field label="Monto"><input type="number" className="input" value={egresoForm.monto} onChange={e => setEgresoForm(p => ({ ...p, monto: e.target.value }))} placeholder="0" /></Field>
          <Field label="Comprobante"><input className="input" value={egresoForm.comprobante} onChange={e => setEgresoForm(p => ({ ...p, comprobante: e.target.value }))} placeholder="N° factura / recibo" /></Field>
          <Field label="Asociar a servicio (opcional)">
            <select className="input" value={egresoForm.servicio_id} onChange={e => setEgresoForm(p => ({ ...p, servicio_id: e.target.value }))}>
              <option value="">— Sin asociar —</option>
              {servicios.slice(0, 50).map(s => <option key={s.id} value={s.id}>#{s.nro_orden} {s.ext_apellido}</option>)}
            </select>
          </Field>
          <Field label="Notas" className="col-span-2"><textarea className="input" rows={2} value={egresoForm.notas} onChange={e => setEgresoForm(p => ({ ...p, notas: e.target.value }))} /></Field>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn" onClick={() => setEgresoModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={saveEgreso} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </Modal>

      {/* Modal Cobranza OS */}
      <Modal open={cobranzaModal} onClose={() => setCobranzaModal(false)} title={cobranzaEdit ? 'Editar cobranza' : 'Nueva cobranza OS'} maxWidth="max-w-lg">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Obra social / Mutual" className="col-span-2"><input className="input" value={cobForm.obra_social} onChange={e => setCobForm(p => ({ ...p, obra_social: e.target.value }))} placeholder="Nombre de la OS" /></Field>
          <Field label="Código prestación"><input className="input" value={cobForm.codigo_prestacion} onChange={e => setCobForm(p => ({ ...p, codigo_prestacion: e.target.value }))} placeholder="Código" /></Field>
          <Field label="Estado">
            <select className="input" value={cobForm.estado} onChange={e => setCobForm(p => ({ ...p, estado: e.target.value as EstadoCobro }))}>
              {ESTADOS_COBRO.map(e => <option key={e}>{e}</option>)}
            </select>
          </Field>
          <Field label="Arancel OS"><input type="number" className="input" value={cobForm.arancel} onChange={e => setCobForm(p => ({ ...p, arancel: e.target.value }))} placeholder="Lo que paga la OS" /></Field>
          <Field label="Monto presentado"><input type="number" className="input" value={cobForm.monto_presentado} onChange={e => setCobForm(p => ({ ...p, monto_presentado: e.target.value }))} placeholder="Lo que se presentó" /></Field>
          <Field label="Fecha presentación"><input type="date" className="input" value={cobForm.fecha_presentacion} onChange={e => setCobForm(p => ({ ...p, fecha_presentacion: e.target.value }))} /></Field>
          <Field label="Fecha cobro estimada"><input type="date" className="input" value={cobForm.fecha_cobro_estimada} onChange={e => setCobForm(p => ({ ...p, fecha_cobro_estimada: e.target.value }))} /></Field>
          <Field label="Fecha cobro real"><input type="date" className="input" value={cobForm.fecha_cobro_real} onChange={e => setCobForm(p => ({ ...p, fecha_cobro_real: e.target.value }))} /></Field>
          <Field label="Servicio asociado">
            <select className="input" value={cobForm.servicio_id} onChange={e => setCobForm(p => ({ ...p, servicio_id: e.target.value }))}>
              <option value="">— Sin asociar —</option>
              {servicios.filter(s => s.cobertura !== 'PARTICULAR').slice(0, 50).map(s => <option key={s.id} value={s.id}>#{s.nro_orden} {s.ext_apellido}</option>)}
            </select>
          </Field>
          <Field label="Notas" className="col-span-2"><textarea className="input" rows={2} value={cobForm.notas} onChange={e => setCobForm(p => ({ ...p, notas: e.target.value }))} /></Field>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn" onClick={() => setCobranzaModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={saveCob} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </Modal>

      {/* Modal Gasto Fijo */}
      <Modal open={gastoFijoModal} onClose={() => setGastoFijoModal(false)} title={gastoFijoEdit ? 'Editar gasto fijo' : 'Nuevo gasto fijo'} maxWidth="max-w-md">
        <div className="flex flex-col gap-3">
          <Field label="Concepto"><input className="input" value={gfForm.nombre} onChange={e => setGfForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Alquiler sede Boulogne" /></Field>
          <Field label="Tipo">
            <select className="input" value={gfForm.tipo} onChange={e => setGfForm(p => ({ ...p, tipo: e.target.value as TipoEgreso }))}>
              {TIPOS_EGRESO.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Monto mensual"><input type="number" className="input" value={gfForm.monto_mensual} onChange={e => setGfForm(p => ({ ...p, monto_mensual: e.target.value }))} placeholder="0" /></Field>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={gfForm.activo} onChange={e => setGfForm(p => ({ ...p, activo: e.target.checked }))} className="accent-brand-900 w-4 h-4" />
            Activo (se incluye en el cálculo mensual)
          </label>
          <Field label="Notas"><textarea className="input" rows={2} value={gfForm.notas} onChange={e => setGfForm(p => ({ ...p, notas: e.target.value }))} /></Field>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn" onClick={() => setGastoFijoModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={saveGF} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </Modal>
    </>
  )
}
