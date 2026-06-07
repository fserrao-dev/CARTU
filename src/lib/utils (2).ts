import { format, parseISO, differenceInYears } from 'date-fns'
import { es } from 'date-fns/locale'
import { clsx, type ClassValue } from 'clsx'
import type { EstadoServicio } from '@/types'

export function cn(...inputs: ClassValue[]) { return clsx(inputs) }

export function fmtDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  try { return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: es }) }
  catch { return dateStr }
}

export function fmtDateLong(dateStr?: string | null): string {
  if (!dateStr) return '—'
  try { return format(parseISO(dateStr), "d 'de' MMMM 'de' yyyy", { locale: es }) }
  catch { return dateStr }
}

export function fmtMoney(val?: number | null): string {
  if (val === null || val === undefined) return '—'
  return '$' + val.toLocaleString('es-AR')
}

export function fmtMoneyShort(val?: number | null): string {
  if (val === null || val === undefined) return '—'
  if (val >= 1_000_000) return '$' + (val / 1_000_000).toFixed(1) + 'M'
  if (val >= 1_000) return '$' + (val / 1_000).toFixed(0) + 'k'
  return '$' + val
}

export function calcEdad(nacimiento?: string | null, fallecimiento?: string | null): number | null {
  if (!nacimiento) return null
  try {
    const ref = fallecimiento ? parseISO(fallecimiento) : new Date()
    return differenceInYears(ref, parseISO(nacimiento))
  } catch { return null }
}

export function initiales(apellido?: string, nombre?: string): string {
  return ((apellido?.[0] ?? '') + (nombre?.[0] ?? '')).toUpperCase() || '?'
}

export function estadoColor(estado: EstadoServicio): string {
  switch (estado) {
    case 'PENDIENTE':   return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'EN CURSO':    return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'COMPLETADO':  return 'bg-green-50 text-green-700 border-green-200'
    case 'CANCELADO':   return 'bg-red-50 text-red-700 border-red-200'
    default:            return 'bg-brand-100 text-brand-700 border-brand-200'
  }
}

export function mesNombre(mes: number): string {
  return format(new Date(2024, mes - 1, 1), 'MMM', { locale: es })
}
