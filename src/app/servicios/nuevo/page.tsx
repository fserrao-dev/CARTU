import AppLayout from '@/components/layout/AppLayout'
import ServicioForm from '@/components/servicios/ServicioForm'
import { getEmpleados } from '@/lib/db'

export default async function NuevoServicioPage() {
  const empleados = await getEmpleados()
  const asesores = empleados.filter(e => e.rol === 'ASESOR' && e.estado === 'ACTIVO')
  return <AppLayout title="Nuevo servicio"><ServicioForm asesores={asesores} /></AppLayout>
}
