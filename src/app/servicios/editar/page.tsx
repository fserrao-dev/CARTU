import AppLayout from '@/components/layout/AppLayout'
import { getServicio } from '@/lib/db'
import { notFound } from 'next/navigation'
import ServicioForm from '@/components/servicios/ServicioForm'

export default async function EditarServicioPage({ params }: { params: { id: string } }) {
  const servicio = await getServicio(params.id)
  if (!servicio) notFound()
  return (
    <AppLayout title={`Editar — ${servicio.ext_apellido}, ${servicio.ext_nombre}`}>
      <ServicioForm initialData={servicio} mode="edit" />
    </AppLayout>
  )
}
