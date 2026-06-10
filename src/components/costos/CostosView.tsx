'use client'
import { useState, useMemo, useRef } from 'react'
import type { CostoServicio } from '@/types'
import { createCosto, updateCosto, deleteCosto, bulkInsertCostos, getCostos } from '@/lib/db'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { StatCard } from '@/components/ui/StatCard'
import { useToast } from '@/components/ui/ToastProvider'
import { fmtDate, fmtMoney, fmtMoneyShort } from '@/lib/utils'
import * as XLSX from 'xlsx'
import {
  Plus, Trash2, Edit2, Upload, Download, Search,
  TrendingUp, TrendingDown, AlertTriangle, ChevronLeft, ChevronRight
} from 'lucide-react'

const CAMPOS_COSTO = [
  { key: 'costo_ataud',        label: 'Ataúd' },
  { key: 'costo_comedor',      label: 'Comedor' },
  { key: 'costo_azafata',      label: 'Azafata' },
  { key: 'costo_cafeteria',    label: 'Cafetería' },
  { key: 'costo_tanatopraxia', label: 'Tanatopraxia' },
  { key: 'costo_ambulancia',   label: 'Ambulancia' },
  { key: 'costo_mat_calle',    label: 'Mat. de Calle' },
  { key: 'costo_sellado',      label: 'Sellado' },
  { key: 'costo_soldado',      label: 'Soldado' },
  { key: 'costo_labor',        label: 'Labor' },
  { key: 'costo_sueldos',      label: 'Sueldos' },
  { key: 'costo_mortaja',      label: 'Mortaja' },
  { key: 'costo_urna',         label: 'Urna' },
  { key: 'costo_cementerio',   label: 'Cementerio' },
  { key: 'costo_administrativo', label: 'Administrativo' },
  { key: 'iva_ganado',         label: 'IVA Ganado' },
  { key: 'propina',            label: 'Propina' },
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

// Column mapping for Excel import
const EXCEL_MAP: Record<string, keyof Omit<CostoServicio, 'id' | 'created_at'>> = {
  'serv n°': 'nro_servicio', 'serv nro': 'nro_servicio', 'nro': 'nro_servicio', 'n°': 'nro_servicio',
  'serv mes': 'nro_mes', 'mes': 'nro_mes',
  'fecha': 'fecha',
  'fallecido': 'fallecido',
  'tipo': 'tipo',
  'ataud': 'costo_ataud', 'ataúd': 'costo_ataud',
  'comedor': 'costo_comedor',
  'azafata': 'costo_azafata',
  'cafeteria': 'costo_cafeteria', 'cafetería': 'costo_cafeteria',
  'tanatopraxia': 'costo_tanatopraxia', 'tanatop': 'costo_tanatopraxia',
  'ambulancia': 'costo_ambulancia', 'ambul': 'costo_ambulancia',
  'mat calle': 'costo_mat_calle', 'mat. calle': 'costo_mat_calle', 'matcalle': 'costo_mat_calle',
  'sellado': 'costo_sellado',
  'soldado': 'costo_soldado',
  'labor': 'costo_labor', 'labrar': 'costo_labor',
  'sueldos': 'costo_sueldos',
  'mortaja': 'costo_mortaja',
  'urna': 'costo_urna',
  'cementerio': 'costo_cementerio', 'cementer': 'costo_cementerio',
  'administr': 'costo_administrativo', 'administrativo': 'costo_administrativo', 'admin': 'costo_administrativo',
  'iva ganado': 'iva_ganado', 'iva ganan': 'iva_ganado', 'iva': 'iva_ganado',
  'propina': 'propina',
  'costo': 'costo_total', 'costo total': 'costo_total',
  'nro factu': 'nro_facturacion', 'facturación n°': 'nro_facturacion', 'n° factura': 'nro_facturacion',
  'facturacion': 'facturacion', 'facturación': 'facturacion',
  'valor servicio': 'valor_servicio', 'valor': 'valor_servicio',
}

function calcTotales(form: Omit<CostoServicio, 'id' | 'created_at'>) {
  const costo_total = CAMPOS_COSTO.reduce((sum, { key }) => sum + (Number(form[key]) || 0), 0)
  const margen = (form.valor_servicio ?? 0) - costo_total
  const margen_pct = form.valor_servicio ? Math.round(margen / form.valor_servicio * 100) : 0
  return { costo_total, margen, margen_pct }
}

function parseExcelDate(val: unknown): string {
  if (!val) return new Date().toISOString().slice(0, 10)
  if (typeof val === 'number') {
    // Excel serial date
    const d = new Date((val - 25569) * 86400 * 1000)
    return d.toISOString().slice(0, 10)
  }
  if (typeof val === 'string') {
    // Try DD/MM/YYYY
    const match = val.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
    if (match) {
      const [, d, m, y] = match
      const year = y.length === 2 ? '20' + y : y
      return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
    return new Date().toISOString().slice(0, 10)
  }
  return new Date().toISOString().slice(0, 10)
}

export default function CostosView({ initialCostos, totalCount }: { initialCostos: CostoServicio[]; totalCount: number }) {
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const [costos, setCostos] = useState(initialCostos)
  const [total, setTotal] = useState(totalCount)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)

  const [q, setQ] = useState('')
  const [mesFiltro, setMesFiltro] = useState('')

  const [modal, setModal] = useState(false)
  const [editTarget, setEditTarget] = useState<CostoServicio | null>(null)
  const [form, setForm] = useState<Omit<CostoServicio, 'id' | 'created_at'>>(EMPTY)
  const [saving, setSaving] = useState(false)

  const [importModal, setImportModal] = useState(false)
  const [importData, setImportData] = useState<Omit<CostoServicio, 'id' | 'created_at'>[]>([])
  const [importCols, setImportCols] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)

  // ── Filtros ──
  const filtered = useMemo(() => costos.filter(c => {
    const matchQ = !q || `${c.fallecido} ${c.nro_servicio} ${c.tipo}`.toLowerCase().includes(q.toLowerCase())
    const matchM = !mesFiltro || c.fecha?.startsWith(mesFiltro)
    return matchQ && matchM
  }), [costos, q, mesFiltro])

  // ── Stats ──
  const totalFacturacion = useMemo(() => costos.reduce((a, c) => a + (c.facturacion ?? c.valor_servicio ?? 0), 0), [costos])
  const totalCostos = useMemo(() => costos.reduce((a, c) => a + (c.costo_total ?? 0), 0), [costos])
  const margenTotal = totalFacturacion - totalCostos
  const margenPct = totalFacturacion > 0 ? Math.round(margenTotal / totalFacturacion * 100) : 0

  const meses = useMemo(() => {
    const s = new Set(costos.map(c => c.fecha?.slice(0, 7)).filter(Boolean))
    return Array.from(s).sort().reverse()
  }, [costos])

  // ── Pagination load ──
  async function loadPage(p: number) {
    setLoading(true)
    try {
      const data = await getCostos(PAGE_SIZE, p * PAGE_SIZE)
      setCostos(data)
      setPage(p)
    } catch { toast('Error al cargar', 'error') }
    setLoading(false)
  }

  // ── Form helpers ──
  function openCreate() {
    setForm(EMPTY)
    setEditTarget(null)
    setModal(true)
  }
  function openEdit(c: CostoServicio) {
    setForm({ ...c })
    setEditTarget(c)
    setModal(true)
  }

  function setNum(field: keyof typeof form, val: string) {
    const next = { ...form, [field]: val === '' ? undefined : Number(val) }
    const tots = calcTotales(next)
    setForm({ ...next, ...tots })
  }

  async function save() {
    if (!form.fecha) { toast('La fecha es requerida', 'error'); return }
    setSaving(true)
    try {
      const tots = calcTotales(form)
      const payload = { ...form, ...tots }
      if (editTarget) {
        await updateCosto(editTarget.id, payload)
        setCostos(prev => prev.map(c => c.id === editTarget.id ? { ...c, ...payload } : c))
        toast('Costo actualizado')
      } else {
        const c = await createCosto(payload)
        setCostos(prev => [c, ...prev])
        setTotal(t => t + 1)
        toast('Costo registrado')
      }
      setModal(false)
    } catch { toast('Error al guardar', 'error') }
    setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este registro?')) return
    await deleteCosto(id)
    setCostos(prev => prev.filter(c => c.id !== id))
    setTotal(t => t - 1)
    toast('Eliminado')
  }

  // ── Excel Import ──
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'array' })
        // Try "SERVICIOS REALIZADOS" sheet first, else first sheet
        const sheetName = wb.SheetNames.find(n => n.toLowerCase().includes('servicio')) ?? wb.SheetNames[0]
        const ws = wb.Sheets[sheetName]
        const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][]

        // Find header row (look for row containing 'fecha' or 'fallecido')
        let headerIdx = 0
        for (let i = 0; i < Math.min(20, rawRows.length); i++) {
          const row = rawRows[i] as string[]
          const rowStr = row.map(c => String(c).toLowerCase()).join(' ')
          if (rowStr.includes('fecha') || rowStr.includes('fallecido') || rowStr.includes('serv')) {
            headerIdx = i
            break
          }
        }

        const headers = (rawRows[headerIdx] as string[]).map(h => String(h).toLowerCase().trim())
        setImportCols(headers)

        const dataRows: Omit<CostoServicio, 'id' | 'created_at'>[] = []

        for (let i = headerIdx + 1; i < rawRows.length; i++) {
          const row = rawRows[i] as unknown[]
          // Skip completely empty rows
          if (row.every(v => v === '' || v === null || v === undefined)) continue
          // Skip rows where fecha and fallecido are both empty
          const fechaIdx = headers.findIndex(h => h.includes('fecha'))
          const fallecidoIdx = headers.findIndex(h => h.includes('fallecido'))
          if (fechaIdx >= 0 && fallecidoIdx >= 0) {
            if (!row[fechaIdx] && !row[fallecidoIdx]) continue
          }

          const record: Omit<CostoServicio, 'id' | 'created_at'> = { ...EMPTY }

          headers.forEach((header, colIdx) => {
            const val = row[colIdx]
            if (val === '' || val === null || val === undefined) return

            // Find mapping
            const mapped = EXCEL_MAP[header] ??
              Object.entries(EXCEL_MAP).find(([k]) => header.includes(k) || k.includes(header))?.[1]

            if (!mapped) return

            if (mapped === 'fecha') {
              record.fecha = parseExcelDate(val)
            } else if (mapped === 'nro_mes' || mapped === 'costo_total' || mapped === 'facturacion' || mapped === 'valor_servicio' || mapped === 'iva_ganado' || mapped === 'propina' || mapped.startsWith('costo_')) {
              const n = Number(String(val).replace(/[^0-9.-]/g, ''))
              if (!isNaN(n) && n !== 0) (record as Record<string, unknown>)[mapped] = n
            } else {
              (record as Record<string, unknown>)[mapped] = String(val).trim()
            }
          })

          // Auto-calc costo_total if not set
          if (!record.costo_total) {
            const tots = calcTotales(record)
            record.costo_total = tots.costo_total
            record.margen = tots.margen
            record.margen_pct = tots.margen_pct
          } else if (record.valor_servicio) {
            record.margen = (record.valor_servicio ?? 0) - (record.costo_total ?? 0)
            record.margen_pct = record.valor_servicio > 0 ? Math.round(record.margen / record.valor_servicio * 100) : 0
          }

          // Default fecha if missing
          if (!record.fecha) record.fecha = new Date().toISOString().slice(0, 10)

          dataRows.push(record)
        }

        setImportData(dataRows)
        setImportModal(true)
      } catch (err) {
        console.error(err)
        toast('Error al leer el archivo. Verificá que sea un Excel válido.', 'error')
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  async function confirmImport() {
    if (!importData.length) return
    setImporting(true)
    setImportProgress(0)
    try {
      // Import in batches, updating progress
      const batchSize = 100
      let done = 0
      for (let i = 0; i < importData.length; i += batchSize) {
        const batch = importData.slice(i, i + batchSize)
        await bulkInsertCostos(batch)
        done += batch.length
        setImportProgress(Math.round(done / importData.length * 100))
      }
      toast(`✓ ${importData.length.toLocaleString()} registros importados`)
      setImportModal(false)
      setImportData([])
      // Reload current page
      await loadPage(0)
      const count = await import('@/lib/db').then(m => m.getCostosCount())
      setTotal(count)
    } catch (err) {
      console.error(err)
      toast('Error durante la importación', 'error')
    }
    setImporting(false)
    setImportProgress(0)
  }

  // ── Export Excel ──
  function exportExcel() {
    const rows = filtered.map(c => ({
      'N° Servicio': c.nro_servicio,
      'N° Mes': c.nro_mes,
      'Fecha': c.fecha,
      'Fallecido': c.fallecido,
      'Tipo': c.tipo,
      'Ataúd': c.costo_ataud,
      'Comedor': c.costo_comedor,
      'Azafata': c.costo_azafata,
      'Cafetería': c.costo_cafeteria,
      'Tanatopraxia': c.costo_tanatopraxia,
      'Ambulancia': c.costo_ambulancia,
      'Mat. Calle': c.costo_mat_calle,
      'Sellado': c.costo_sellado,
      'Soldado': c.costo_soldado,
      'Labor': c.costo_labor,
      'Sueldos': c.costo_sueldos,
      'Mortaja': c.costo_mortaja,
      'Urna': c.costo_urna,
      'Cementerio': c.costo_cementerio,
      'Administrativo': c.costo_administrativo,
      'IVA Ganado': c.iva_ganado,
      'Propina': c.propina,
      'Costo Total': c.costo_total,
      'N° Facturación': c.nro_facturacion,
      'Facturación': c.facturacion,
      'Valor Servicio': c.valor_servicio,
      'Margen': c.margen,
      'Margen %': c.margen_pct,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Costos')
    XLSX.writeFile(wb, `cartu-costos-${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  const numInp = (field: CampoKey | 'facturacion' | 'valor_servicio') => ({
    type: 'number' as const,
    className: 'input',
    value: (form as Record<string, unknown>)[field] as number ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setNum(field as keyof typeof form, e.target.value),
    placeholder: '0',
  })

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Registros" value={total.toLocaleString('es-AR')} sub={`${filtered.length} en vista`} />
        <StatCard label="Facturación total" value={fmtMoneyShort(totalFacturacion)} variant="gold" />
        <StatCard label="Costos totales" value={fmtMoneyShort(totalCostos)} variant={totalCostos > totalFacturacion ? 'danger' : 'default'} />
        <StatCard label="Margen neto" value={fmtMoneyShort(margenTotal)} sub={`${margenPct}% promedio`} variant={margenTotal >= 0 ? 'default' : 'danger'} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
          <input className="input pl-8" placeholder="Buscar por fallecido, N° servicio, tipo..."
            value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select className="input w-auto" value={mesFiltro} onChange={e => setMesFiltro(e.target.value)}>
          <option value="">Todos los períodos</option>
          {meses.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <button className="btn btn-sm" onClick={exportExcel}><Download size={14} /> Excel</button>
        <button className="btn btn-sm btn-gold" onClick={() => fileRef.current?.click()}>
          <Upload size={14} /> Importar Excel
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
        <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> Nuevo</button>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-xs" style={{minWidth:'1400px'}}>
          <thead>
            <tr className="table-head">
              <th className="text-left py-2 px-2 sticky left-0 z-10" style={{background:'var(--surface)'}}>N° Serv.</th>
              <th className="text-left py-2 px-2">Mes</th>
              <th className="text-left py-2 px-2">Fecha</th>
              <th className="text-left py-2 px-2" style={{minWidth:'130px'}}>Fallecido</th>
              <th className="text-left py-2 px-2">Tipo</th>
              {CAMPOS_COSTO.map(c => (
                <th key={c.key} className="text-right py-2 px-2 whitespace-nowrap">{c.label}</th>
              ))}
              <th className="text-right py-2 px-2 font-semibold">Costo Total</th>
              <th className="text-right py-2 px-2">N° Fact.</th>
              <th className="text-right py-2 px-2">Facturación</th>
              <th className="text-right py-2 px-2">Valor Serv.</th>
              <th className="text-right py-2 px-2">Margen</th>
              <th className="text-right py-2 px-2">%</th>
              <th className="py-2 px-2 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !loading && (
              <tr><td colSpan={30} className="text-center py-8" style={{color:'var(--text3)'}}>Sin registros</td></tr>
            )}
            {loading && (
              <tr><td colSpan={30} className="text-center py-8" style={{color:'var(--text3)'}}>Cargando...</td></tr>
            )}
            {!loading && filtered.map(c => (
              <tr key={c.id} className="table-row">
                <td className="py-2 px-2 font-medium sticky left-0 z-10" style={{background:'var(--surface)'}}>{c.nro_servicio || '—'}</td>
                <td className="py-2 px-2 text-center" style={{color:'var(--text3)'}}>{c.nro_mes ?? '—'}</td>
                <td className="py-2 px-2 whitespace-nowrap">{fmtDate(c.fecha)}</td>
                <td className="py-2 px-2 font-medium" style={{maxWidth:'130px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.fallecido || '—'}</td>
                <td className="py-2 px-2" style={{color:'var(--text3)'}}>{c.tipo || '—'}</td>
                {CAMPOS_COSTO.map(({ key }) => (
                  <td key={key} className="py-2 px-2 text-right" style={{color:'var(--text3)'}}>
                    {(c as Record<string, unknown>)[key] ? fmtMoneyShort((c as Record<string, number>)[key]) : '—'}
                  </td>
                ))}
                <td className="py-2 px-2 text-right font-semibold">{fmtMoneyShort(c.costo_total)}</td>
                <td className="py-2 px-2 text-right" style={{color:'var(--text3)'}}>{c.nro_facturacion || '—'}</td>
                <td className="py-2 px-2 text-right">{fmtMoneyShort(c.facturacion)}</td>
                <td className="py-2 px-2 text-right font-semibold">{fmtMoneyShort(c.valor_servicio)}</td>
                <td className={`py-2 px-2 text-right font-semibold ${(c.margen ?? 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {fmtMoneyShort(c.margen)}
                </td>
                <td className="py-2 px-2 text-right">
                  {c.margen_pct !== undefined && (
                    <span className={`badge ${(c.margen_pct ?? 0) >= 40 ? 'bg-green-50 text-green-700' : (c.margen_pct ?? 0) >= 20 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                      {c.margen_pct}%
                    </span>
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
          {/* Totals row */}
          {filtered.length > 0 && (
            <tfoot>
              <tr style={{background:'var(--surface2)',fontWeight:600}}>
                <td colSpan={5} className="py-2 px-2 text-right text-xs uppercase tracking-wider" style={{color:'var(--text3)'}}>Totales ({filtered.length} registros)</td>
                {CAMPOS_COSTO.map(({ key }) => (
                  <td key={key} className="py-2 px-2 text-right text-xs">
                    {fmtMoneyShort(filtered.reduce((a, c) => a + ((c as Record<string, number>)[key] || 0), 0))}
                  </td>
                ))}
                <td className="py-2 px-2 text-right">{fmtMoneyShort(filtered.reduce((a,c) => a+(c.costo_total??0),0))}</td>
                <td className="py-2 px-2"></td>
                <td className="py-2 px-2 text-right">{fmtMoneyShort(filtered.reduce((a,c) => a+(c.facturacion??0),0))}</td>
                <td className="py-2 px-2 text-right">{fmtMoneyShort(filtered.reduce((a,c) => a+(c.valor_servicio??0),0))}</td>
                <td className={`py-2 px-2 text-right ${margenTotal >= 0 ? 'text-green-700' : 'text-red-700'}`}>{fmtMoneyShort(margenTotal)}</td>
                <td className="py-2 px-2 text-right">
                  <span className={`badge ${margenPct >= 40 ? 'bg-green-50 text-green-700' : margenPct >= 20 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{margenPct}%</span>
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs" style={{color:'var(--text3)'}}>
            Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total.toLocaleString()} registros
          </p>
          <div className="flex gap-2">
            <button className="btn btn-sm" disabled={page === 0} onClick={() => loadPage(page - 1)}>
              <ChevronLeft size={14} /> Anterior
            </button>
            <span className="btn btn-sm" style={{cursor:'default'}}>Pág. {page + 1} / {totalPages}</span>
            <button className="btn btn-sm" disabled={page >= totalPages - 1} onClick={() => loadPage(page + 1)}>
              Siguiente <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Modal CRUD */}
      <Modal open={modal} onClose={() => setModal(false)} title={editTarget ? 'Editar registro' : 'Nuevo registro de costos'} maxWidth="max-w-4xl">
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
          <Field label="N° Servicio"><input className="input" value={form.nro_servicio ?? ''} onChange={e => setForm(p => ({...p, nro_servicio: e.target.value}))} placeholder="4446" /></Field>
          <Field label="N° Mes"><input type="number" className="input" value={form.nro_mes ?? ''} onChange={e => setForm(p => ({...p, nro_mes: e.target.value ? Number(e.target.value) : undefined}))} /></Field>
          <Field label="Fecha"><input type="date" className="input" value={form.fecha} onChange={e => setForm(p => ({...p, fecha: e.target.value}))} /></Field>
          <Field label="Fallecido" className="col-span-2"><input className="input" value={form.fallecido ?? ''} onChange={e => setForm(p => ({...p, fallecido: e.target.value}))} placeholder="Apellido, Nombre" /></Field>
          <Field label="Tipo"><input className="input" value={form.tipo ?? ''} onChange={e => setForm(p => ({...p, tipo: e.target.value}))} placeholder="2004 / EXTRA..." /></Field>
        </div>

        <p className="text-xs uppercase tracking-wider mb-2" style={{color:'var(--text3)'}}>Costos del servicio</p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
          {CAMPOS_COSTO.map(({ key, label }) => (
            <Field key={key} label={label}>
              <input {...numInp(key as CampoKey)} />
            </Field>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t" style={{borderColor:'var(--border)'}}>
          <Field label="Costo total">
            <input className="input" readOnly value={form.costo_total?.toLocaleString('es-AR') ?? '0'} style={{background:'var(--surface2)'}} />
          </Field>
          <Field label="N° Facturación"><input className="input" value={form.nro_facturacion ?? ''} onChange={e => setForm(p => ({...p, nro_facturacion: e.target.value}))} /></Field>
          <Field label="Facturación"><input {...numInp('facturacion')} /></Field>
          <Field label="Valor servicio"><input {...numInp('valor_servicio')} /></Field>
        </div>

        {form.costo_total !== undefined && form.valor_servicio !== undefined && (
          <div className={`mt-3 p-3 rounded-lg text-sm flex items-center gap-2 ${(form.margen ?? 0) >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {(form.margen ?? 0) >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
            Margen: <strong>{fmtMoney(form.margen)}</strong> ({form.margen_pct}%)
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button className="btn" onClick={() => setModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </Modal>

      {/* Modal Import */}
      <Modal open={importModal} onClose={() => !importing && setImportModal(false)} title="Importar historial desde Excel" maxWidth="max-w-2xl">
        {importData.length > 0 && !importing && (
          <>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <p className="text-green-700 font-medium text-sm mb-1">✓ Archivo leído correctamente</p>
              <p className="text-green-600 text-sm"><strong>{importData.length.toLocaleString()}</strong> registros encontrados listos para importar.</p>
            </div>

            {/* Preview */}
            <p className="text-xs uppercase tracking-wider mb-2" style={{color:'var(--text3)'}}>Vista previa (primeros 5 registros)</p>
            <div className="overflow-x-auto border rounded-lg mb-4" style={{borderColor:'var(--border)'}}>
              <table className="text-xs w-full">
                <thead>
                  <tr style={{background:'var(--surface2)'}}>
                    {['N° Serv.','Fecha','Fallecido','Tipo','Costo Total','Facturación','Valor Serv.'].map(h => (
                      <th key={h} className="text-left px-3 py-2 whitespace-nowrap" style={{color:'var(--text3)'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importData.slice(0, 5).map((r, i) => (
                    <tr key={i} className="table-row">
                      <td className="px-3 py-1.5">{r.nro_servicio || '—'}</td>
                      <td className="px-3 py-1.5">{fmtDate(r.fecha)}</td>
                      <td className="px-3 py-1.5" style={{maxWidth:'120px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.fallecido || '—'}</td>
                      <td className="px-3 py-1.5">{r.tipo || '—'}</td>
                      <td className="px-3 py-1.5 text-right">{fmtMoneyShort(r.costo_total)}</td>
                      <td className="px-3 py-1.5 text-right">{fmtMoneyShort(r.facturacion)}</td>
                      <td className="px-3 py-1.5 text-right">{fmtMoneyShort(r.valor_servicio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertTriangle size={15} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-amber-700 text-xs">La importación agregará todos los registros. Si ya importaste antes, puede haber duplicados. Podés limpiar la tabla desde Supabase antes de reimportar.</p>
            </div>

            <div className="flex justify-end gap-2">
              <button className="btn" onClick={() => setImportModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={confirmImport}>
                <Upload size={14} /> Importar {importData.length.toLocaleString()} registros
              </button>
            </div>
          </>
        )}

        {importing && (
          <div className="py-6 text-center">
            <p className="text-sm font-medium mb-3">Importando registros...</p>
            <div className="w-full rounded-full h-3 mb-2" style={{background:'var(--surface2)'}}>
              <div className="bg-brand-900 h-3 rounded-full transition-all" style={{width:`${importProgress}%`}} />
            </div>
            <p className="text-xs" style={{color:'var(--text3)'}}>{importProgress}% — no cerrés esta ventana</p>
          </div>
        )}
      </Modal>
    </>
  )
}
