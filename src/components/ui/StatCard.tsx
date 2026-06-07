import { cn } from '@/lib/utils'

interface Props {
  label: string
  value: string | number
  sub?: string
  variant?: 'default' | 'gold' | 'danger'
}

export default function StatCard({ label, value, sub, variant = 'default' }: Props) {
  return (
    <div className={cn(
      'rounded-xl p-4 border',
      variant === 'gold'   && 'bg-gold-50 border-gold-200',
      variant === 'danger' && 'bg-red-50 border-red-200',
      variant === 'default' && 'bg-white border-brand-100 shadow-sm',
    )}>
      <p className="text-xs uppercase tracking-widest text-brand-500 mb-1">{label}</p>
      <p className={cn(
        'font-serif text-4xl font-medium leading-none',
        variant === 'gold' && 'text-gold-500',
        variant === 'danger' && 'text-red-700',
      )}>{value}</p>
      {sub && <p className="text-xs text-brand-500 mt-1">{sub}</p>}
    </div>
  )
}
