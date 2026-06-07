import AppLayout from '@/components/layout/AppLayout'
import { getServicio, getPagos } from '@/lib/db'
import { notFound } from 'next/navigation'
import ServicioDetail from '@/components/servicios/ServicioDetail'

export const revalidate = 0

export default async function ServicioPage({ params }: { params: { id: string } }) {
  const [servicio, pagos] = await Promise.all([getServicio(params.id), getPagos(params.id)])
  if (!servicio) notFound()
  return (
    <AppLayout title={`${servicio.ext_apellido}, ${servicio.ext_nombre}`}>
      <ServicioDetail servicio={servicio} pagos={pagos} />
    </AppLayout>
  )
}
