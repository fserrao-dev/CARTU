import { cn } from '@/lib/utils'

interface Props {
  label: string
  value: string | number
  sub?: string
  variant?: 'default' | 'gold' | 'danger' | 'info'
  icon?: React.ReactNode
}

export function StatCard({ label, value, sub, variant = 'default', icon }: Props) {
  return (
    <div className={cn(
      'rounded-xl p-4 border flex flex-col gap-1',
      variant === 'gold'    && 'bg-gold-50 border-gold-200',
      variant === 'danger'  && 'bg-red-50 border-red-200',
      variant === 'info'    && 'bg-blue-50 border-blue-200',
      variant === 'default' && 'bg-white border-brand-100 shadow-sm',
    )}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-brand-400">{label}</p>
        {icon && <span className="text-brand-300">{icon}</span>}
      </div>
      <p className={cn(
        'font-serif text-3xl font-medium leading-none',
        variant === 'gold'   && 'text-gold-500',
        variant === 'danger' && 'text-red-700',
        variant === 'info'   && 'text-blue-700',
      )}>{value}</p>
      {sub && <p className="text-xs text-brand-400">{sub}</p>}
    </div>
  )
}
