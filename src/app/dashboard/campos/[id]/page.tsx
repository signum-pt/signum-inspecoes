import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/requireRole'
import { notFound } from 'next/navigation'
import EditarCampoForm from './EditarCampoForm'

export default async function EditarCampoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const supabase = await createClient()

  const { data: campo } = await supabase
    .from('campos')
    .select('*')
    .eq('id', id)
    .single()

  if (!campo) notFound()

  // Verificar se está a ser usada em visitas (chave não pode mudar)
  const { count } = await supabase
    .from('visita_respostas')
    .select('id', { count: 'exact', head: true })
    .eq('campo_id', id)

  return <EditarCampoForm campo={campo} temRespostas={(count ?? 0) > 0} />
}
