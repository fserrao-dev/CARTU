import AppLayout from '@/components/layout/AppLayout'
import { getStock, getMovimientosStock } from '@/lib/db'
import StockManager from '@/components/stock/StockManager'
export const revalidate = 0
export default async function StockPage() {
  const [stock, movimientos] = await Promise.all([getStock(), getMovimientosStock()])
  return <AppLayout title="Stock"><StockManager initialStock={stock} initialMovimientos={movimientos} /></AppLayout>
}
