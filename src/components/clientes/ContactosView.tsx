'use client'
import { useState, useMemo } from 'react'
import type { Contacto } from '@/types'
import { createContacto, updateContacto, deleteContacto } from '@/lib/db'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/ToastProvider'
import { Plus, Search, Edit2, Trash2, Phone, Mail } from 'lucide-react'

type Tipo = Contacto['tipo']
const TIPOS: { key: Tipo; label: string }[] = [
  { key: 'RESPONSABLE',  label: 'Responsables' },
  { key: 'OBRA_SOCIAL',  label: 'Obras sociales' },
  { key: 'CREMATORIO',   label: 'Crematorios' },
  { key: 'CEMENTERIO',   label: 'Cementerios' },
  { key: 'PROVEEDOR',    label: 'Proveedores' },
]

const TIPO_BADGE: Record<Tipo, 'default' | 'gold' | 'info' | 'success' | 'warn'> = {
  RESPONSABLE: 'default', OBRA_SOCIAL: 'gold', CREMATORIO: 'info', CEMENTERIO: 'success', PROVEEDOR: 'warn'
}

const EMPTY: Omit<Contacto, 'id' | 'created_at'> = {
  tipo: 'RESPONSABLE', nombre: '', apellido: '', razon_social: '',
  telefono: '', celular: '', email: '', direccion: '', localidad: '', notas: '', codigo_os: ''
}

export default function ContactosView({ initialContactos }: { initialContactos: Contacto[] }) {
  const { toast } = useToast()
  const [contactos, setContactos] = useState(initialContactos)
  const [tipoFilter, setTipoFilter] = useState<Tipo | ''>('')
  const [q, setQ] = useState('')
  const [modal, setModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Contacto | null>(null)
  const [form, setForm] = useState<Omit<Contacto, 'id' | 'created_at'>>(EMPTY)
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => contactos.filter(c => {
    const matchT = !tipoFilter || c.tipo === tipoFilter
    const matchQ = !q || `${c.nombre} ${c.apellido} ${c.razon_social} ${c.localidad}`.toLowerCase().includes(q.toLowerCase())
    return matchT && matchQ
  }), [contactos, tipoFilter, q])

  function openCreate() { setForm(EMPTY); setEditTarget(null); setModal(true) }
  function openEdit(c: Contacto) { setForm({ ...c }); setEditTarget(c); setModal(true) }

  async function save() {
    if (!form.nombre) { toast('El nombre es requerido', 'error'); return }
    setSaving(true)
    try {
      if (editTarget) {
        await updateContacto(editTarget.id, form)
        setContactos(prev => prev.map(c => c.id === editTarget.id ? { ...c, ...form } : c))
        toast('Contacto actualizado')
      } else {
        const c = await createContacto(form)
        setContactos(prev => [...prev, c])
        toast('Contacto agregado')
      }
      setModal(false)
    } catch { toast('Error al guardar', 'error') }
    setSaving(false)
  }

  async function remove(c: Contacto) {
    if (!confirm(`¿Eliminar a ${c.nombre}?`)) return
    await deleteContacto(c.id)
    setContactos(prev => prev.filter(x => x.id !== c.id))
    toast('Contacto eliminado')
  }

  const inp = (field: keyof typeof form) => ({
    className: 'input',
    value: (form[field] as string) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [field]: e.target.value }))
  })

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
          <input className="input pl-8" placeholder="Buscar..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select className="input w-auto" value={tipoFilter} onChange={e => setTipoFilter(e.target.value as Tipo | '')}>
          <option value="">Todos los tipos</option>
          {TIPOS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> Agregar</button>
      </div>

      <p className="text-xs text-brand-400 mb-3">{filtered.length} contacto{filtered.length !== 1 ? 's' : ''}</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(c => (
          <div key={c.id} className="bg-white border border-brand-100 rounded-xl p-4 hover:border-brand-200 transition-all">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{c.apellido ? `${c.apellido}, ${c.nombre}` : c.razon_social || c.nombre}</p>
                {c.localidad && <p className="text-xs text-brand-400 mt-0.5">{c.localidad}</p>}
              </div>
              <Badge variant={TIPO_BADGE[c.tipo]}>{TIPOS.find(t => t.key === c.tipo)?.label.replace('s', '').trim() || c.tipo}</Badge>
            </div>
            {c.codigo_os && <p className="text-xs text-brand-400 mb-1">Código OS: {c.codigo_os}</p>}
            <div className="flex flex-col gap-1 mt-2">
              {(c.telefono || c.celular) && (
                <a href={`tel:${c.celular || c.telefono}`} className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-900">
                  <Phone size={11} /> {c.celular || c.telefono}
                </a>
              )}
              {c.email && (
                <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-900">
                  <Mail size={11} /> {c.email}
                </a>
              )}
            </div>
            {c.notas && <p className="text-xs text-brand-400 mt-2 pt-2 border-t border-brand-50 line-clamp-2">{c.notas}</p>}
            <div className="flex gap-1 mt-3 justify-end">
              <button onClick={() => openEdit(c)} className="btn btn-xs"><Edit2 size={12} /></button>
              <button onClick={() => remove(c)} className="btn btn-xs btn-danger"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 card text-center py-10 text-brand-400">
            <p className="text-3xl mb-2">👥</p>
            <p className="text-sm">No se encontraron contactos</p>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editTarget ? 'Editar contacto' : 'Nuevo contacto'} maxWidth="max-w-lg">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo" className="col-span-2">
            <select {...inp('tipo')}>
              {TIPOS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Nombre" required><input {...inp('nombre')} placeholder="Nombre o razón social" /></Field>
          <Field label="Apellido"><input {...inp('apellido')} placeholder="Apellido" /></Field>
          {form.tipo === 'OBRA_SOCIAL' && (
            <Field label="Código OS"><input {...inp('codigo_os')} placeholder="Código interno" /></Field>
          )}
          <Field label="Teléfono"><input {...inp('telefono')} type="tel" /></Field>
          <Field label="Celular"><input {...inp('celular')} type="tel" /></Field>
          <Field label="E-mail" className="col-span-2"><input {...inp('email')} type="email" /></Field>
          <Field label="Dirección"><input {...inp('direccion')} /></Field>
          <Field label="Localidad"><input {...inp('localidad')} /></Field>
          <Field label="Notas" className="col-span-2">
            <textarea className="input" rows={2} value={form.notas ?? ''} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} />
          </Field>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn" onClick={() => setModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </Modal>
    </>
  )
}
