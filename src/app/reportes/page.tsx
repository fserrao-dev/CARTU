import AppLayout from '@/components/layout/AppLayout'
import { getServicios } from '@/lib/db'
import ReportesView from '@/components/reportes/ReportesView'
export const revalidate = 0
export default async function ReportesPage() {
  const servicios = await getServicios()
  return <AppLayout title="Reportes"><ReportesView servicios={servicios} /></AppLayout>
}
