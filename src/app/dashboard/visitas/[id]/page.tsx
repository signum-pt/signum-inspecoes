import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import VisitaForm from './VisitaForm'

export default async function VisitaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const { data: visita } = await supabase
    .from('visitas')
    .select('*, lojas(*, entidades(*)), profiles(nome), templates(nome, versao)')
    .eq('id', id)
    .single()

  if (!visita) notFound()

  // Usar snapshot guardado na criação — se não existir, usar template atual (visitas antigas)
  let secoes = visita.template_snapshot ?? null

  if (!secoes) {
    const { data } = await supabase
      .from('template_secoes')
      .select(`*, template_campos(*, campos(*))`)
      .eq('template_id', visita.template_id)
      .order('ordem')
    secoes = data ?? []
  }

  const { data: respostas } = await supabase
    .from('visita_respostas')
    .select('*')
    .eq('visita_id', id)

  const [{ data: fotos }, { data: cfgNextbitt }] = await Promise.all([
    supabase.from('visita_fotos').select('*').eq('visita_id', id).order('ordem'),
    supabase.from('configuracoes').select('valor').eq('chave', 'nextbitt_ativo').single(),
  ])

  const nextbittAtivo = cfgNextbitt?.valor === 'true'

  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-400">A carregar...</div>}>
      <VisitaForm
        visita={visita}
        profile={profile}
        secoes={secoes}
        respostasIniciais={respostas ?? []}
        fotosIniciais={fotos ?? []}
        nextbittAtivo={nextbittAtivo}
      />
    </Suspense>
  )
}
