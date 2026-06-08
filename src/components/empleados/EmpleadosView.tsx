'use client'
import { useState, useMemo } from 'react'
import type { Empleado, RolEmpleado, EstadoEmpleado, Servicio } from '@/types'
import { createEmpleado, updateEmpleado, deleteEmpleado } from '@/lib/db'
import { Modal } from '@/components/ui/Modal'
import { Field, FormSection, CheckField } from '@/components/ui/Field'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { useToast } from '@/components/ui/ToastProvider'
import { fmtDate, initiales } from '@/lib/utils'
import { Plus, Search, Edit2, Trash2, Phone, Mail, ClipboardList, User } from 'lucide-react'

const ROLES: RolEmpleado[] = ['ASESOR','CHOFER','VELADOR','ADMINISTRATIVO','GERENCIA','OTRO']
const ESTADOS: EstadoEmpleado[] = ['ACTIVO','INACTIVO','LICENCIA']

const ROL_BADGE: Record<RolEmpleado, 'default'|'gold'|'info'|'success'|'warn'|'danger'> = {
  ASESOR: 'gold', CHOFER: 'info', VELADOR: 'default',
  ADMINISTRATIVO: 'success', GERENCIA: 'warn', OTRO: 'default'
}

const ESTADO_BADGE: Record<EstadoEmpleado, 'success'|'danger'|'warn'> = {
  ACTIVO: 'success', INACTIVO: 'danger', LICENCIA: 'warn'
}

const EMPTY: Omit<Empleado, 'id' | 'created_at'> = {
  nombre: '', apellido: '', documento: '', fecha_nacimiento: '',
  nacionalidad: 'ARGENTINA', estado_civil: 'SOLTERO/A',
  domicilio: '', localidad: '',
  telefono: '', celular: '', email: '',
  contacto_emergencia_nombre: '', contacto_emergencia_tel: '',
  rol: 'ASESOR', estado: 'ACTIVO', fecha_ingreso: '', legajo: '', notas: ''
}

export default function EmpleadosView({ empleados: init, servicios }: { empleados: Empleado[]; servicios: Servicio[] }) {
  const { toast } = useToast()
  const [empleados, setEmpleados] = useState(init)
  const [q, setQ] = useState('')
  const [rolFilter, setRolFilter] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('ACTIVO')
  const [modal, setModal] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [selected, setSelected] = useState<Empleado | null>(null)
  const [editTarget, setEditTarget] = useState<Empleado | null>(null)
  const [form, setForm] = useState<Omit<Empleado, 'id'|'created_at'>>(EMPTY)
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => empleados.filter(e => {
    const matchQ = !q || `${e.apellido} ${e.nombre} ${e.legajo} ${e.documento}`.toLowerCase().includes(q.toLowerCase())
    const matchR = !rolFilter || e.rol === rolFilter
    const matchE = !estadoFilter || e.estado === estadoFilter
    return matchQ && matchR && matchE
  }), [empleados, q, rolFilter, estadoFilter])

  const activos = empleados.filter(e => e.estado === 'ACTIVO').length
  const asesores = empleados.filter(e => e.rol === 'ASESOR' && e.estado === 'ACTIVO').length

  // Servicios por asesor
  const serviciosPorAsesor = useMemo(() => {
    const map: Record<string, number> = {}
    servicios.forEach(s => { if (s.asesor) map[s.asesor] = (map[s.asesor] ?? 0) + 1 })
    return map
  }, [servicios])

  function openCreate() { setForm(EMPTY); setEditTarget(null); setModal(true) }
  function openEdit(e: Empleado) { setForm({ ...e }); setEditTarget(e); setModal(true) }
  function openDetail(e: Empleado) { setSelected(e); setDetailModal(true) }

  const inp = (field: keyof typeof form) => ({
    className: 'input',
    value: (form[field] as string) ?? '',
    onChange: (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [field]: ev.target.value }))
  })

  async function save() {
    if (!form.nombre || !form.apellido) { toast('Nombre y apellido son requeridos', 'error'); return }
    setSaving(true)
    try {
      if (editTarget) {
        await updateEmpleado(editTarget.id, form)
        setEmpleados(prev => prev.map(e => e.id === editTarget.id ? { ...e, ...form } : e))
        toast('Empleado actualizado')
      } else {
        const e = await createEmpleado(form)
        setEmpleados(prev => [...prev, e])
        toast('Empleado agregado')
      }
      setModal(false)
    } catch { toast('Error al guardar', 'error') }
    setSaving(false)
  }

  async function remove(emp: Empleado) {
    if (!confirm(`¿Eliminar a ${emp.nombre} ${emp.apellido}?`)) return
    await deleteEmpleado(emp.id)
    setEmpleados(prev => prev.filter(e => e.id !== emp.id))
    setDetailModal(false)
    toast('Empleado eliminado')
  }

  const serviciosDelEmpleado = selected
    ? servicios.filter(s => s.asesor === `${selected.nombre} ${selected.apellido}` || s.asesor === selected.apellido)
    : []

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard label="Total empleados" value={empleados.length} />
        <StatCard label="Activos" value={activos} variant="gold" />
        <StatCard label="Asesores activos" value={asesores} />
        <StatCard label="En licencia" value={empleados.filter(e => e.estado === 'LICENCIA').length} variant={empleados.filter(e => e.estado === 'LICENCIA').length > 0 ? 'warn' : 'default'} />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
          <input className="input pl-8" placeholder="Buscar por nombre, apellido, legajo..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select className="input w-auto" value={rolFilter} onChange={e => setRolFilter(e.target.value)}>
          <option value="">Todos los roles</option>
          {ROLES.map(r => <option key={r}>{r}</option>)}
        </select>
        <select className="input w-auto" value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e}>{e}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> Agregar</button>
      </div>

      <p className="text-xs text-brand-400 mb-3">{filtered.length} empleado{filtered.length !== 1 ? 's' : ''}</p>

      {/* Grid de empleados */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(emp => (
          <div key={emp.id} onClick={() => openDetail(emp)}
            className="bg-white border border-brand-100 rounded-xl p-4 hover:border-brand-200 hover:shadow-sm transition-all cursor-pointer">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-11 h-11 rounded-full bg-brand-900 flex items-center justify-center text-sm font-semibold text-white shrink-0">
                {initiales(emp.apellido, emp.nombre)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{emp.apellido}, {emp.nombre}</p>
                {emp.legajo && <p className="text-xs text-brand-400">Legajo: {emp.legajo}</p>}
                <p className="text-xs text-brand-400">Ingreso: {fmtDate(emp.fecha_ingreso)}</p>
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap mb-3">
              <Badge variant={ROL_BADGE[emp.rol]}>{emp.rol}</Badge>
              <Badge variant={ESTADO_BADGE[emp.estado]}>{emp.estado}</Badge>
            </div>
            <div className="flex flex-col gap-1">
              {(emp.celular || emp.telefono) && (
                <a href={`tel:${emp.celular || emp.telefono}`} onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-900">
                  <Phone size={11} /> {emp.celular || emp.telefono}
                </a>
              )}
              {emp.email && (
                <a href={`mailto:${emp.email}`} onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-900">
                  <Mail size={11} /> {emp.email}
                </a>
              )}
            </div>
            {emp.rol === 'ASESOR' && (
              <div className="mt-3 pt-2 border-t border-brand-50 flex items-center gap-1.5 text-xs text-brand-400">
                <ClipboardList size={11} />
                {serviciosPorAsesor[`${emp.nombre} ${emp.apellido}`] ?? serviciosPorAsesor[emp.apellido] ?? 0} servicios registrados
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 card text-center py-12 text-brand-400">
            <User size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No se encontraron empleados</p>
          </div>
        )}
      </div>

      {/* Modal detalle */}
      <Modal open={detailModal} onClose={() => setDetailModal(false)} title={selected ? `${selected.apellido}, ${selected.nombre}` : ''} maxWidth="max-w-lg">
        {selected && (
          <>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-brand-900 flex items-center justify-center text-xl font-semibold text-white">
                {initiales(selected.apellido, selected.nombre)}
              </div>
              <div>
                <div className="flex gap-2 mb-1">
                  <Badge variant={ROL_BADGE[selected.rol]}>{selected.rol}</Badge>
                  <Badge variant={ESTADO_BADGE[selected.estado]}>{selected.estado}</Badge>
                </div>
                {selected.legajo && <p className="text-xs text-brand-400">Legajo #{selected.legajo}</p>}
                <p className="text-xs text-brand-400">Ingreso: {fmtDate(selected.fecha_ingreso)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              {[
                ['Documento', selected.documento],
                ['Nacimiento', fmtDate(selected.fecha_nacimiento)],
                ['Nacionalidad', selected.nacionalidad],
                ['Estado civil', selected.estado_civil],
                ['Teléfono', selected.telefono],
                ['Celular', selected.celular],
                ['Email', selected.email],
                ['Domicilio', selected.domicilio],
                ['Localidad', selected.localidad],
              ].filter(([,v]) => v).map(([l, v]) => (
                <div key={l} className="flex flex-col gap-0.5">
                  <span className="text-xs text-brand-400 uppercase tracking-wider">{l}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>

            {(selected.contacto_emergencia_nombre || selected.contacto_emergencia_tel) && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4 text-sm">
                <p className="text-xs text-amber-600 uppercase tracking-wider mb-1">Contacto de emergencia</p>
                <p className="font-medium">{selected.contacto_emergencia_nombre}</p>
                <p className="text-brand-500">{selected.contacto_emergencia_tel}</p>
              </div>
            )}

            {selected.notas && (
              <div className="bg-brand-50 rounded-lg p-3 mb-4 text-sm">
                <p className="text-xs text-brand-400 uppercase tracking-wider mb-1">Notas</p>
                <p className="text-brand-700">{selected.notas}</p>
              </div>
            )}

            {selected.rol === 'ASESOR' && serviciosDelEmpleado.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-brand-400 uppercase tracking-wider mb-2">Últimos servicios ({serviciosDelEmpleado.length} total)</p>
                <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                  {serviciosDelEmpleado.slice(0, 5).map(s => (
                    <div key={s.id} className="flex items-center gap-2 text-xs py-1 border-b border-brand-50">
                      <span className="flex-1 font-medium">{s.ext_apellido}, {s.ext_nombre}</span>
                      <span className="text-brand-400">{fmtDate(s.fecha_servicio)}</span>
                      <Badge variant={s.destino === 'CREMACIÓN' ? 'info' : 'success'}>{s.destino}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between mt-2">
              <button className="btn btn-sm btn-danger" onClick={() => remove(selected)}><Trash2 size={13} /> Eliminar</button>
              <button className="btn btn-sm btn-gold" onClick={() => { setDetailModal(false); openEdit(selected) }}><Edit2 size={13} /> Editar</button>
            </div>
          </>
        )}
      </Modal>

      {/* Modal crear/editar */}
      <Modal open={modal} onClose={() => setModal(false)} title={editTarget ? 'Editar empleado' : 'Nuevo empleado'} maxWidth="max-w-2xl">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre" required><input {...inp('nombre')} placeholder="Nombre" /></Field>
          <Field label="Apellido" required><input {...inp('apellido')} placeholder="Apellido" /></Field>
          <Field label="Documento"><input {...inp('documento')} placeholder="DNI / CUIL" /></Field>
          <Field label="Legajo"><input {...inp('legajo')} placeholder="001" /></Field>
          <Field label="Fecha de nacimiento"><input type="date" {...inp('fecha_nacimiento')} /></Field>
          <Field label="Fecha de ingreso"><input type="date" {...inp('fecha_ingreso')} /></Field>
          <Field label="Nacionalidad"><input {...inp('nacionalidad')} /></Field>
          <Field label="Estado civil">
            <select {...inp('estado_civil')}>
              {['SOLTERO/A','CASADO/A','VIUDO/A','DIVORCIADO/A'].map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Domicilio" className="col-span-2"><input {...inp('domicilio')} placeholder="Calle y número" /></Field>
          <Field label="Localidad"><input {...inp('localidad')} placeholder="Ciudad" /></Field>
          <Field label="Teléfono"><input {...inp('telefono')} type="tel" /></Field>
          <Field label="Celular"><input {...inp('celular')} type="tel" /></Field>
          <Field label="E-mail"><input {...inp('email')} type="email" /></Field>
          <Field label="Rol">
            <select {...inp('rol')}>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Estado">
            <select {...inp('estado')}>
              {ESTADOS.map(e => <option key={e}>{e}</option>)}
            </select>
          </Field>
          <Field label="Contacto emergencia (nombre)"><input {...inp('contacto_emergencia_nombre')} placeholder="Nombre del contacto" /></Field>
          <Field label="Contacto emergencia (tel)"><input {...inp('contacto_emergencia_tel')} type="tel" /></Field>
          <Field label="Notas" className="col-span-2">
            <textarea className="input" rows={2} value={form.notas ?? ''} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} placeholder="Observaciones..." />
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
