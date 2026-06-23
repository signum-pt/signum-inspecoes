import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/requireRole'
import SecaoGlobalFormClient from '../SecaoGlobalFormClient'

export default async function NovaSecaoPage() {
  await requireAdmin()
  const supabase = await createClient()
  const { data: campos } = await supabase.from('campos').select('*').eq('ativo', true).order('nome')
  return <SecaoGlobalFormClient campos={campos ?? []} />
}
