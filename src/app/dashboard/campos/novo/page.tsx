import { requireAdmin } from '@/lib/requireRole'
import NovoCampoForm from './NovoCampoForm'

export default async function NovoCampoPage() {
  await requireAdmin()
  return <NovoCampoForm />
}
