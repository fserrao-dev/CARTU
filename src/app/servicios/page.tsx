import AppLayout from '@/components/layout/AppLayout'
import { getServicios } from '@/lib/db'
import ServiciosList from '@/components/servicios/ServiciosList'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export const revalidate = 0

export default async function ServiciosPage() {
  const servicios = await getServicios()
  return (
    <AppLayout title="Servicios" actions={
      <Link href="/servicios/nuevo" className="btn btn-primary btn-sm">
        <Plus size={14} /> Nuevo
      </Link>
    }>
      <ServiciosList servicios={servicios} />
    </AppLayout>
  )
}
