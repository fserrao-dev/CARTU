import { cn } from '@/lib/utils'

interface FieldProps {
  label: string
  children: React.ReactNode
  className?: string
}

export function Field({ label, children, className }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

interface SectionProps {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}

export function FormSection({ title, icon, children }: SectionProps) {
  return (
    <div className="bg-white border border-brand-100 rounded-xl p-5 mb-4 shadow-sm">
      <div className="section-title">
        {icon}
        {title}
      </div>
      {children}
    </div>
  )
}
