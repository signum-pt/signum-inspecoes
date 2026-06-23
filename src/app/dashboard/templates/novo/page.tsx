import { requireAdmin } from '@/lib/requireRole'
import NovoTemplateFormClient from './NovoTemplateFormClient'

export default async function NovoTemplatePage() {
  await requireAdmin()
  return <NovoTemplateFormClient />
}
