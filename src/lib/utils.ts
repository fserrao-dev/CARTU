import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function fmtDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  try { return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: es }) }
  catch { return dateStr }
}

export function fmtMoney(val?: number | null): string {
  if (val === null || val === undefined) return '—'
  return '$' + val.toLocaleString('es-AR')
}

export function initiales(apellido?: string, nombre?: string): string {
  return ((apellido?.[0] ?? '') + (nombre?.[0] ?? '')).toUpperCase() || '?'
}
