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
