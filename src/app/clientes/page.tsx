import AppLayout from '@/components/layout/AppLayout'
import { getContactos } from '@/lib/db'
import ContactosView from '@/components/clientes/ContactosView'
export const revalidate = 0
export default async function ClientesPage() {
  const contactos = await getContactos()
  return <AppLayout title="Contactos"><ContactosView initialContactos={contactos} /></AppLayout>
}
