'use client'
import { useState } from 'react'
import { ajustarCantidad, deleteStockItem, createStockItem, updateStockItem } from '@/lib/db'
import type { StockItem, MovimientoStock, CategoriaStock } from '@/types'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { useToast } from '@/components/ui/ToastProvider'
import { Plus, Minus, Trash2, AlertTriangle, PlusCircle, History, Edit2 } from 'lucide-react'
import { fmtDate } from '@/lib/utils'

const CATS: CategoriaStock[] = ['Ataúd', 'Urna', 'Mortaja']

export default function StockManager({ initialStock, initialMovimientos }: { initialStock: StockItem[]; initialMovimientos: MovimientoStock[] }) {
  const { toast } = useToast()
  const [stock, setStock] = useState(initialStock)
  const [movimientos] = useState(initialMovimientos)
  const [addModal, setAddModal] = useState(false)
  const [histModal, setHistModal] = useState(false)
  const [editItem, setEditItem] = useState<StockItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [newItem, setNewItem] = useState({ categoria: 'Ataúd' as CategoriaStock, descripcion: '', codigo: '', cantidad: 0, minimo: 1, proveedor: '', precio_unitario: undefined as number | undefined })

  const bycat = CATS.reduce((acc, c) => ({ ...acc, [c]: stock.filter(s => s.categoria === c).reduce((a, s) => a + s.cantidad, 0) }), {} as Record<string, number>)
  const lowItems = stock.filter(s => s.cantidad <= s.minimo)

  async function adjust(id: string, delta: number) {
    await ajustarCantidad(id, delta)
    setStock(prev => prev.map(s => s.id === id ? { ...s, cantidad: Math.max(0, s.cantidad + delta) } : s))
    toast(delta > 0 ? 'Stock incrementado' : 'Stock reducido')
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este ítem?')) return
    await deleteStockItem(id)
    setStock(prev => prev.filter(s => s.id !== id))
    toast('Ítem eliminado')
  }

  async function addItem() {
    if (!newItem.descripcion) { toast('Ingresá una descripción', 'error'); return }
    setSaving(true)
    const item = await createStockItem(newItem)
    setStock(prev => [...prev, item])
    setNewItem({ categoria: 'Ataúd', descripcion: '', codigo: '', cantidad: 0, minimo: 1, proveedor: '', precio_unitario: undefined })
    setAddModal(false)
    toast('Ítem agregado')
    setSaving(false)
  }

  async function saveEdit() {
    if (!editItem) return
    setSaving(true)
    await updateStockItem(editItem.id, editItem)
    setStock(prev => prev.map(s => s.id === editItem.id ? editItem : s))
    setEditItem(null)
    toast('Ítem actualizado')
    setSaving(false)
  }

  function statusBadge(item: StockItem) {
    if (item.cantidad === 0) return <Badge variant="danger">Agotado</Badge>
    if (item.cantidad <= item.minimo) return <Badge variant="warn">Stock bajo</Badge>
    return <Badge variant="success">OK</Badge>
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard label="Ataúdes" value={bycat['Ataúd']} sub="en stock" />
        <StatCard label="Urnas" value={bycat['Urna']} sub="en stock" />
        <StatCard label="Mortajas" value={bycat['Mortaja']} sub="en stock" />
        <StatCard label="Stock bajo" value={lowItems.length} variant={lowItems.length > 0 ? 'danger' : 'default'} />
      </div>

      {lowItems.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-amber-700 text-sm">
          <AlertTriangle size={16} className="shrink-0" />
          <span>Stock bajo: {lowItems.map(s => `${s.descripcion} (${s.cantidad} ud.)`).join(' · ')}</span>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg">Inventario</h3>
          <div className="flex gap-2">
            <button className="btn btn-sm" onClick={() => setHistModal(true)}><History size={14} /> Historial</button>
            <button className="btn btn-sm btn-gold" onClick={() => setAddModal(true)}><PlusCircle size={14} /> Agregar</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-head">
                <th className="text-left py-2 px-2">Categoría</th>
                <th className="text-left py-2 px-2">Descripción</th>
                <th className="text-left py-2 px-2">Código</th>
                <th className="text-left py-2 px-2">Proveedor</th>
                <th className="text-center py-2 px-2">Cantidad</th>
                <th className="text-center py-2 px-2">Mín.</th>
                <th className="text-center py-2 px-2">Estado</th>
                <th className="py-2 px-2 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {stock.map(item => (
                <tr key={item.id} className="table-row">
                  <td className="py-3 px-2">
                    <Badge variant={item.categoria === 'Ataúd' ? 'info' : item.categoria === 'Urna' ? 'success' : 'warn'}>{item.categoria}</Badge>
                  </td>
                  <td className="py-3 px-2 font-medium">{item.descripcion}</td>
                  <td className="py-3 px-2 text-brand-400">{item.codigo}</td>
                  <td className="py-3 px-2 text-brand-400 text-xs">{item.proveedor || '—'}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => adjust(item.id, -1)} className="w-7 h-7 rounded-lg border border-brand-200 bg-white hover:bg-brand-50 flex items-center justify-center transition-colors">
                        <Minus size={12} />
                      </button>
                      <span className={`font-semibold min-w-[28px] text-center ${item.cantidad <= item.minimo ? 'text-red-700' : ''}`}>{item.cantidad}</span>
                      <button onClick={() => adjust(item.id, 1)} className="w-7 h-7 rounded-lg border border-brand-200 bg-white hover:bg-brand-50 flex items-center justify-center transition-colors">
                        <Plus size={12} />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center text-brand-400">{item.minimo}</td>
                  <td className="py-3 px-2 text-center">{statusBadge(item)}</td>
                  <td className="py-3 px-2">
                    <div className="flex gap-1">
                      <button onClick={() => setEditItem(item)} className="text-brand-400 hover:text-brand-700 transition-colors p-1"><Edit2 size={13} /></button>
                      <button onClick={() => remove(item.id)} className="text-brand-400 hover:text-red-700 transition-colors p-1"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {stock.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-brand-400">Sin ítems en stock</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal agregar */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Agregar ítem" maxWidth="max-w-md">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoría" className="col-span-2">
            <select className="input" value={newItem.categoria} onChange={e => setNewItem(p => ({ ...p, categoria: e.target.value as CategoriaStock }))}>
              {CATS.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Descripción" className="col-span-2"><input className="input" value={newItem.descripcion} onChange={e => setNewItem(p => ({ ...p, descripcion: e.target.value }))} placeholder="Ataúd modelo 2004 madera" /></Field>
          <Field label="Código"><input className="input" value={newItem.codigo} onChange={e => setNewItem(p => ({ ...p, codigo: e.target.value }))} placeholder="2004" /></Field>
          <Field label="Proveedor"><input className="input" value={newItem.proveedor} onChange={e => setNewItem(p => ({ ...p, proveedor: e.target.value }))} placeholder="Nombre del proveedor" /></Field>
          <Field label="Cantidad inicial"><input className="input" type="number" min={0} value={newItem.cantidad} onChange={e => setNewItem(p => ({ ...p, cantidad: Number(e.target.value) }))} /></Field>
          <Field label="Stock mínimo"><input className="input" type="number" min={0} value={newItem.minimo} onChange={e => setNewItem(p => ({ ...p, minimo: Number(e.target.value) }))} /></Field>
          <Field label="Precio unitario" className="col-span-2"><input className="input" type="number" min={0} value={newItem.precio_unitario ?? ''} onChange={e => setNewItem(p => ({ ...p, precio_unitario: e.target.value ? Number(e.target.value) : undefined }))} placeholder="Opcional" /></Field>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn" onClick={() => setAddModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={addItem} disabled={saving}>{saving ? 'Guardando...' : 'Agregar'}</button>
        </div>
      </Modal>

      {/* Modal editar */}
      {editItem && (
        <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Editar ítem" maxWidth="max-w-md">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Descripción" className="col-span-2"><input className="input" value={editItem.descripcion} onChange={e => setEditItem(p => p ? { ...p, descripcion: e.target.value } : null)} /></Field>
            <Field label="Código"><input className="input" value={editItem.codigo} onChange={e => setEditItem(p => p ? { ...p, codigo: e.target.value } : null)} /></Field>
            <Field label="Proveedor"><input className="input" value={editItem.proveedor ?? ''} onChange={e => setEditItem(p => p ? { ...p, proveedor: e.target.value } : null)} /></Field>
            <Field label="Stock mínimo"><input className="input" type="number" value={editItem.minimo} onChange={e => setEditItem(p => p ? { ...p, minimo: Number(e.target.value) } : null)} /></Field>
            <Field label="Precio unitario"><input className="input" type="number" value={editItem.precio_unitario ?? ''} onChange={e => setEditItem(p => p ? { ...p, precio_unitario: e.target.value ? Number(e.target.value) : undefined } : null)} /></Field>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button className="btn" onClick={() => setEditItem(null)}>Cancelar</button>
            <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </Modal>
      )}

      {/* Modal historial */}
      <Modal open={histModal} onClose={() => setHistModal(false)} title="Historial de movimientos" maxWidth="max-w-lg">
        <div className="flex flex-col gap-1 max-h-96 overflow-y-auto">
          {movimientos.length === 0 && <p className="text-sm text-brand-400 text-center py-6">Sin movimientos registrados</p>}
          {movimientos.map(m => (
            <div key={m.id} className="flex items-center gap-3 py-2 border-b border-brand-50 text-sm">
              <span className={`badge ${m.tipo === 'ENTRADA' ? 'bg-green-50 text-green-700' : m.tipo === 'SALIDA' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>{m.tipo}</span>
              <span className="font-medium">{m.cantidad} ud.</span>
              <span className="flex-1 text-brand-400 text-xs truncate">{m.motivo || '—'}</span>
              <span className="text-brand-400 text-xs">{fmtDate(m.created_at?.slice(0, 10))}</span>
            </div>
          ))}
        </div>
      </Modal>
    </>
  )
}
