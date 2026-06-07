import AppLayout from '@/components/layout/AppLayout'
import { getServicio } from '@/lib/db'
import { notFound } from 'next/navigation'
import ServicioDetail from '@/components/servicios/ServicioDetail'

export const revalidate = 0

export default async function ServicioPage({ params }: { params: { id: string } }) {
  const servicio = await getServicio(params.id)
  if (!servicio) notFound()
  return (
    <AppLayout title={`${servicio.ext_apellido}, ${servicio.ext_nombre}`}>
      <ServicioDetail servicio={servicio} />
    </AppLayout>
  )
}
