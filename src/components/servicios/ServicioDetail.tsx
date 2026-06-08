'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteServicio, createPago, deletePago, updateServicio } from '@/lib/db'
import { fmtDate, fmtMoney, calcEdad, estadoColor } from '@/lib/utils'
import type { Servicio, PagoServicio, EstadoServicio, MedioPago } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { useToast } from '@/components/ui/ToastProvider'
import { Trash2, ArrowLeft, Edit2, CheckCircle, XCircle, Plus, DollarSign } from 'lucide-react'
import Link from 'next/link'
import PrintOrden from './PrintOrden'

function Row({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-brand-400 tracking-wide uppercase">{label}</span>
      <span className="text-sm">{typeof value === 'boolean' ? (value ? 'Sí' : 'No') : value}</span>
    </div>
  )
}

function Bool({ val, label }: { val: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-sm ${val ? 'text-green-700' : 'text-brand-300'}`}>
      {val ? <CheckCircle size={13} /> : <XCircle size={13} />} {label}
    </div>
  )
}

const MEDIOS: MedioPago[] = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA DÉBITO', 'TARJETA CRÉDITO', 'CHEQUE']
const ESTADOS: EstadoServicio[] = ['PENDIENTE', 'EN CURSO', 'COMPLETADO', 'CANCELADO']

export default function ServicioDetail({ servicio: s, pagos: initialPagos }: { servicio: Servicio; pagos: PagoServicio[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [pagos, setPagos] = useState(initialPagos)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pagoModal, setPagoModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [savingPago, setSavingPago] = useState(false)
  const [estado, setEstado] = useState<EstadoServicio>(s.estado)
  const [updatingEstado, setUpdatingEstado] = useState(false)
  const [saldo, setSaldo] = useState(s.val_saldo ?? 0)
  const [abonado, setAbonado] = useState(s.val_abonado ?? 0)
  const [nuevoPago, setNuevoPago] = useState({ fecha: new Date().toISOString().slice(0, 10), monto: '', medio: 'TRANSFERENCIA' as MedioPago, nota: '' })

  const edad = calcEdad(s.ext_nacimiento, s.ext_fallecio)

  async function handleDelete() {
    setDeleting(true)
    await deleteServicio(s.id)
    toast('Servicio eliminado')
    router.push('/servicios')
    router.refresh()
  }

  async function handleEstado(nuevoEstado: EstadoServicio) {
    setUpdatingEstado(true)
    await updateServicio(s.id, { estado: nuevoEstado })
    setEstado(nuevoEstado)
    toast(`Estado actualizado a ${nuevoEstado}`)
    setUpdatingEstado(false)
    router.refresh()
  }

  async function handlePago(e: React.FormEvent) {
    e.preventDefault()
    if (!nuevoPago.monto) return
    setSavingPago(true)
    try {
      const pago = await createPago({
        servicio_id: s.id,
        fecha: nuevoPago.fecha,
        monto: Number(nuevoPago.monto),
        medio: nuevoPago.medio,
        nota: nuevoPago.nota,
      })
      setPagos(prev => [pago, ...prev])
      const nuevoAb = abonado + Number(nuevoPago.monto)
      const nuevoSaldo = Math.max(0, (s.val_total_impuestos ?? 0) - nuevoAb)
      setAbonado(nuevoAb)
      setSaldo(nuevoSaldo)
      setNuevoPago({ fecha: new Date().toISOString().slice(0, 10), monto: '', medio: 'TRANSFERENCIA', nota: '' })
      setPagoModal(false)
      toast('Pago registrado')
      router.refresh()
    } catch { toast('Error al registrar pago', 'error') }
    setSavingPago(false)
  }

  async function handleDeletePago(pago: PagoServicio) {
    if (!confirm('¿Eliminar este pago?')) return
    await deletePago(pago.id, s.id, pago.monto)
    setPagos(prev => prev.filter(p => p.id !== pago.id))
    const nuevoAb = Math.max(0, abonado - pago.monto)
    setSaldo(Math.max(0, (s.val_total_impuestos ?? 0) - nuevoAb))
    setAbonado(nuevoAb)
    toast('Pago eliminado')
    router.refresh()
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-5 flex-wrap no-print">
        <Link href="/servicios" className="btn btn-sm"><ArrowLeft size={14} /> Volver</Link>
        <Link href={`/servicios/editar/${s.id}`} className="btn btn-sm btn-gold"><Edit2 size={14} /> Editar</Link>
        <div className="flex-1" />
        <PrintOrden servicio={s} />
        <button className="btn btn-sm btn-danger" onClick={() => setConfirmDelete(true)}><Trash2 size={14} /> Eliminar</button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="font-serif text-2xl">Orden #{s.nro_orden}</h3>
          <p className="text-sm text-brand-400">{fmtDate(s.fecha_servicio)} · Asesor: {s.asesor}</p>
          {edad !== null && <p className="text-xs text-brand-400 mt-0.5">{edad} años al momento del fallecimiento</p>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant={s.destino === 'CREMACIÓN' ? 'info' : 'success'}>{s.destino}</Badge>
          <Badge variant={s.cobertura === 'PARTICULAR' ? 'default' : 'gold'}>{s.cobertura}</Badge>
          {saldo > 0 && <Badge variant="danger">Saldo: {fmtMoney(saldo)}</Badge>}
        </div>
      </div>

      {/* Estado */}
      <div className="card mb-4 no-print">
        <p className="label mb-2">Estado del servicio</p>
        <div className="flex gap-2 flex-wrap">
          {ESTADOS.map(e => (
            <button
              key={e}
              onClick={() => handleEstado(e)}
              disabled={updatingEstado}
              className={`badge border text-xs px-3 py-1.5 cursor-pointer transition-all hover:opacity-80 ${estado === e ? estadoColor(e) + ' ring-2 ring-offset-1' : 'bg-brand-50 text-brand-400 border-brand-200'}`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Extinto */}
        <div className="card">
          <div className="section-title">Extinto</div>
          <div className="grid grid-cols-2 gap-3">
            <Row label="Nombre completo" value={`${s.ext_apellido}, ${s.ext_nombre}`} />
            <Row label="Documento" value={s.ext_documento} />
            <Row label="Fallecimiento" value={fmtDate(s.ext_fallecio)} />
            <Row label="Nacimiento" value={fmtDate(s.ext_nacimiento)} />
            <Row label="Estado civil" value={s.ext_estado_civil} />
            <Row label="Profesión" value={s.ext_profesion} />
            <Row label="Causa" value={s.ext_causa_fallecimiento} />
            <Row label="Religión" value={s.ext_religion} />
          </div>
          {s.ext_lugar_fallecimiento && <div className="mt-2"><Row label="Lugar de fallecimiento" value={s.ext_lugar_fallecimiento} /></div>}
          {s.ext_domicilio && <div className="mt-2"><Row label="Domicilio real" value={s.ext_domicilio} /></div>}
          <div className="flex gap-4 mt-3">
            <Bool val={s.ext_natural} label="Natural" />
            <Bool val={s.ext_interpol} label="Interpol" />
          </div>
        </div>

        {/* Servicio + Componentes */}
        <div className="card">
          <div className="section-title">Servicio</div>
          <div className="grid grid-cols-2 gap-3">
            <Row label="Velatorio" value={s.tipo_velatorio} />
            <Row label="Destino" value={s.destino} />
            <Row label="Cementerio" value={s.cementerio} />
            <Row label="Sala / Dirección" value={s.sala} />
          </div>
          <div className="flex gap-4 mt-2 mb-3">
            <Bool val={s.sera_velado} label="Velado" />
            <Bool val={s.registro_civil} label="Reg. civil" />
          </div>
          <div className="section-title">Componentes</div>
          <div className="grid grid-cols-2 gap-2">
            {s.ataud_nro && <Row label="Ataúd N°" value={s.ataud_nro} />}
            <Bool val={s.tiene_urna} label="Urna" />
            <Bool val={s.tiene_mortaja} label="Mortaja" />
            <Bool val={s.tiene_ambulancia} label="Ambulancia" />
            <Bool val={s.tiene_azafata} label="Azafata" />
            <Bool val={s.tiene_cafeteria} label="Cafetería" />
            <Bool val={s.tiene_tanatoest} label="Tanatoestética" />
            <Bool val={s.tiene_tanatoprax} label="Tanatopraxia" />
            <Bool val={s.tiene_responso} label="Responso" />
            <Bool val={s.tiene_metalica} label="Metálica" />
          </div>
        </div>

        {/* Responsable */}
        <div className="card">
          <div className="section-title">Responsable contratante</div>
          <div className="grid grid-cols-2 gap-3">
            <Row label="Nombre" value={`${s.resp_apellido}, ${s.resp_nombre}`} />
            <Row label="Parentesco" value={s.resp_parentesco} />
            <Row label="Documento" value={s.resp_documento} />
            <Row label="Nacimiento" value={fmtDate(s.resp_nacimiento)} />
            <Row label="Teléfono" value={s.resp_telefono} />
            <Row label="Celular" value={s.resp_celular} />
            <Row label="E-mail" value={s.resp_email} />
          </div>
          {s.resp_domicilio && <div className="mt-2"><Row label="Domicilio" value={s.resp_domicilio} /></div>}
        </div>

        {/* Valores + Pagos */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="section-title mb-0">Valores y pagos</div>
            <button className="btn btn-sm btn-gold no-print" onClick={() => setPagoModal(true)}>
              <Plus size={13} /> Registrar pago
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Row label="Total (sin IVA)" value={fmtMoney(s.val_total)} />
            <Row label="Urna" value={fmtMoney(s.val_urna)} />
            <Row label="Impuestos" value={fmtMoney(s.val_impuestos)} />
            <Row label="Total c/ impuestos" value={fmtMoney(s.val_total_impuestos)} />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-brand-400 tracking-wide uppercase">Abonado</span>
              <span className="text-sm font-medium text-green-700">{fmtMoney(abonado)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-brand-400 tracking-wide uppercase">Saldo pendiente</span>
              <span className={`text-sm font-semibold ${saldo > 0 ? 'text-red-700' : 'text-green-700'}`}>{fmtMoney(saldo)}</span>
            </div>
          </div>
          {/* Historial pagos */}
          {pagos.length > 0 && (
            <>
              <div className="section-title">Historial de pagos</div>
              <div className="flex flex-col gap-1">
                {pagos.map(p => (
                  <div key={p.id} className="flex items-center gap-2 text-sm py-1.5 border-b border-brand-50 last:border-0">
                    <DollarSign size={13} className="text-brand-400 shrink-0" />
                    <span className="flex-1 text-brand-700">{fmtDate(p.fecha)} — {p.medio}</span>
                    <span className="font-medium text-green-700">{fmtMoney(p.monto)}</span>
                    {p.nota && <span className="text-xs text-brand-400 truncate max-w-[80px]">{p.nota}</span>}
                    <button onClick={() => handleDeletePago(p)} className="text-brand-300 hover:text-red-600 transition-colors no-print"><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Logística */}
      {(s.log_ambulancia1 || s.log_observaciones || s.log_fecha_funebre) && (
        <div className="card mt-4">
          <div className="section-title">Logística</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Row label="Ambulancia 1" value={s.log_ambulancia1} />
            <Row label="Ambulancia 2" value={s.log_ambulancia2} />
            <Row label="Fecha fúnebre" value={fmtDate(s.log_fecha_funebre)} />
            <Row label="Hora fúnebre" value={s.log_hora_funebre} />
            <Row label="Fecha crematorio" value={fmtDate(s.log_fecha_crematorio)} />
            <Row label="Hora crematorio" value={s.log_hora_crematorio} />
          </div>
          {s.log_observaciones && (
            <div className="mt-3 pt-3 border-t border-brand-100">
              <p className="text-xs text-brand-400 uppercase tracking-wider mb-1">Observaciones</p>
              <p className="text-sm whitespace-pre-wrap">{s.log_observaciones}</p>
            </div>
          )}
        </div>
      )}

      {/* Modal registrar pago */}
      <Modal open={pagoModal} onClose={() => setPagoModal(false)} title="Registrar pago" maxWidth="max-w-sm">
        <form onSubmit={handlePago} className="flex flex-col gap-3">
          <Field label="Fecha"><input type="date" className="input" value={nuevoPago.fecha} onChange={e => setNuevoPago(p => ({ ...p, fecha: e.target.value }))} required /></Field>
          <Field label="Monto"><input type="number" className="input" placeholder="500000" value={nuevoPago.monto} onChange={e => setNuevoPago(p => ({ ...p, monto: e.target.value }))} required min={1} /></Field>
          <Field label="Medio de pago">
            <select className="input" value={nuevoPago.medio} onChange={e => setNuevoPago(p => ({ ...p, medio: e.target.value as MedioPago }))}>
              {MEDIOS.map(m => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Nota (opcional)"><input className="input" placeholder="Observación..." value={nuevoPago.nota} onChange={e => setNuevoPago(p => ({ ...p, nota: e.target.value }))} /></Field>
          <div className="flex justify-end gap-2 mt-1">
            <button type="button" className="btn" onClick={() => setPagoModal(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={savingPago}>{savingPago ? 'Guardando...' : 'Registrar'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal eliminar */}
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Eliminar servicio" maxWidth="max-w-sm">
        <p className="text-sm text-brand-700 mb-5">¿Confirmás eliminar el servicio de <strong>{s.ext_apellido}, {s.ext_nombre}</strong>? Esta acción no se puede deshacer.</p>
        <div className="flex justify-end gap-2">
          <button className="btn" onClick={() => setConfirmDelete(false)}>Cancelar</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Eliminando...' : 'Sí, eliminar'}</button>
        </div>
      </Modal>
    </>
  )
}
