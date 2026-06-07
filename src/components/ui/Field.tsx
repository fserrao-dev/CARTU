import { cn } from '@/lib/utils'

export function Field({ label, children, className, required }: { label: string; children: React.ReactNode; className?: string; required?: boolean }) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  )
}

export function FormSection({ title, icon, children, className }: { title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white border border-brand-100 rounded-xl p-5 mb-4 shadow-sm', className)}>
      <div className="section-title">{icon}{title}</div>
      {children}
    </div>
  )
}

export function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="accent-brand-900 w-4 h-4 rounded" />
      {label}
    </label>
  )
}
