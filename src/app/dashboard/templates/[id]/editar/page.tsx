import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import EditarTemplateFormClient from './EditarTemplateFormClient'

export default async function EditarTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: template } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .single()

  if (!template) notFound()

  const { data: secoes } = await supabase
    .from('template_secoes')
    .select(`*, template_campos(*, campos(*))`)
    .eq('template_id', id)
    .order('ordem')

  const { data: campos } = await supabase
    .from('campos')
    .select('*')
    .eq('ativo', true)
    .order('nome')

  return <EditarTemplateFormClient template={template} secoesIniciais={secoes ?? []} todosCampos={campos ?? []} />
}
