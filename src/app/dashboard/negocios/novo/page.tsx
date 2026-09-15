import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NovoNegocioForm from './NovoNegocioForm'

export default async function NovoNegocioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  if (!['admin', 'escritorio'].includes(profile?.role ?? '')) redirect('/dashboard/negocios')

  const [
    { data: requerentes },
    { data: lojas },
    { data: servicos },
    { data: processos },
    { data: tecnicos },
  ] = await Promise.all([
    supabase.from('requerentes').select('id, nome, nif, email, telefone, morada, cod_postal, localidade').order('nome'),
    supabase.from('lojas').select('id, nome, entidades(nome)').eq('ativo', true).order('nome'),
    supabase.from('servicos').select('id, nome').eq('ativo', true).order('ordem'),
    supabase.from('processos').select('n_processo, designacao, concelho, requerentes(nome)').order('n_processo', { ascending: false }).limit(200),
    supabase.from('profiles').select('id, nome').eq('role', 'tecnico').eq('ativo', true).order('nome'),
  ])

  return (
    <NovoNegocioForm
      requerentes={requerentes ?? []}
      lojas={lojas ?? []}
      servicos={servicos ?? []}
      processos={processos ?? []}
      tecnicos={tecnicos ?? []}
    />
  )
}
