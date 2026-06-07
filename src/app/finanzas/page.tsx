import AppLayout from '@/components/layout/AppLayout'
import { getServicios, getEgresos, getCobranzasOS, getGastosFijos, getStock } from '@/lib/db'
import FinanzasView from '@/components/finanzas/FinanzasView'

export const revalidate = 0

export default async function FinanzasPage() {
  const [servicios, egresos, cobranzas, gastosFijos, stock] = await Promise.all([
    getServicios(),
    getEgresos(),
    getCobranzasOS(),
    getGastosFijos(),
    getStock(),
  ])

  return (
    <AppLayout title="Finanzas">
      <FinanzasView
        servicios={servicios}
        egresos={egresos}
        cobranzas={cobranzas}
        gastosFijos={gastosFijos}
        stock={stock}
      />
    </AppLayout>
  )
}
