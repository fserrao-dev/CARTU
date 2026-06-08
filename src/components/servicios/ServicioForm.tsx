'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createServicio, updateServicio } from '@/lib/db'
import { Field, FormSection, CheckField } from '@/components/ui/Field'
import { useToast } from '@/components/ui/ToastProvider'
import { FileText, User, MapPin, Users, Package, DollarSign, Truck, Activity } from 'lucide-react'
import type { Servicio, EstadoServicio } from '@/types'

type FormData = Omit<Servicio, 'id' | 'created_at'>

const DEFAULT: FormData = {
  nro_orden: '', fecha_servicio: new Date().toISOString().slice(0, 10),
  asesor: '', cobertura: 'PARTICULAR', estado: 'PENDIENTE',
  ext_nombre: '', ext_apellido: '', ext_documento: '',
  ext_fallecio: '', ext_nacimiento: '', ext_nacionalidad: 'ARGENTINA',
  ext_estado_civil: 'SOLTERO/A', ext_profesion: '', ext_causa_fallecimiento: '',
  ext_religion: 'CATÓLICA', ext_contextura: 'NORMAL',
  ext_lugar_fallecimiento: '', ext_domicilio: '',
  ext_natural: true, ext_interpol: false,
  tipo_velatorio: 'DESPEDIDA 5 HORAS', destino: 'CREMACIÓN',
  cementerio: '', sala: '', sera_velado: true, registro_civil: false,
  resp_nombre: '', resp_apellido: '', resp_documento: '',
  resp_parentesco: 'HIJO/A', resp_telefono: '', resp_celular: '',
  resp_nacimiento: '', resp_nacionalidad: 'ARGENTINA',
  resp_estado_civil: 'SOLTERO/A', resp_domicilio: '', resp_email: '',
  ataud_nro: '', tiene_urna: false, tiene_mortaja: false,
  tiene_metalica: false, tiene_azafata: false, tiene_cafeteria: false,
  tiene_tanatoest: false, tiene_tanatoprax: false,
  tiene_responso: false, tiene_ambulancia: true,
  val_total: undefined, val_urna: undefined, val_impuestos: 0,
  val_total_impuestos: undefined, val_abonado: undefined, val_saldo: undefined,
  log_ambulancia1: '', log_ambulancia2: '',
  log_fecha_funebre: '', log_hora_funebre: '',
  log_fecha_crematorio: '', log_hora_crematorio: '',
  log_observaciones: '',
}

interface Props {
  asesores?: import('@/types').Empleado[]
  initialData?: Servicio
  mode?: 'create' | 'edit'
}

export default function ServicioForm({ initialData, mode = 'create', asesores = [] }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [form, setForm] = useState<FormData>(initialData ? { ...DEFAULT, ...initialData } : DEFAULT)
  const [saving, setSaving] = useState(false)

  const set = (field: keyof FormData, value: unknown) =>
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'val_total_impuestos' || field === 'val_abonado' || field === 'val_total' || field === 'val_impuestos') {
        const total = Number(next.val_total_impuestos ?? (Number(next.val_total ?? 0) + Number(next.val_impuestos ?? 0))) || 0
        const abonado = Number(next.val_abonado) || 0
        next.val_saldo = Math.max(0, total - abonado)
        if (!next.val_total_impuestos && next.val_total) {
          next.val_total_impuestos = Number(next.val_total) + Number(next.val_impuestos ?? 0)
        }
      }
      return next
    })

  const inp = (field: keyof FormData) => ({
    className: 'input',
    value: (form[field] as string) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => set(field, e.target.value),
  })

  const num = (field: keyof FormData) => ({
    className: 'input',
    type: 'number' as const,
    value: (form[field] as number) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(field, e.target.value === '' ? undefined : Number(e.target.value)),
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.ext_apellido && !form.ext_nombre) { toast('Ingresá al menos el nombre del extinto', 'error'); return }
    setSaving(true)
    try {
      if (mode === 'edit' && initialData) {
        await updateServicio(initialData.id, form)
        toast('Servicio actualizado')
        router.push(`/servicios/${initialData.id}`)
      } else {
        const s = await createServicio(form)
        toast('Servicio creado correctamente')
        router.push(`/servicios/${s.id}`)
      }
      router.refresh()
    } catch (err) {
      console.error(err)
      toast('Error al guardar', 'error')
      setSaving(false)
    }
  }

  const ESTADOS: EstadoServicio[] = ['PENDIENTE', 'EN CURSO', 'COMPLETADO', 'CANCELADO']

  return (
    <form onSubmit={handleSubmit}>
      <FormSection title="Datos del servicio" icon={<FileText size={14} />}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Field label="N° Orden"><input {...inp('nro_orden')} placeholder="4446" /></Field>
          <Field label="Fecha"><input type="date" {...inp('fecha_servicio')} /></Field>
          <Field label="Asesor">
            {asesores.length > 0 ? (
              <select {...inp('asesor')}>
                <option value="">— Seleccioná un asesor —</option>
                {asesores.map(a => (
                  <option key={a.id} value={`${a.nombre} ${a.apellido}`}>{a.apellido}, {a.nombre}</option>
                ))}
                <option value="__otro">Otro (escribir)</option>
              </select>
            ) : (
              <input {...inp('asesor')} placeholder="Nombre del asesor" />
            )}
          </Field>
          <Field label="Cobertura">
            <select {...inp('cobertura')}>
              {['PARTICULAR','OBRA SOCIAL','MUTUAL','PREPAGA'].map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Estado">
            <select {...inp('estado')}>
              {ESTADOS.map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>
        </div>
        {form.cobertura !== 'PARTICULAR' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-brand-100">
            <Field label="Titular"><input {...inp('titular')} /></Field>
            <Field label="Código"><input {...inp('codigo_cobertura')} /></Field>
            <Field label="Legajo"><input {...inp('legajo')} /></Field>
            <Field label="Sección"><input {...inp('seccion')} /></Field>
          </div>
        )}
      </FormSection>

      <FormSection title="Datos del extinto" icon={<User size={14} />}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Nombre" required><input {...inp('ext_nombre')} placeholder="Jesús Antonio" /></Field>
          <Field label="Apellido" required><input {...inp('ext_apellido')} placeholder="Lencina" /></Field>
          <Field label="Documento"><input {...inp('ext_documento')} placeholder="M7531536" /></Field>
          <Field label="Fecha fallecimiento"><input type="date" {...inp('ext_fallecio')} /></Field>
          <Field label="Fecha nacimiento"><input type="date" {...inp('ext_nacimiento')} /></Field>
          <Field label="Nacionalidad"><input {...inp('ext_nacionalidad')} /></Field>
          <Field label="Estado civil">
            <select {...inp('ext_estado_civil')}>
              {['SOLTERO/A','CASADO/A','VIUDO/A','DIVORCIADO/A'].map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Profesión"><input {...inp('ext_profesion')} /></Field>
          <Field label="Causa de fallecimiento"><input {...inp('ext_causa_fallecimiento')} placeholder="PCR" /></Field>
          <Field label="Religión"><input {...inp('ext_religion')} /></Field>
          <Field label="Contextura">
            <select {...inp('ext_contextura')}>
              {['NORMAL','DELGADO/A','ROBUSTO/A'].map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <Field label="Lugar de fallecimiento"><input {...inp('ext_lugar_fallecimiento')} placeholder="Dirección completa" /></Field>
          <Field label="Domicilio real"><input {...inp('ext_domicilio')} placeholder="Calle, número, ciudad" /></Field>
        </div>
        <div className="flex gap-5 mt-3">
          <CheckField label="Natural" checked={form.ext_natural} onChange={v => set('ext_natural', v)} />
          <CheckField label="Interpol" checked={form.ext_interpol} onChange={v => set('ext_interpol', v)} />
        </div>
      </FormSection>

      <FormSection title="Datos del servicio" icon={<MapPin size={14} />}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Tipo de velatorio">
            <select {...inp('tipo_velatorio')}>
              {['DESPEDIDA 5 HORAS','VELATORIO 12 HORAS','VELATORIO 24 HORAS','SIN VELATORIO'].map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Destino">
            <select {...inp('destino')}>
              {['CREMACIÓN','INHUMACIÓN'].map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Cementerio"><input {...inp('cementerio')} placeholder="Boulogne" /></Field>
          <Field label="Sala / Dirección"><input {...inp('sala')} placeholder="Celestial 17-20" /></Field>
        </div>
        <div className="flex gap-5 mt-3">
          <CheckField label="Será velado" checked={form.sera_velado} onChange={v => set('sera_velado', v)} />
          <CheckField label="Registro civil" checked={form.registro_civil} onChange={v => set('registro_civil', v)} />
        </div>
      </FormSection>

      <FormSection title="Responsable contratante" icon={<Users size={14} />}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Nombre" required><input {...inp('resp_nombre')} placeholder="Fernanda" /></Field>
          <Field label="Apellido" required><input {...inp('resp_apellido')} placeholder="Lencina" /></Field>
          <Field label="Documento"><input {...inp('resp_documento')} placeholder="33.958.983" /></Field>
          <Field label="Parentesco">
            <select {...inp('resp_parentesco')}>
              {['HIJO/A','CÓNYUGE','HERMANO/A','PADRE/MADRE','NIETO/A','OTRO'].map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Teléfono"><input {...inp('resp_telefono')} type="tel" placeholder="1121817863" /></Field>
          <Field label="Celular"><input {...inp('resp_celular')} type="tel" placeholder="1141612333" /></Field>
          <Field label="Nacimiento"><input type="date" {...inp('resp_nacimiento')} /></Field>
          <Field label="Nacionalidad"><input {...inp('resp_nacionalidad')} /></Field>
          <Field label="Estado civil">
            <select {...inp('resp_estado_civil')}>
              {['SOLTERO/A','CASADO/A','VIUDO/A','DIVORCIADO/A'].map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid md:grid-cols-2 gap-3 mt-3">
          <Field label="Domicilio"><input {...inp('resp_domicilio')} /></Field>
          <Field label="E-mail"><input {...inp('resp_email')} type="email" /></Field>
        </div>
      </FormSection>

      <FormSection title="Componentes del servicio" icon={<Package size={14} />}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Ataúd N°"><input {...inp('ataud_nro')} placeholder="2004" /></Field>
          <Field label="Urna">
            <select className="input" value={form.tiene_urna ? 'SÍ' : 'NO'} onChange={e => set('tiene_urna', e.target.value === 'SÍ')}>
              <option>NO</option><option>SÍ</option>
            </select>
          </Field>
          <Field label="Mortaja">
            <select className="input" value={form.tiene_mortaja ? 'SÍ' : 'NO'} onChange={e => set('tiene_mortaja', e.target.value === 'SÍ')}>
              <option>NO</option><option>SÍ</option>
            </select>
          </Field>
        </div>
        <div className="flex flex-wrap gap-5 mt-3">
          {([['tiene_metalica','Metálica'],['tiene_azafata','Azafata'],['tiene_cafeteria','Cafetería'],['tiene_tanatoest','Tanatoestética'],['tiene_tanatoprax','Tanatopraxia'],['tiene_responso','Responso'],['tiene_ambulancia','Ambulancia']] as [keyof FormData, string][]).map(([f, l]) => (
            <CheckField key={f} label={l} checked={Boolean(form[f])} onChange={v => set(f, v)} />
          ))}
        </div>
      </FormSection>

      <FormSection title="Valores (sin IVA)" icon={<DollarSign size={14} />}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Total"><input {...num('val_total')} placeholder="1260000" /></Field>
          <Field label="Urna (valor)"><input {...num('val_urna')} placeholder="420000" /></Field>
          <Field label="Impuestos"><input {...num('val_impuestos')} placeholder="0" /></Field>
          <Field label="Total c/ impuestos"><input {...num('val_total_impuestos')} placeholder="1680000" /></Field>
          <Field label="Abonado"><input {...num('val_abonado')} placeholder="0" /></Field>
          <Field label="Saldo pendiente">
            <input className="input bg-brand-50" readOnly value={form.val_saldo ?? ''} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Logística y material de calle" icon={<Truck size={14} />}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Ambulancia 1"><input {...inp('log_ambulancia1')} placeholder="Ángel Geriátrico Santa" /></Field>
          <Field label="Ambulancia 2"><input {...inp('log_ambulancia2')} /></Field>
          <Field label="Fecha fúnebre"><input type="date" {...inp('log_fecha_funebre')} /></Field>
          <Field label="Hora fúnebre"><input type="time" {...inp('log_hora_funebre')} /></Field>
          <Field label="Fecha crematorio/cementerio"><input type="date" {...inp('log_fecha_crematorio')} /></Field>
          <Field label="Hora crematorio/cementerio"><input type="time" {...inp('log_hora_crematorio')} /></Field>
        </div>
        <Field label="Observaciones" className="mt-3">
          <textarea className="input" rows={3} value={form.log_observaciones ?? ''} onChange={e => set('log_observaciones', e.target.value)} placeholder="Notas adicionales..." />
        </Field>
      </FormSection>

      <div className="flex justify-end gap-3 pb-8">
        <button type="button" className="btn" onClick={() => router.back()}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Guardando...' : mode === 'edit' ? '💾 Guardar cambios' : '💾 Crear servicio'}
        </button>
      </div>
    </form>
  )
}
