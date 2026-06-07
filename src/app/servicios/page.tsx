import AppLayout from '@/components/layout/AppLayout'
import { getServicios } from '@/lib/db'
import ServiciosList from '@/components/servicios/ServiciosList'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export const revalidate = 0

export default async function ServiciosPage() {
  const servicios = await getServicios()
  return (
    <AppLayout title="Servicios">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-brand-500">{servicios.length} servicio{servicios.length !== 1 ? 's' : ''} registrado{servicios.length !== 1 ? 's' : ''}</p>
        <Link href="/servicios/nuevo" className="btn btn-primary">
          <Plus size={16} /> Nuevo servicio
        </Link>
      </div>
      <ServiciosList servicios={servicios} />
    </AppLayout>
  )
}
