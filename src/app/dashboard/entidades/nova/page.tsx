import { requireAdmin } from '@/lib/requireRole'
import NovaEntidadeForm from './NovaEntidadeForm'

export default async function NovaEntidadePage() {
  await requireAdmin()
  return <NovaEntidadeForm />
}
