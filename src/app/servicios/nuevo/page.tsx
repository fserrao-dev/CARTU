import AppLayout from '@/components/layout/AppLayout'
import ServicioForm from '@/components/servicios/ServicioForm'

export default function NuevoServicioPage() {
  return (
    <AppLayout title="Nuevo servicio">
      <ServicioForm />
    </AppLayout>
  )
}
