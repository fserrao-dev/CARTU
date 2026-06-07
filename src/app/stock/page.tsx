import AppLayout from '@/components/layout/AppLayout'
import { getStock } from '@/lib/db'
import StockManager from '@/components/stock/StockManager'

export const revalidate = 0

export default async function StockPage() {
  const stock = await getStock()
  return (
    <AppLayout title="Stock">
      <StockManager initialStock={stock} />
    </AppLayout>
  )
}
