'use client'
import { useState, useMemo, useRef } from 'react'
import type { CostoServicio } from '@/types'
import { createCosto, updateCosto, deleteCosto, bulkInsertCostos, getCostos, getCostosCount } from '@/lib/db'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { StatCard } from '@/components/ui/StatCard'
import { useToast } from '@/components/ui/ToastProvider'
import { fmtDate, fmtMoney, fmtMoneyShort } from '@/lib/utils'
import * as XLSX from 'xlsx'
import {
  Plus, Trash2, Edit2, Upload, Download, Search,
  TrendingUp, TrendingDown, AlertTriangle,
  ChevronLeft, ChevronRight, LayoutGrid, Table2, ChevronDown, ChevronUp
} from 'lucide-react'

const CAMPOS_COSTO = [
  { key: 'costo_ataud',         label: 'Ataúd',          color: '#1A1410' },
  { key: 'costo_comedor',       label: 'Comedor',         color: '#3D3228' },
  { key: 'costo_azafata',       label: 'Azafata',         color: '#6B5E4A' },
  { key: 'costo_cafeteria',     label: 'Cafetería',       color: '#8B6914' },
  { key: 'costo_tanatopraxia',  label: 'Tanatopraxia',   color: '#9E9280' },
  { key: 'costo_ambulancia',    label: 'Ambulancia',      color: '#2A6B3A' },
  { key: 'costo_mat_calle',     label: 'Mat. Calle',      color: '#1A4A7A' },
  { key: 'costo_sellado',       label: 'Sellado',         color: '#7A1A2A' },
  { key: 'costo_soldado',       label: 'Soldado',         color: '#4A1A7A' },
  { key: 'costo_labor',         label: 'Labor',           color: '#7A5A1A' },
  { key: 'costo_sueldos',       label: 'Sueldos',         color: '#1A5A5A' },
  { key: 'costo_mortaja',       label: 'Mortaja',         color: '#5A1A1A' },
  { key: 'costo_urna',          label: 'Urna',            color: '#1A3A5A' },
  { key: 'costo_cementerio',    label: 'Cementerio',      color: '#3A5A1A' },
  { key: 'costo_administrativo',label: 'Administrativo',  color: '#5A3A1A' },
  { key: 'iva_ganado',          label: 'IVA Ganado',      color: '#8B6914' },
  { key: 'propina',             label: 'Propina',         color: '#6B5E4A' },
] as const

type CampoKey = typeof CAMPOS_COSTO[number]['key']

const EMPTY: Omit<CostoServicio, 'id' | 'created_at'> = {
  nro_servicio: '', nro_mes: undefined, fecha: new Date().toISOString().slice(0, 10),
  fallecido: '', tipo: '', servicio_id: undefined,
  costo_ataud: undefined, costo_comedor: undefined, costo_azafata: undefined,
  costo_cafeteria: undefined, costo_tanatopraxia: undefined, costo_ambulancia: undefined,
  costo_mat_calle: undefined, costo_sellado: undefined, costo_soldado: undefined,
  costo_labor: undefined, costo_sueldos: undefined, costo_mortaja: undefined,
  costo_urna: undefined, costo_cementerio: undefined, costo_administrativo: undefined,
  iva_ganado: undefined, propina: undefined,
  costo_total: undefined, nro_facturacion: '', facturacion: undefined,
  valor_servicio: undefined, margen: undefined, margen_pct: undefined, notas: ''
}

const PAGE_SIZE = 100

const EXCEL_MAP: Record<string, keyof Omit<CostoServicio, 'id' | 'created_at'>> = {
  'serv n°': 'nro_servicio', 'serv nro': 'nro_servicio', 'nro': 'nro_servicio', 'n°': 'nro_servicio',
  'serv mes': 'nro_mes', 'mes': 'nro_mes',
  'fecha': 'fecha', 'fallecido': 'fallecido', 'tipo': 'tipo',
  'ataud': 'costo_ataud', 'ataúd': 'costo_ataud',
  'comedor': 'costo_comedor', 'azafata': 'costo_azafata',
  'cafeteria': 'costo_cafeteria', 'cafetería': 'costo_cafeteria',
  'tanatopraxia': 'costo_tanatopraxia', 'tanatop': 'costo_tanatopraxia',
  'ambulancia': 'costo_ambulancia', 'ambul': 'costo_ambulancia',
  'mat calle': 'costo_mat_calle', 'mat. calle': 'costo_mat_calle', 'matcalle': 'costo_mat_calle',
  'sellado': 'costo_sellado', 'soldado': 'costo_soldado',
  'labor': 'costo_labor', 'labrar': 'costo_labor',
  'sueldos': 'costo_sueldos', 'mortaja': 'costo_mortaja', 'urna': 'costo_urna',
  'cementerio': 'costo_cementerio', 'cementer': 'costo_cementerio',
  'administr': 'costo_administrativo', 'administrativo': 'costo_administrativo', 'admin': 'costo_administrativo',
  'iva ganado': 'iva_ganado', 'iva ganan': 'iva_ganado', 'iva': 'iva_ganado',
  'propina': 'propina',
  'costo': 'costo_total', 'costo total': 'costo_total',
  'nro factu': 'nro_facturacion', 'n° factura': 'nro_facturacion',
  'facturacion': 'facturacion', 'facturación': 'facturacion',
  'valor servicio': 'valor_servicio', 'valor': 'valor_servicio',
}

function calcTotales(form: Omit<CostoServicio, 'id' | 'created_at'>) {
  const costo_total = CAMPOS_COSTO.reduce((s, { key }) => s + (Number((form as Record<string,unknown>)[key]) || 0), 0)
  const margen = (form.valor_servicio ?? 0) - costo_total
  const margen_pct = form.valor_servicio ? Math.round(margen / form.valor_servicio * 100) : 0
  return { costo_total, margen, margen_pct }
}

function parseExcelDate(val: unknown): string {
  if (!val) return new Date().toISOString().slice(0, 10)
  if (typeof val === 'number') {
    const d = new Date((val - 25569) * 86400 * 1000)
    return d.toISOString().slice(0, 10)
  }
  if (typeof val === 'string') {
    const m = val.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
    if (m) { const [,d,mo,y] = m; return `${y.length===2?'20'+y:y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}` }
  }
  return new Date().toISOString().slice(0, 10)
}

// ── Card component ──────────────────────────────────────────────────────────
function CostoCard({ c, onEdit, onDelete }: { c: CostoServicio; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const costos = CAMPOS_COSTO.filter(({ key }) => (c as unknown as Record<string,number>)[key] > 0)
  const margenColor = (c.margen_pct ?? 0) >= 40 ? 'text-green-700' : (c.margen_pct ?? 0) >= 20 ? 'text-amber-700' : 'text-red-700'
  const margenBg = (c.margen_pct ?? 0) >= 40 ? 'bg-green-50 border-green-200' : (c.margen_pct ?? 0) >= 20 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'

  return (
    <div className="rounded-xl border overflow-hidden transition-shadow hover:shadow-md" style={{background:'var(--surface)', borderColor:'var(--border)'}}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-brand-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {c.nro_servicio || '#'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{c.fallecido || 'Sin nombre'}</p>
          <p className="text-xs flex gap-2" style={{color:'var(--text3)'}}>
            <span>{fmtDate(c.fecha)}</span>
            {c.nro_mes && <span>· Mes {c.nro_mes}</span>}
            {c.tipo && <span>· {c.tipo}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {c.margen_pct !== undefined && (
            <span className={`badge border text-xs font-semibold ${margenBg} ${margenColor}`}>
              {c.margen_pct}%
            </span>
          )}
          <div className="flex gap-0.5">
            <button onClick={onEdit} className="p-1.5 rounded hover:opacity-70 transition-opacity" style={{color:'var(--text3)'}}><Edit2 size={13} /></button>
            <button onClick={onDelete} className="p-1.5 rounded text-red-400 hover:text-red-700 transition-colors"><Trash2 size={13} /></button>
          </div>
        </div>
      </div>

      {/* Financial summary bar */}
      <div className="grid grid-cols-3 border-t" style={{borderColor:'var(--border)'}}>
        <div className="px-3 py-2 text-center border-r" style={{borderColor:'var(--border)'}}>
          <p className="text-xs mb-0.5" style={{color:'var(--text3)'}}>Costo total</p>
          <p className="text-sm font-semibold">{fmtMoneyShort(c.costo_total)}</p>
        </div>
        <div className="px-3 py-2 text-center border-r" style={{borderColor:'var(--border)'}}>
          <p className="text-xs mb-0.5" style={{color:'var(--text3)'}}>Facturación</p>
          <p className="text-sm font-semibold">{fmtMoneyShort(c.facturacion ?? c.valor_servicio)}</p>
        </div>
        <div className="px-3 py-2 text-center">
          <p className="text-xs mb-0.5" style={{color:'var(--text3)'}}>Margen</p>
          <p className={`text-sm font-semibold ${margenColor}`}>{fmtMoneyShort(c.margen)}</p>
        </div>
      </div>

      {/* Desglose de costos */}
      {costos.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-4 py-2 text-xs flex items-center justify-between border-t transition-colors hover:opacity-70"
            style={{color:'var(--text3)', borderColor:'var(--border)', background:'var(--surface2)'}}
          >
            <span>Ver desglose ({costos.length} ítems)</span>
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {expanded && (
            <div className="px-4 py-3 border-t grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2" style={{borderColor:'var(--border)'}}>
              {costos.map(({ key, label }) => (
                <div key={key} className="flex justify-between items-center text-xs">
                  <span style={{color:'var(--text3)'}}>{label}</span>
                  <span className="font-medium">{fmtMoneyShort((c as unknown as Record<string,number>)[key])}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function CostosView({ initialCostos, totalCount }: { initialCostos: CostoServicio[]; totalCount: number }) {
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const [costos, setCostos] = useState(initialCostos)
  const [total, setTotal] = useState(totalCount)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  const [q, setQ] = useState('')
  const [mesFiltro, setMesFiltro] = useState('')

  const [modal, setModal] = useState(false)
  const [editTarget, setEditTarget] = useState<CostoServicio | null>(null)
  const [form, setForm] = useState<Omit<CostoServicio, 'id' | 'created_at'>>(EMPTY)
  const [saving, setSaving] = useState(false)

  const [importModal, setImportModal] = useState(false)
  const [importData, setImportData] = useState<Omit<CostoServicio, 'id' | 'created_at'>[]>([])
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)

  const filtered = useMemo(() => costos.filter(c => {
    const matchQ = !q || `${c.fallecido} ${c.nro_servicio} ${c.tipo}`.toLowerCase().includes(q.toLowerCase())
    const matchM = !mesFiltro || c.fecha?.startsWith(mesFiltro)
    return matchQ && matchM
  }), [costos, q, mesFiltro])

  const totalFacturacion = useMemo(() => costos.reduce((a, c) => a + (c.facturacion ?? c.valor_servicio ?? 0), 0), [costos])
  const totalCostos = useMemo(() => costos.reduce((a, c) => a + (c.costo_total ?? 0), 0), [costos])
  const margenTotal = totalFacturacion - totalCostos
  const margenPct = totalFacturacion > 0 ? Math.round(margenTotal / totalFacturacion * 100) : 0

  const meses = useMemo(() => {
    const s = new Set(costos.map(c => c.fecha?.slice(0, 7)).filter(Boolean))
    return Array.from(s).sort().reverse()
  }, [costos])

  async function loadPage(p: number) {
    setLoading(true)
    try {
      const data = await getCostos(PAGE_SIZE, p * PAGE_SIZE)
      setCostos(data)
      setPage(p)
    } catch { toast('Error al cargar', 'error') }
    setLoading(false)
  }

  function openCreate() { setForm(EMPTY); setEditTarget(null); setModal(true) }
  function openEdit(c: CostoServicio) { setForm({ ...c }); setEditTarget(c); setModal(true) }

  function setNum(field: keyof typeof form, val: string) {
    const next = { ...form, [field]: val === '' ? undefined : Number(val) }
    setForm({ ...next, ...calcTotales(next) })
  }

  async function save() {
    if (!form.fecha) { toast('La fecha es requerida', 'error'); return }
    setSaving(true)
    try {
      const payload = { ...form, ...calcTotales(form) }
      if (editTarget) {
        await updateCosto(editTarget.id, payload)
        setCostos(prev => prev.map(c => c.id === editTarget.id ? { ...c, ...payload } : c))
        toast('Actualizado')
      } else {
        const c = await createCosto(payload)
        setCostos(prev => [c, ...prev])
        setTotal(t => t + 1)
        toast('Registrado')
      }
      setModal(false)
    } catch { toast('Error al guardar', 'error') }
    setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar?')) return
    await deleteCosto(id)
    setCostos(prev => prev.filter(c => c.id !== id))
    setTotal(t => t - 1)
    toast('Eliminado')
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'array' })
        const sheetName = wb.SheetNames.find(n => n.toLowerCase().includes('servicio')) ?? wb.SheetNames[0]
        const ws = wb.Sheets[sheetName]
        const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][]

        let headerIdx = 0
        for (let i = 0; i < Math.min(20, rawRows.length); i++) {
          const row = rawRows[i] as string[]
          const rowStr = row.map(c => String(c).toLowerCase()).join(' ')
          if (rowStr.includes('fecha') || rowStr.includes('fallecido') || rowStr.includes('serv')) { headerIdx = i; break }
        }

        const headers = (rawRows[headerIdx] as string[]).map(h => String(h).toLowerCase().trim())
        const dataRows: Omit<CostoServicio, 'id' | 'created_at'>[] = []

        for (let i = headerIdx + 1; i < rawRows.length; i++) {
          const row = rawRows[i] as unknown[]
          if (row.every(v => v === '' || v === null || v === undefined)) continue
          const record: Omit<CostoServicio, 'id' | 'created_at'> = { ...EMPTY }

          headers.forEach((header, colIdx) => {
            const val = row[colIdx]
            if (val === '' || val === null || val === undefined) return
            const mapped = EXCEL_MAP[header] ?? Object.entries(EXCEL_MAP).find(([k]) => header.includes(k) || k.includes(header))?.[1]
            if (!mapped) return
            if (mapped === 'fecha') {
              record.fecha = parseExcelDate(val)
            } else if (mapped === 'nro_mes' || mapped === 'costo_total' || mapped === 'facturacion' || mapped === 'valor_servicio' || mapped === 'iva_ganado' || mapped === 'propina' || (mapped as string).startsWith('costo_')) {
              const n = Number(String(val).replace(/[^0-9.-]/g, ''))
              if (!isNaN(n) && n !== 0) (record as Record<string, unknown>)[mapped] = n
            } else {
              (record as Record<string, unknown>)[mapped] = String(val).trim()
            }
          })

          const tots = calcTotales(record)
          if (!record.costo_total && tots.costo_total > 0) record.costo_total = tots.costo_total
          if (record.valor_servicio) { record.margen = tots.margen; record.margen_pct = tots.margen_pct }
          if (!record.fecha) record.fecha = new Date().toISOString().slice(0, 10)
          dataRows.push(record)
        }

        setImportData(dataRows)
        setImportModal(true)
      } catch (err) {
        console.error(err)
        toast('Error al leer el archivo', 'error')
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  async function confirmImport() {
    setImporting(true); setImportProgress(0)
    try {
      let done = 0
      for (let i = 0; i < importData.length; i += 100) {
        await bulkInsertCostos(importData.slice(i, i + 100))
        done += Math.min(100, importData.length - i)
        setImportProgress(Math.round(done / importData.length * 100))
      }
      toast(`✓ ${importData.length.toLocaleString()} registros importados`)
      setImportModal(false); setImportData([])
      await loadPage(0)
      setTotal(await getCostosCount())
    } catch { toast('Error durante la importación', 'error') }
    setImporting(false); setImportProgress(0)
  }

  function exportExcel() {
    const rows = filtered.map(c => ({
      'N° Servicio': c.nro_servicio, 'N° Mes': c.nro_mes, 'Fecha': c.fecha, 'Fallecido': c.fallecido, 'Tipo': c.tipo,
      'Ataúd': c.costo_ataud, 'Comedor': c.costo_comedor, 'Azafata': c.costo_azafata, 'Cafetería': c.costo_cafeteria,
      'Tanatopraxia': c.costo_tanatopraxia, 'Ambulancia': c.costo_ambulancia, 'Mat. Calle': c.costo_mat_calle,
      'Sellado': c.costo_sellado, 'Soldado': c.costo_soldado, 'Labor': c.costo_labor, 'Sueldos': c.costo_sueldos,
      'Mortaja': c.costo_mortaja, 'Urna': c.costo_urna, 'Cementerio': c.costo_cementerio,
      'Administrativo': c.costo_administrativo, 'IVA Ganado': c.iva_ganado, 'Propina': c.propina,
      'Costo Total': c.costo_total, 'N° Facturación': c.nro_facturacion,
      'Facturación': c.facturacion, 'Valor Servicio': c.valor_servicio, 'Margen': c.margen, 'Margen %': c.margen_pct,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Costos')
    XLSX.writeFile(wb, `cartu-costos-${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const numInp = (field: CampoKey | 'facturacion' | 'valor_servicio') => ({
    type: 'number' as const, className: 'input',
    value: (form as unknown as Record<string,number>)[field as string] ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setNum(field as keyof typeof form, e.target.value),
    placeholder: '0',
  })

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Registros" value={total.toLocaleString('es-AR')} sub={`${filtered.length} en vista`} />
        <StatCard label="Facturación total" value={fmtMoneyShort(totalFacturacion)} variant="gold" />
        <StatCard label="Costos totales" value={fmtMoneyShort(totalCostos)} />
        <StatCard label="Margen neto" value={fmtMoneyShort(margenTotal)} sub={`${margenPct}% promedio`} variant={margenTotal >= 0 ? 'default' : 'danger'} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
          <input className="input pl-8" placeholder="Buscar por fallecido, N° servicio..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select className="input w-auto" value={mesFiltro} onChange={e => setMesFiltro(e.target.value)}>
          <option value="">Todos los períodos</option>
          {meses.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        {/* View toggle */}
        <div className="flex rounded-lg border overflow-hidden" style={{borderColor:'var(--border)'}}>
          <button onClick={() => setViewMode('cards')} className={`px-3 py-2 transition-colors ${viewMode==='cards' ? 'bg-brand-900 text-white' : ''}`} style={viewMode!=='cards'?{background:'var(--surface)',color:'var(--text3)'}:{}}>
            <LayoutGrid size={15} />
          </button>
          <button onClick={() => setViewMode('table')} className={`px-3 py-2 transition-colors ${viewMode==='table' ? 'bg-brand-900 text-white' : ''}`} style={viewMode!=='table'?{background:'var(--surface)',color:'var(--text3)'}:{}}>
            <Table2 size={15} />
          </button>
        </div>
        <button className="btn btn-sm" onClick={exportExcel}><Download size={14} /> Excel</button>
        <button className="btn btn-sm btn-gold" onClick={() => fileRef.current?.click()}><Upload size={14} /> Importar</button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
        <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> Nuevo</button>
      </div>

      <p className="text-xs mb-3" style={{color:'var(--text3)'}}>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''} · {page * PAGE_SIZE + 1}–{Math.min((page+1)*PAGE_SIZE, total)} de {total.toLocaleString()}</p>

      {loading && <div className="text-center py-12" style={{color:'var(--text3)'}}>Cargando...</div>}

      {/* CARDS VIEW */}
      {!loading && viewMode === 'cards' && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.length === 0 && (
            <div className="col-span-3 card text-center py-12" style={{color:'var(--text3)'}}>
              <Upload size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium mb-1">Sin registros</p>
              <p className="text-xs">Importá el Excel histórico o agregá registros manualmente</p>
            </div>
          )}
          {filtered.map(c => (
            <CostoCard key={c.id} c={c} onEdit={() => openEdit(c)} onDelete={() => remove(c.id)} />
          ))}
        </div>
      )}

      {/* TABLE VIEW — compact, horizontal scroll */}
      {!loading && viewMode === 'table' && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{minWidth:'1200px'}}>
              <thead>
                <tr style={{background:'var(--surface2)'}}>
                  <th className="text-left py-2.5 px-3 font-medium sticky left-0 z-10 whitespace-nowrap" style={{background:'var(--surface2)',color:'var(--text3)',borderBottom:'1px solid var(--border)'}}>N° / Fallecido</th>
                  <th className="text-left py-2.5 px-2 font-medium whitespace-nowrap" style={{color:'var(--text3)',borderBottom:'1px solid var(--border)'}}>Fecha</th>
                  <th className="text-left py-2.5 px-2 font-medium whitespace-nowrap" style={{color:'var(--text3)',borderBottom:'1px solid var(--border)'}}>Tipo</th>
                  {CAMPOS_COSTO.map(c => (
                    <th key={c.key} className="text-right py-2.5 px-2 font-medium whitespace-nowrap" style={{color:'var(--text3)',borderBottom:'1px solid var(--border)'}}>{c.label}</th>
                  ))}
                  <th className="text-right py-2.5 px-2 font-medium whitespace-nowrap" style={{color:'var(--text3)',borderBottom:'1px solid var(--border)'}}>Total Costo</th>
                  <th className="text-right py-2.5 px-2 font-medium whitespace-nowrap" style={{color:'var(--text3)',borderBottom:'1px solid var(--border)'}}>Facturación</th>
                  <th className="text-right py-2.5 px-2 font-medium whitespace-nowrap" style={{color:'var(--text3)',borderBottom:'1px solid var(--border)'}}>Margen</th>
                  <th className="text-right py-2.5 px-2 font-medium whitespace-nowrap" style={{color:'var(--text3)',borderBottom:'1px solid var(--border)'}}>%</th>
                  <th style={{borderBottom:'1px solid var(--border)'}} className="w-10 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={30} className="text-center py-8" style={{color:'var(--text3)'}}>Sin registros</td></tr>}
                {filtered.map(c => (
                  <tr key={c.id} className="table-row">
                    <td className="py-2 px-3 sticky left-0 z-10" style={{background:'var(--surface)'}}>
                      <p className="font-medium">{c.nro_servicio || '—'}</p>
                      <p className="text-xs" style={{color:'var(--text3)',maxWidth:'120px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.fallecido || '—'}</p>
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap" style={{color:'var(--text3)'}}>{fmtDate(c.fecha)}</td>
                    <td className="py-2 px-2" style={{color:'var(--text3)'}}>{c.tipo || '—'}</td>
                    {CAMPOS_COSTO.map(({ key }) => (
                      <td key={key} className="py-2 px-2 text-right" style={{color:'var(--text3)'}}>
                        {(c as unknown as Record<string,number>)[key] ? fmtMoneyShort((c as unknown as Record<string,number>)[key]) : ''}
                      </td>
                    ))}
                    <td className="py-2 px-2 text-right font-semibold">{fmtMoneyShort(c.costo_total)}</td>
                    <td className="py-2 px-2 text-right">{fmtMoneyShort(c.facturacion ?? c.valor_servicio)}</td>
                    <td className={`py-2 px-2 text-right font-semibold ${(c.margen??0)>=0?'text-green-700':'text-red-700'}`}>{fmtMoneyShort(c.margen)}</td>
                    <td className="py-2 px-2 text-right">
                      {c.margen_pct !== undefined && (
                        <span className={`badge ${(c.margen_pct??0)>=40?'bg-green-50 text-green-700':(c.margen_pct??0)>=20?'bg-amber-50 text-amber-700':'bg-red-50 text-red-700'}`}>{c.margen_pct}%</span>
                      )}
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex gap-0.5">
                        <button onClick={() => openEdit(c)} className="p-1 hover:opacity-70" style={{color:'var(--text3)'}}><Edit2 size={11} /></button>
                        <button onClick={() => remove(c.id)} className="p-1 text-red-400 hover:text-red-700"><Trash2 size={11} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr style={{background:'var(--surface2)',fontWeight:600,borderTop:'2px solid var(--border)'}}>
                    <td colSpan={3} className="py-2 px-3 text-xs uppercase tracking-wider" style={{color:'var(--text3)'}}>Totales ({filtered.length})</td>
                    {CAMPOS_COSTO.map(({ key }) => (
                      <td key={key} className="py-2 px-2 text-right text-xs">{fmtMoneyShort(filtered.reduce((a,c) => a+((c as unknown as Record<string,number>)[key]||0),0))}</td>
                    ))}
                    <td className="py-2 px-2 text-right">{fmtMoneyShort(filtered.reduce((a,c)=>a+(c.costo_total??0),0))}</td>
                    <td className="py-2 px-2 text-right">{fmtMoneyShort(filtered.reduce((a,c)=>a+(c.facturacion??c.valor_servicio??0),0))}</td>
                    <td className={`py-2 px-2 text-right ${margenTotal>=0?'text-green-700':'text-red-700'}`}>{fmtMoneyShort(margenTotal)}</td>
                    <td className="py-2 px-2 text-right"><span className={`badge ${margenPct>=40?'bg-green-50 text-green-700':margenPct>=20?'bg-amber-50 text-amber-700':'bg-red-50 text-red-700'}`}>{margenPct}%</span></td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 mt-4">
          <button className="btn btn-sm" disabled={page===0} onClick={() => loadPage(page-1)}><ChevronLeft size={14} /> Anterior</button>
          <span className="text-xs px-3 py-2 rounded-lg" style={{background:'var(--surface2)',color:'var(--text3)'}}>Pág. {page+1} / {totalPages}</span>
          <button className="btn btn-sm" disabled={page>=totalPages-1} onClick={() => loadPage(page+1)}>Siguiente <ChevronRight size={14} /></button>
        </div>
      )}

      {/* Modal CRUD */}
      <Modal open={modal} onClose={() => setModal(false)} title={editTarget ? 'Editar registro' : 'Nuevo registro de costos'} maxWidth="max-w-3xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <Field label="N° Servicio"><input className="input" value={form.nro_servicio??''} onChange={e=>setForm(p=>({...p,nro_servicio:e.target.value}))} placeholder="4446" /></Field>
          <Field label="N° Mes"><input type="number" className="input" value={form.nro_mes??''} onChange={e=>setForm(p=>({...p,nro_mes:e.target.value?Number(e.target.value):undefined}))} /></Field>
          <Field label="Fecha"><input type="date" className="input" value={form.fecha} onChange={e=>setForm(p=>({...p,fecha:e.target.value}))} /></Field>
          <Field label="Tipo"><input className="input" value={form.tipo??''} onChange={e=>setForm(p=>({...p,tipo:e.target.value}))} placeholder="2004..." /></Field>
          <Field label="Fallecido" className="col-span-2 md:col-span-4"><input className="input" value={form.fallecido??''} onChange={e=>setForm(p=>({...p,fallecido:e.target.value}))} placeholder="Apellido, Nombre" /></Field>
        </div>

        <p className="text-xs uppercase tracking-wider mb-3" style={{color:'var(--text3)'}}>Costos del servicio</p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-5">
          {CAMPOS_COSTO.map(({ key, label }) => (
            <Field key={key} label={label}><input {...numInp(key as CampoKey)} /></Field>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t" style={{borderColor:'var(--border)'}}>
          <Field label="Costo total">
            <input className="input font-semibold" readOnly value={form.costo_total?.toLocaleString('es-AR')??'0'} style={{background:'var(--surface2)'}} />
          </Field>
          <Field label="N° Facturación"><input className="input" value={form.nro_facturacion??''} onChange={e=>setForm(p=>({...p,nro_facturacion:e.target.value}))} /></Field>
          <Field label="Facturación"><input {...numInp('facturacion')} /></Field>
          <Field label="Valor servicio"><input {...numInp('valor_servicio')} /></Field>
        </div>

        {form.costo_total !== undefined && form.valor_servicio !== undefined && (
          <div className={`mt-3 p-3 rounded-xl text-sm flex items-center gap-2 ${(form.margen??0)>=0?'bg-green-50 text-green-700':'bg-red-50 text-red-700'}`}>
            {(form.margen??0)>=0?<TrendingUp size={15}/>:<TrendingDown size={15}/>}
            Margen: <strong>{fmtMoney(form.margen)}</strong> ({form.margen_pct}%)
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button className="btn" onClick={() => setModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Guardando...':'Guardar'}</button>
        </div>
      </Modal>

      {/* Modal Import */}
      <Modal open={importModal} onClose={() => !importing && setImportModal(false)} title="Importar historial desde Excel" maxWidth="max-w-2xl">
        {!importing && importData.length > 0 && (
          <>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <p className="text-green-700 font-medium text-sm mb-1">✓ Archivo leído correctamente</p>
              <p className="text-green-600 text-sm"><strong>{importData.length.toLocaleString()}</strong> registros encontrados.</p>
            </div>
            <p className="text-xs uppercase tracking-wider mb-2" style={{color:'var(--text3)'}}>Vista previa (primeros 5)</p>
            <div className="overflow-x-auto border rounded-lg mb-4" style={{borderColor:'var(--border)'}}>
              <table className="text-xs w-full">
                <thead><tr style={{background:'var(--surface2)'}}>
                  {['N° Serv.','Fecha','Fallecido','Tipo','Costo Total','Facturación','Valor Serv.'].map(h=>(
                    <th key={h} className="text-left px-3 py-2 whitespace-nowrap font-medium" style={{color:'var(--text3)'}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {importData.slice(0,5).map((r,i)=>(
                    <tr key={i} className="table-row">
                      <td className="px-3 py-2">{r.nro_servicio||'—'}</td>
                      <td className="px-3 py-2">{fmtDate(r.fecha)}</td>
                      <td className="px-3 py-2" style={{maxWidth:'120px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.fallecido||'—'}</td>
                      <td className="px-3 py-2">{r.tipo||'—'}</td>
                      <td className="px-3 py-2 text-right">{fmtMoneyShort(r.costo_total)}</td>
                      <td className="px-3 py-2 text-right">{fmtMoneyShort(r.facturacion)}</td>
                      <td className="px-3 py-2 text-right">{fmtMoneyShort(r.valor_servicio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-amber-700 text-xs">La importación agrega registros. Si ya importaste antes, puede haber duplicados.</p>
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn" onClick={() => setImportModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={confirmImport}><Upload size={14} /> Importar {importData.length.toLocaleString()} registros</button>
            </div>
          </>
        )}
        {importing && (
          <div className="py-8 text-center">
            <p className="text-sm font-medium mb-4">Importando registros...</p>
            <div className="w-full rounded-full h-3 mb-2" style={{background:'var(--surface2)'}}>
              <div className="bg-brand-900 h-3 rounded-full transition-all duration-300" style={{width:`${importProgress}%`}} />
            </div>
            <p className="text-xs" style={{color:'var(--text3)'}}>{importProgress}% completado — no cerrés esta ventana</p>
          </div>
        )}
      </Modal>
    </>
  )
}
