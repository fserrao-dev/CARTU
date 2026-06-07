'use client'
import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Servicio, Sala, Vehiculo } from '@/types'
import { estadoColor, fmtDate, initiales } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { createSala, updateSala, createVehiculo, updateVehiculo } from '@/lib/db'
import { useToast } from '@/components/ui/ToastProvider'
import { ChevronLeft, ChevronRight, Plus, Building2, Truck } from 'lucide-react'
import Link from 'next/link'

type Tab = 'calendario' | 'salas' | 'vehiculos'

export default function AgendaView({ servicios, salas: initialSalas, vehiculos: initialVehiculos }: { servicios: Servicio[]; salas: Sala[]; vehiculos: Vehiculo[] }) {
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('calendario')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [salas, setSalas] = useState(initialSalas)
  const [vehiculos, setVehiculos] = useState(initialVehiculos)
  const [salaModal, setSalaModal] = useState(false)
  const [vehiculoModal, setVehiculoModal] = useState(false)
  const [newSala, setNewSala] = useState({ nombre: '', capacidad: '', activa: true })
  const [newVeh, setNewVeh] = useState({ nombre: '', patente: '', tipo: 'AMBULANCIA' as Vehiculo['tipo'], activo: true })
  const [saving, setSaving] = useState(false)

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const firstDayOfWeek = (startOfMonth(currentMonth).getDay() + 6) % 7 // lunes = 0

  function serviciosDelDia(day: Date) {
    return servicios.filter(s => s.fecha_servicio && isSameDay(parseISO(s.fecha_servicio), day))
  }

  const selectedServicios = selectedDay ? serviciosDelDia(selectedDay) : []

  async function addSala() {
    if (!newSala.nombre) return
    setSaving(true)
    const s = await createSala({ nombre: newSala.nombre, capacidad: newSala.capacidad ? Number(newSala.capacidad) : undefined, activa: newSala.activa })
    setSalas(prev => [...prev, s])
    setSalaModal(false)
    setNewSala({ nombre: '', capacidad: '', activa: true })
    toast('Sala agregada')
    setSaving(false)
  }

  async function toggleSala(sala: Sala) {
    await updateSala(sala.id, { activa: !sala.activa })
    setSalas(prev => prev.map(s => s.id === sala.id ? { ...s, activa: !s.activa } : s))
  }

  async function addVehiculo() {
    if (!newVeh.nombre) return
    setSaving(true)
    const v = await createVehiculo({ nombre: newVeh.nombre, patente: newVeh.patente, tipo: newVeh.tipo, activo: newVeh.activo })
    setVehiculos(prev => [...prev, v])
    setVehiculoModal(false)
    setNewVeh({ nombre: '', patente: '', tipo: 'AMBULANCIA', activo: true })
    toast('Vehículo agregado')
    setSaving(false)
  }

  async function toggleVehiculo(veh: Vehiculo) {
    await updateVehiculo(veh.id, { activo: !veh.activo })
    setVehiculos(prev => prev.map(v => v.id === veh.id ? { ...v, activo: !v.activo } : v))
  }

  const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-white border border-brand-100 rounded-xl p-1 w-fit">
        {(['calendario', 'salas', 'vehiculos'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 text-sm rounded-lg transition-all capitalize ${tab === t ? 'bg-brand-900 text-white' : 'text-brand-500 hover:bg-brand-50'}`}>
            {t === 'vehiculos' ? 'Vehículos' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* CALENDARIO */}
      {tab === 'calendario' && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg capitalize">{format(currentMonth, 'MMMM yyyy', { locale: es })}</h3>
              <div className="flex gap-1">
                <button className="btn btn-sm p-1.5" onClick={() => setCurrentMonth(m => subMonths(m, 1))}><ChevronLeft size={16} /></button>
                <button className="btn btn-sm" onClick={() => setCurrentMonth(new Date())}>Hoy</button>
                <button className="btn btn-sm p-1.5" onClick={() => setCurrentMonth(m => addMonths(m, 1))}><ChevronRight size={16} /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {DIAS.map(d => <div key={d} className="text-center text-xs text-brand-400 py-1 font-medium">{d}</div>)}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
              {days.map(day => {
                const svcs = serviciosDelDia(day)
                const isSelected = selectedDay && isSameDay(day, selectedDay)
                const isToday = isSameDay(day, new Date())
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`min-h-[52px] p-1 rounded-lg text-left transition-all border ${isSelected ? 'bg-brand-900 border-brand-900' : isToday ? 'bg-gold-50 border-gold-200' : 'border-transparent hover:bg-brand-50 hover:border-brand-100'}`}
                  >
                    <span className={`text-xs font-medium block mb-1 ${isSelected ? 'text-white' : isToday ? 'text-gold-500' : 'text-brand-700'}`}>
                      {format(day, 'd')}
                    </span>
                    {svcs.slice(0, 2).map(s => (
                      <div key={s.id} className={`text-xs rounded px-1 truncate mb-0.5 ${isSelected ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-700'}`}>
                        {s.ext_apellido}
                      </div>
                    ))}
                    {svcs.length > 2 && <div className={`text-xs ${isSelected ? 'text-white/70' : 'text-brand-400'}`}>+{svcs.length - 2}</div>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Panel lateral */}
          <div className="card">
            {selectedDay ? (
              <>
                <h3 className="font-serif text-lg mb-3 capitalize">{format(selectedDay, "d 'de' MMMM", { locale: es })}</h3>
                {selectedServicios.length === 0 && <p className="text-sm text-brand-400 py-4 text-center">Sin servicios este día</p>}
                <div className="flex flex-col gap-2">
                  {selectedServicios.map(s => (
                    <Link key={s.id} href={`/servicios/${s.id}`} className="p-3 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{s.ext_apellido}, {s.ext_nombre}</span>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        <span className={`badge border text-xs ${estadoColor(s.estado)}`}>{s.estado}</span>
                        <Badge variant={s.destino === 'CREMACIÓN' ? 'info' : 'success'}>{s.destino}</Badge>
                      </div>
                      <p className="text-xs text-brand-400 mt-1">#{s.nro_orden} · {s.asesor}</p>
                      {s.log_hora_funebre && <p className="text-xs text-brand-500 mt-0.5">🕐 Fúnebre: {s.log_hora_funebre}</p>}
                      {s.log_hora_crematorio && <p className="text-xs text-brand-500">⚱️ Crematorio: {s.log_hora_crematorio}</p>}
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h3 className="font-serif text-lg mb-3">Este mes</h3>
                <p className="font-serif text-4xl text-brand-900 mb-1">{servicios.filter(s => s.fecha_servicio?.startsWith(format(currentMonth, 'yyyy-MM'))).length}</p>
                <p className="text-sm text-brand-400">servicios programados</p>
                <div className="divider" />
                <p className="text-xs text-brand-400 mb-2">Próximos 7 días</p>
                {servicios
                  .filter(s => {
                    if (!s.fecha_servicio) return false
                    const d = parseISO(s.fecha_servicio)
                    const now = new Date()
                    const in7 = new Date(now); in7.setDate(in7.getDate() + 7)
                    return d >= now && d <= in7
                  })
                  .slice(0, 4)
                  .map(s => (
                    <Link key={s.id} href={`/servicios/${s.id}`} className="flex items-center gap-2 py-2 border-b border-brand-50 last:border-0 hover:bg-brand-50 rounded px-1 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-xs font-semibold text-brand-600 shrink-0">
                        {initiales(s.ext_apellido, s.ext_nombre)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{s.ext_apellido}</p>
                        <p className="text-xs text-brand-400">{fmtDate(s.fecha_servicio)}</p>
                      </div>
                    </Link>
                  ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* SALAS */}
      {tab === 'salas' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg">Salas velatorias</h3>
            <button className="btn btn-sm btn-gold" onClick={() => setSalaModal(true)}><Plus size={14} /> Agregar sala</button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {salas.map(sala => (
              <div key={sala.id} className="border border-brand-100 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{sala.nombre}</p>
                    {sala.capacidad && <p className="text-xs text-brand-400">Cap: {sala.capacidad} personas</p>}
                  </div>
                  <Badge variant={sala.activa ? 'success' : 'default'}>{sala.activa ? 'Activa' : 'Inactiva'}</Badge>
                </div>
                <button onClick={() => toggleSala(sala)} className="btn btn-xs w-full justify-center mt-2">
                  {sala.activa ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            ))}
            {salas.length === 0 && <p className="text-sm text-brand-400 col-span-3 py-6 text-center">Sin salas registradas</p>}
          </div>
        </div>
      )}

      {/* VEHÍCULOS */}
      {tab === 'vehiculos' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg">Vehículos</h3>
            <button className="btn btn-sm btn-gold" onClick={() => setVehiculoModal(true)}><Plus size={14} /> Agregar vehículo</button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {vehiculos.map(v => (
              <div key={v.id} className="border border-brand-100 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{v.nombre}</p>
                    <p className="text-xs text-brand-400">{v.tipo}{v.patente ? ` · ${v.patente}` : ''}</p>
                  </div>
                  <Badge variant={v.activo ? 'success' : 'default'}>{v.activo ? 'Activo' : 'Inactivo'}</Badge>
                </div>
                <button onClick={() => toggleVehiculo(v)} className="btn btn-xs w-full justify-center mt-2">
                  {v.activo ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            ))}
            {vehiculos.length === 0 && <p className="text-sm text-brand-400 col-span-3 py-6 text-center">Sin vehículos registrados</p>}
          </div>
        </div>
      )}

      <Modal open={salaModal} onClose={() => setSalaModal(false)} title="Agregar sala" maxWidth="max-w-sm">
        <div className="flex flex-col gap-3">
          <div><label className="label">Nombre</label><input className="input" value={newSala.nombre} onChange={e => setNewSala(p => ({ ...p, nombre: e.target.value }))} placeholder="Sala 1 / Celestial" /></div>
          <div><label className="label">Capacidad</label><input className="input" type="number" value={newSala.capacidad} onChange={e => setNewSala(p => ({ ...p, capacidad: e.target.value }))} placeholder="50 personas" /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn" onClick={() => setSalaModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={addSala} disabled={saving}>{saving ? 'Guardando...' : 'Agregar'}</button>
        </div>
      </Modal>

      <Modal open={vehiculoModal} onClose={() => setVehiculoModal(false)} title="Agregar vehículo" maxWidth="max-w-sm">
        <div className="flex flex-col gap-3">
          <div><label className="label">Nombre</label><input className="input" value={newVeh.nombre} onChange={e => setNewVeh(p => ({ ...p, nombre: e.target.value }))} placeholder="Ambulancia 1" /></div>
          <div><label className="label">Patente</label><input className="input" value={newVeh.patente} onChange={e => setNewVeh(p => ({ ...p, patente: e.target.value }))} placeholder="ABC 123" /></div>
          <div><label className="label">Tipo</label>
            <select className="input" value={newVeh.tipo} onChange={e => setNewVeh(p => ({ ...p, tipo: e.target.value as Vehiculo['tipo'] }))}>
              <option>AMBULANCIA</option><option>FÚNEBRE</option><option>OTRO</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn" onClick={() => setVehiculoModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={addVehiculo} disabled={saving}>{saving ? 'Guardando...' : 'Agregar'}</button>
        </div>
      </Modal>
    </>
  )
}
