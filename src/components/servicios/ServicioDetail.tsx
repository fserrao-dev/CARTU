'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteServicio } from '@/lib/db'
import { fmtDate, fmtMoney } from '@/lib/utils'
import type { Servicio } from '@/types'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { Printer, Trash2, ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

function Row({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-brand-500 tracking-wide">{label}</span>
      <span className="text-sm">{typeof value === 'boolean' ? (value ? 'Sí' : 'No') : value}</span>
    </div>
  )
}

function YesNo({ val, label }: { val: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-sm ${val ? 'text-green-700' : 'text-brand-400'}`}>
      {val ? <CheckCircle size={14} /> : <XCircle size={14} />}
      {label}
    </div>
  )
}

export default function ServicioDetail({ servicio: s }: { servicio: Servicio }) {
  const router = useRouter()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await deleteServicio(s.id)
    router.push('/servicios')
    router.refresh()
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 no-print">
        <Link href="/servicios" className="btn btn-sm">
          <ArrowLeft size={14} /> Volver
        </Link>
        <div className="flex-1" />
        <button className="btn btn-sm" onClick={() => window.print()}>
          <Printer size={14} /> Imprimir orden
        </button>
        <button className="btn btn-sm btn-danger" onClick={() => setConfirmDelete(true)}>
          <Trash2 size={14} /> Eliminar
        </button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-serif text-2xl">Orden #{s.nro_orden}</h3>
          <p className="text-sm text-brand-500">{fmtDate(s.fecha_servicio)} · Asesor: {s.asesor}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Badge variant={s.destino === 'CREMACIÓN' ? 'info' : 'success'}>{s.destino}</Badge>
          <Badge variant={s.cobertura === 'PARTICULAR' ? 'default' : 'gold'}>{s.cobertura}</Badge>
          {(s.val_saldo ?? 0) > 0 && <Badge variant="danger">Saldo: {fmtMoney(s.val_saldo)}</Badge>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Extinto */}
        <div className="card">
          <div className="section-title">Datos del extinto</div>
          <div className="grid grid-cols-2 gap-3">
            <Row label="Nombre completo" value={`${s.ext_apellido}, ${s.ext_nombre}`} />
            <Row label="Documento" value={s.ext_documento} />
            <Row label="Fallecimiento" value={fmtDate(s.ext_fallecio)} />
            <Row label="Nacimiento" value={fmtDate(s.ext_nacimiento)} />
            <Row label="Estado civil" value={s.ext_estado_civil} />
            <Row label="Profesión" value={s.ext_profesion} />
            <Row label="Causa" value={s.ext_causa_fallecimiento} />
            <Row label="Religión" value={s.ext_religion} />
            <Row label="Contextura" value={s.ext_contextura} />
          </div>
          {s.ext_lugar_fallecimiento && <Row label="Lugar de fallecimiento" value={s.ext_lugar_fallecimiento} />}
          {s.ext_domicilio && <div className="mt-2"><Row label="Domicilio real" value={s.ext_domicilio} /></div>}
          <div className="flex gap-4 mt-3">
            <YesNo val={s.ext_natural} label="Natural" />
            <YesNo val={s.ext_interpol} label="Interpol" />
          </div>
        </div>

        {/* Servicio */}
        <div className="card">
          <div className="section-title">Servicio</div>
          <div className="grid grid-cols-2 gap-3">
            <Row label="Tipo de velatorio" value={s.tipo_velatorio} />
            <Row label="Destino" value={s.destino} />
            <Row label="Cementerio" value={s.cementerio} />
            <Row label="Sala / Dirección" value={s.sala} />
          </div>
          <div className="flex gap-4 mt-3">
            <YesNo val={s.sera_velado} label="Velado" />
            <YesNo val={s.registro_civil} label="Reg. civil" />
          </div>
          <hr className="my-3 border-brand-100" />
          <div className="section-title">Componentes</div>
          <div className="grid grid-cols-2 gap-2">
            <Row label="Ataúd N°" value={s.ataud_nro} />
            <YesNo val={s.tiene_urna} label="Urna" />
            <YesNo val={s.tiene_mortaja} label="Mortaja" />
            <YesNo val={s.tiene_ambulancia} label="Ambulancia" />
            <YesNo val={s.tiene_azafata} label="Azafata" />
            <YesNo val={s.tiene_cafeteria} label="Cafetería" />
            <YesNo val={s.tiene_tanatoest} label="Tanatoestética" />
            <YesNo val={s.tiene_tanatoprax} label="Tanatopraxia" />
            <YesNo val={s.tiene_responso} label="Responso" />
            <YesNo val={s.tiene_metalica} label="Metálica" />
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
            <Row label="Estado civil" value={s.resp_estado_civil} />
            <Row label="Teléfono" value={s.resp_telefono} />
            <Row label="Celular" value={s.resp_celular} />
            <Row label="E-mail" value={s.resp_email} />
          </div>
          {s.resp_domicilio && <div className="mt-2"><Row label="Domicilio" value={s.resp_domicilio} /></div>}
        </div>

        {/* Valores */}
        <div className="card">
          <div className="section-title">Valores del servicio</div>
          <div className="grid grid-cols-2 gap-3">
            <Row label="Total (sin IVA)" value={fmtMoney(s.val_total)} />
            <Row label="Urna" value={fmtMoney(s.val_urna)} />
            <Row label="Impuestos" value={fmtMoney(s.val_impuestos)} />
            <Row label="Total c/ impuestos" value={fmtMoney(s.val_total_impuestos)} />
            <Row label="Abonado" value={fmtMoney(s.val_abonado)} />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-brand-500">Saldo pendiente</span>
              <span className={`text-sm font-medium ${(s.val_saldo ?? 0) > 0 ? 'text-red-700' : 'text-green-700'}`}>
                {fmtMoney(s.val_saldo)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Logística */}
      {(s.log_ambulancia1 || s.log_observaciones) && (
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
              <p className="text-xs text-brand-500 mb-1">Observaciones</p>
              <p className="text-sm whitespace-pre-wrap">{s.log_observaciones}</p>
            </div>
          )}
        </div>
      )}

      {/* Confirm delete modal */}
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Eliminar servicio" maxWidth="max-w-sm">
        <p className="text-sm text-brand-700 mb-5">
          ¿Confirmás eliminar el servicio de <strong>{s.ext_apellido}, {s.ext_nombre}</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-2">
          <button className="btn" onClick={() => setConfirmDelete(false)}>Cancelar</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </Modal>
    </>
  )
}
