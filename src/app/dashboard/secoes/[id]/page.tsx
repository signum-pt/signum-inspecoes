import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/requireRole'
import { notFound } from 'next/navigation'
import SecaoGlobalFormClient from '../SecaoGlobalFormClient'

export default async function EditarSecaoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const supabase = await createClient()

  const [{ data: secao }, { data: campos }] = await Promise.all([
    supabase
      .from('secoes_globais')
      .select('*, secoes_globais_campos(*, campos(*))')
      .eq('id', id)
      .single(),
    supabase.from('campos').select('*').eq('ativo', true).order('nome'),
  ])

  if (!secao) notFound()

  return <SecaoGlobalFormClient campos={campos ?? []} secao={secao} />
}
