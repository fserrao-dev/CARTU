'use client'
import { useState } from 'react'
import { ajustarCantidad, deleteStockItem, createStockItem } from '@/lib/db'
import type { StockItem, CategoriaStock } from '@/types'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { Plus, Minus, Trash2, AlertTriangle, PlusCircle } from 'lucide-react'

const CATEGORIES: CategoriaStock[] = ['Ataúd', 'Urna', 'Mortaja']

export default function StockManager({ initialStock }: { initialStock: StockItem[] }) {
  const [stock, setStock] = useState(initialStock)
  const [modalOpen, setModalOpen] = useState(false)
  const [newItem, setNewItem] = useState({ categoria: 'Ataúd' as CategoriaStock, descripcion: '', codigo: '', cantidad: 0, minimo: 1 })
  const [saving, setSaving] = useState(false)

  const bycat = CATEGORIES.reduce((acc, c) => ({ ...acc, [c]: stock.filter(s => s.categoria === c).reduce((a, s) => a + s.cantidad, 0) }), {} as Record<string, number>)
  const lowItems = stock.filter(s => s.cantidad <= s.minimo)

  async function adjust(id: string, delta: number) {
    await ajustarCantidad(id, delta)
    setStock(prev => prev.map(s => s.id === id ? { ...s, cantidad: Math.max(0, s.cantidad + delta) } : s))
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este ítem?')) return
    await deleteStockItem(id)
    setStock(prev => prev.filter(s => s.id !== id))
  }

  async function addItem() {
    if (!newItem.descripcion) { alert('Ingresá una descripción'); return }
    setSaving(true)
    const item = await createStockItem(newItem)
    setStock(prev => [...prev, item])
    setNewItem({ categoria: 'Ataúd', descripcion: '', codigo: '', cantidad: 0, minimo: 1 })
    setModalOpen(false)
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
          <span>Stock bajo: {lowItems.map(s => `${s.descripcion} (${s.cantidad})`).join(' · ')}</span>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg">Inventario</h3>
          <button className="btn btn-gold" onClick={() => setModalOpen(true)}>
            <PlusCircle size={15} /> Agregar ítem
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-brand-500 uppercase tracking-wider border-b border-brand-100">
                <th className="text-left py-2 px-2">Categoría</th>
                <th className="text-left py-2 px-2">Descripción</th>
                <th className="text-left py-2 px-2">Código</th>
                <th className="text-center py-2 px-2">Cantidad</th>
                <th className="text-center py-2 px-2">Mínimo</th>
                <th className="text-center py-2 px-2">Estado</th>
                <th className="py-2 px-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {stock.map(item => (
                <tr key={item.id} className="border-b border-brand-50 hover:bg-brand-50 transition-colors">
                  <td className="py-3 px-2">
                    <Badge variant={item.categoria === 'Ataúd' ? 'info' : item.categoria === 'Urna' ? 'success' : 'warn'}>
                      {item.categoria}
                    </Badge>
                  </td>
                  <td className="py-3 px-2">{item.descripcion}</td>
                  <td className="py-3 px-2 text-brand-500">{item.codigo}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => adjust(item.id, -1)} className="w-7 h-7 rounded-lg border border-brand-200 bg-white hover:bg-brand-50 flex items-center justify-center text-brand-700 transition-colors">
                        <Minus size={12} />
                      </button>
                      <span className={`font-semibold min-w-[24px] text-center ${item.cantidad <= item.minimo ? 'text-red-700' : ''}`}>
                        {item.cantidad}
                      </span>
                      <button onClick={() => adjust(item.id, 1)} className="w-7 h-7 rounded-lg border border-brand-200 bg-white hover:bg-brand-50 flex items-center justify-center text-brand-700 transition-colors">
                        <Plus size={12} />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center text-brand-500">{item.minimo}</td>
                  <td className="py-3 px-2 text-center">{statusBadge(item)}</td>
                  <td className="py-3 px-2">
                    <button onClick={() => remove(item.id)} className="text-brand-400 hover:text-red-700 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {stock.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-brand-500">Sin ítems en stock</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Agregar ítem al stock" maxWidth="max-w-sm">
        <div className="flex flex-col gap-3">
          <Field label="Categoría">
            <select className="input" value={newItem.categoria} onChange={e => setNewItem(p => ({ ...p, categoria: e.target.value as CategoriaStock }))}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Descripción">
            <input className="input" value={newItem.descripcion} onChange={e => setNewItem(p => ({ ...p, descripcion: e.target.value }))} placeholder="Ataúd modelo 2004 madera" />
          </Field>
          <Field label="Código">
            <input className="input" value={newItem.codigo} onChange={e => setNewItem(p => ({ ...p, codigo: e.target.value }))} placeholder="2004" />
          </Field>
          <Field label="Cantidad inicial">
            <input className="input" type="number" min={0} value={newItem.cantidad} onChange={e => setNewItem(p => ({ ...p, cantidad: Number(e.target.value) }))} />
          </Field>
          <Field label="Stock mínimo (alerta)">
            <input className="input" type="number" min={0} value={newItem.minimo} onChange={e => setNewItem(p => ({ ...p, minimo: Number(e.target.value) }))} />
          </Field>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn" onClick={() => setModalOpen(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={addItem} disabled={saving}>{saving ? 'Guardando...' : 'Agregar'}</button>
        </div>
      </Modal>
    </>
  )
}
