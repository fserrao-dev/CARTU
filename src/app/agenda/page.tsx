import AppLayout from '@/components/layout/AppLayout'
import { getServicios, getSalas, getVehiculos } from '@/lib/db'
import AgendaView from '@/components/agenda/AgendaView'
export const revalidate = 0
export default async function AgendaPage() {
  const [servicios, salas, vehiculos] = await Promise.all([getServicios(), getSalas(), getVehiculos()])
  return <AppLayout title="Agenda"><AgendaView servicios={servicios} salas={salas} vehiculos={vehiculos} /></AppLayout>
}
