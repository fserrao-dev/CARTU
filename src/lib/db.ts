import { supabase } from './supabase'
import type { Servicio, PagoServicio, StockItem, MovimientoStock, Contacto, Sala, Vehiculo } from '@/types'

// ── SERVICIOS ────────────────────────────────────────────────────────────────
export async function getServicios(): Promise<Servicio[]> {
  const { data, error } = await supabase.from('servicios').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getServicio(id: string): Promise<Servicio | null> {
  const { data, error } = await supabase.from('servicios').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createServicio(s: Omit<Servicio, 'id' | 'created_at'>): Promise<Servicio> {
  const { data, error } = await supabase.from('servicios').insert(s).select().single()
  if (error) throw error
  return data
}

export async function updateServicio(id: string, s: Partial<Servicio>): Promise<void> {
  const { error } = await supabase.from('servicios').update(s).eq('id', id)
  if (error) throw error
}

export async function deleteServicio(id: string): Promise<void> {
  const { error } = await supabase.from('servicios').delete().eq('id', id)
  if (error) throw error
}

// ── PAGOS ────────────────────────────────────────────────────────────────────
export async function getPagos(servicioId: string): Promise<PagoServicio[]> {
  const { data, error } = await supabase.from('pagos').select('*').eq('servicio_id', servicioId).order('fecha', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createPago(p: Omit<PagoServicio, 'id' | 'created_at'>): Promise<PagoServicio> {
  const { data, error } = await supabase.from('pagos').insert(p).select().single()
  if (error) throw error
  // Actualizar saldo en servicio
  const { data: svc } = await supabase.from('servicios').select('val_abonado, val_total_impuestos').eq('id', p.servicio_id).single()
  if (svc) {
    const nuevoAbonado = (svc.val_abonado ?? 0) + p.monto
    const nuevoSaldo = Math.max(0, (svc.val_total_impuestos ?? 0) - nuevoAbonado)
    await supabase.from('servicios').update({ val_abonado: nuevoAbonado, val_saldo: nuevoSaldo }).eq('id', p.servicio_id)
  }
  return data
}

export async function deletePago(id: string, servicioId: string, monto: number): Promise<void> {
  const { error } = await supabase.from('pagos').delete().eq('id', id)
  if (error) throw error
  const { data: svc } = await supabase.from('servicios').select('val_abonado, val_total_impuestos').eq('id', servicioId).single()
  if (svc) {
    const nuevoAbonado = Math.max(0, (svc.val_abonado ?? 0) - monto)
    const nuevoSaldo = Math.max(0, (svc.val_total_impuestos ?? 0) - nuevoAbonado)
    await supabase.from('servicios').update({ val_abonado: nuevoAbonado, val_saldo: nuevoSaldo }).eq('id', servicioId)
  }
}

// ── STOCK ────────────────────────────────────────────────────────────────────
export async function getStock(): Promise<StockItem[]> {
  const { data, error } = await supabase.from('stock').select('*').order('categoria')
  if (error) throw error
  return data ?? []
}

export async function createStockItem(item: Omit<StockItem, 'id' | 'created_at'>): Promise<StockItem> {
  const { data, error } = await supabase.from('stock').insert(item).select().single()
  if (error) throw error
  return data
}

export async function updateStockItem(id: string, item: Partial<StockItem>): Promise<void> {
  const { error } = await supabase.from('stock').update(item).eq('id', id)
  if (error) throw error
}

export async function deleteStockItem(id: string): Promise<void> {
  const { error } = await supabase.from('stock').delete().eq('id', id)
  if (error) throw error
}

export async function ajustarCantidad(id: string, delta: number, motivo?: string, usuario?: string): Promise<void> {
  const { data: item } = await supabase.from('stock').select('cantidad').eq('id', id).single()
  if (!item) return
  const nueva = Math.max(0, item.cantidad + delta)
  await supabase.from('stock').update({ cantidad: nueva }).eq('id', id)
  await supabase.from('movimientos_stock').insert({
    stock_id: id, tipo: delta > 0 ? 'ENTRADA' : 'SALIDA',
    cantidad: Math.abs(delta), motivo, usuario
  })
}

export async function getMovimientosStock(stockId?: string): Promise<MovimientoStock[]> {
  let q = supabase.from('movimientos_stock').select('*').order('created_at', { ascending: false })
  if (stockId) q = q.eq('stock_id', stockId)
  const { data, error } = await q.limit(100)
  if (error) throw error
  return data ?? []
}

// ── CONTACTOS ────────────────────────────────────────────────────────────────
export async function getContactos(tipo?: string): Promise<Contacto[]> {
  let q = supabase.from('contactos').select('*').order('nombre')
  if (tipo) q = q.eq('tipo', tipo)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

export async function createContacto(c: Omit<Contacto, 'id' | 'created_at'>): Promise<Contacto> {
  const { data, error } = await supabase.from('contactos').insert(c).select().single()
  if (error) throw error
  return data
}

export async function updateContacto(id: string, c: Partial<Contacto>): Promise<void> {
  const { error } = await supabase.from('contactos').update(c).eq('id', id)
  if (error) throw error
}

export async function deleteContacto(id: string): Promise<void> {
  const { error } = await supabase.from('contactos').delete().eq('id', id)
  if (error) throw error
}

// ── SALAS ────────────────────────────────────────────────────────────────────
export async function getSalas(): Promise<Sala[]> {
  const { data, error } = await supabase.from('salas').select('*').order('nombre')
  if (error) throw error
  return data ?? []
}

export async function createSala(s: Omit<Sala, 'id'>): Promise<Sala> {
  const { data, error } = await supabase.from('salas').insert(s).select().single()
  if (error) throw error
  return data
}

export async function updateSala(id: string, s: Partial<Sala>): Promise<void> {
  const { error } = await supabase.from('salas').update(s).eq('id', id)
  if (error) throw error
}

// ── VEHÍCULOS ────────────────────────────────────────────────────────────────
export async function getVehiculos(): Promise<Vehiculo[]> {
  const { data, error } = await supabase.from('vehiculos').select('*').order('nombre')
  if (error) throw error
  return data ?? []
}

export async function createVehiculo(v: Omit<Vehiculo, 'id'>): Promise<Vehiculo> {
  const { data, error } = await supabase.from('vehiculos').insert(v).select().single()
  if (error) throw error
  return data
}

export async function updateVehiculo(id: string, v: Partial<Vehiculo>): Promise<void> {
  const { error } = await supabase.from('vehiculos').update(v).eq('id', id)
  if (error) throw error
}

// ── EGRESOS ──────────────────────────────────────────────────────────────────
export async function getEgresos(mes?: string): Promise<import('@/types').Egreso[]> {
  let q = supabase.from('egresos').select('*').order('fecha', { ascending: false })
  if (mes) q = q.gte('fecha', mes + '-01').lt('fecha', nextMonth(mes) + '-01')
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

export async function createEgreso(e: Omit<import('@/types').Egreso, 'id' | 'created_at'>): Promise<import('@/types').Egreso> {
  const { data, error } = await supabase.from('egresos').insert(e).select().single()
  if (error) throw error
  return data
}

export async function updateEgreso(id: string, e: Partial<import('@/types').Egreso>): Promise<void> {
  const { error } = await supabase.from('egresos').update(e).eq('id', id)
  if (error) throw error
}

export async function deleteEgreso(id: string): Promise<void> {
  const { error } = await supabase.from('egresos').delete().eq('id', id)
  if (error) throw error
}

// ── COBRANZAS OS ─────────────────────────────────────────────────────────────
export async function getCobranzasOS(): Promise<import('@/types').CobranzaOS[]> {
  const { data, error } = await supabase.from('cobranzas_os').select('*').order('fecha_presentacion', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createCobranzaOS(c: Omit<import('@/types').CobranzaOS, 'id' | 'created_at'>): Promise<import('@/types').CobranzaOS> {
  const { data, error } = await supabase.from('cobranzas_os').insert(c).select().single()
  if (error) throw error
  return data
}

export async function updateCobranzaOS(id: string, c: Partial<import('@/types').CobranzaOS>): Promise<void> {
  const { error } = await supabase.from('cobranzas_os').update(c).eq('id', id)
  if (error) throw error
}

export async function deleteCobranzaOS(id: string): Promise<void> {
  const { error } = await supabase.from('cobranzas_os').delete().eq('id', id)
  if (error) throw error
}

// ── GASTOS FIJOS ─────────────────────────────────────────────────────────────
export async function getGastosFijos(): Promise<import('@/types').GastoFijo[]> {
  const { data, error } = await supabase.from('gastos_fijos').select('*').order('nombre')
  if (error) throw error
  return data ?? []
}

export async function createGastoFijo(g: Omit<import('@/types').GastoFijo, 'id'>): Promise<import('@/types').GastoFijo> {
  const { data, error } = await supabase.from('gastos_fijos').insert(g).select().single()
  if (error) throw error
  return data
}

export async function updateGastoFijo(id: string, g: Partial<import('@/types').GastoFijo>): Promise<void> {
  const { error } = await supabase.from('gastos_fijos').update(g).eq('id', id)
  if (error) throw error
}

export async function deleteGastoFijo(id: string): Promise<void> {
  const { error } = await supabase.from('gastos_fijos').delete().eq('id', id)
  if (error) throw error
}

// helper
function nextMonth(mes: string): string {
  const [y, m] = mes.split('-').map(Number)
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
}

// ── EMPLEADOS ────────────────────────────────────────────────────────────────
export async function getEmpleados(): Promise<import('@/types').Empleado[]> {
  const { data, error } = await supabase
    .from('empleados').select('*').order('apellido')
  if (error) throw error
  return data ?? []
}

export async function createEmpleado(e: Omit<import('@/types').Empleado, 'id' | 'created_at'>): Promise<import('@/types').Empleado> {
  const { data, error } = await supabase.from('empleados').insert(e).select().single()
  if (error) throw error
  return data
}

export async function updateEmpleado(id: string, e: Partial<import('@/types').Empleado>): Promise<void> {
  const { error } = await supabase.from('empleados').update(e).eq('id', id)
  if (error) throw error
}

export async function deleteEmpleado(id: string): Promise<void> {
  const { error } = await supabase.from('empleados').delete().eq('id', id)
  if (error) throw error
}
