// Badge
import { cn } from '@/lib/utils'

type Variant = 'default' | 'gold' | 'success' | 'danger' | 'info' | 'warn'
const variants: Record<Variant, string> = {
  default: 'bg-brand-100 text-brand-700',
  gold:    'bg-gold-50 text-gold-500',
  success: 'bg-green-50 text-green-700',
  danger:  'bg-red-50 text-red-700',
  info:    'bg-blue-50 text-blue-700',
  warn:    'bg-amber-50 text-amber-700',
}

export function Badge({ children, variant = 'default', className }: { children: React.ReactNode; variant?: Variant; className?: string }) {
  return <span className={cn('badge', variants[variant], className)}>{children}</span>
}
