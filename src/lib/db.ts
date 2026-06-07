import { supabase } from './supabase'
import type { Servicio, StockItem } from '@/types'

// ── SERVICIOS ────────────────────────────────────────────────────────────────

export async function getServicios(): Promise<Servicio[]> {
  const { data, error } = await supabase
    .from('servicios')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getServicio(id: string): Promise<Servicio | null> {
  const { data, error } = await supabase
    .from('servicios')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createServicio(s: Omit<Servicio, 'id' | 'created_at'>): Promise<Servicio> {
  const { data, error } = await supabase
    .from('servicios')
    .insert(s)
    .select()
    .single()
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

// ── STOCK ────────────────────────────────────────────────────────────────────

export async function getStock(): Promise<StockItem[]> {
  const { data, error } = await supabase
    .from('stock')
    .select('*')
    .order('categoria')
  if (error) throw error
  return data ?? []
}

export async function createStockItem(item: Omit<StockItem, 'id' | 'created_at'>): Promise<StockItem> {
  const { data, error } = await supabase
    .from('stock')
    .insert(item)
    .select()
    .single()
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

export async function ajustarCantidad(id: string, delta: number): Promise<void> {
  const { data: item } = await supabase.from('stock').select('cantidad').eq('id', id).single()
  if (!item) return
  const nueva = Math.max(0, item.cantidad + delta)
  await supabase.from('stock').update({ cantidad: nueva }).eq('id', id)
}
