import { requireAdmin } from '@/lib/requireRole'
import ConfiguracoesForm from './ConfiguracoesForm'

export default async function ConfiguracoesPage() {
  await requireAdmin()
  return <ConfiguracoesForm />
}
