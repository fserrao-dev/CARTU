import AppLayout from '@/components/layout/AppLayout'
import { getServicio, getEmpleados } from '@/lib/db'
import { notFound } from 'next/navigation'
import ServicioForm from '@/components/servicios/ServicioForm'

export default async function EditarServicioPage({ params }: { params: { id: string } }) {
  const [servicio, empleados] = await Promise.all([getServicio(params.id), getEmpleados()])
  if (!servicio) notFound()
  const asesores = empleados.filter(e => e.rol === 'ASESOR' && e.estado === 'ACTIVO')
  return (
    <AppLayout title={`Editar — ${servicio.ext_apellido}, ${servicio.ext_nombre}`}>
      <ServicioForm initialData={servicio} mode="edit" asesores={asesores} />
    </AppLayout>
  )
}
