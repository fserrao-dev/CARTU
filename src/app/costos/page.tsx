import AppLayout from '@/components/layout/AppLayout'
import { getCostos, getCostosCount } from '@/lib/db'
import CostosView from '@/components/costos/CostosView'

export const revalidate = 0

export default async function CostosPage() {
  const [costos, total] = await Promise.all([getCostos(200, 0), getCostosCount()])
  return (
    <AppLayout title="Costos por servicio">
      <CostosView initialCostos={costos} totalCount={total} />
    </AppLayout>
  )
}
