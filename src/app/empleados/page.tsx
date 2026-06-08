import AppLayout from '@/components/layout/AppLayout'
import { getEmpleados, getServicios } from '@/lib/db'
import EmpleadosView from '@/components/empleados/EmpleadosView'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export const revalidate = 0

export default async function EmpleadosPage() {
  const [empleados, servicios] = await Promise.all([getEmpleados(), getServicios()])
  return (
    <AppLayout title="Empleados" actions={
      <span className="text-xs text-brand-400">{empleados.length} empleado{empleados.length !== 1 ? 's' : ''}</span>
    }>
      <EmpleadosView empleados={empleados} servicios={servicios} />
    </AppLayout>
  )
}
