import { createClient } from '@/lib/supabase/server'
import { Plus, Briefcase } from 'lucide-react'
import KanbanBoard from './KanbanBoard'
import NovoNegocioButton from './NovoNegocioButton'

export default async function NegociosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const canEdit = ['admin', 'escritorio'].includes(profile?.role ?? '')

  const { data: processos } = await supabase
    .from('processos')
    .select('n_processo, designacao, concelho')
    .eq('aberto', true)
    .order('n_processo', { ascending: false })
    .limit(200)

  const { data: negocios } = await supabase
    .from('negocios')
    .select(`
      id, designacao, status, concelho, valor_proposta, n_processo, criado_em,
      requerentes(nome),
      lojas(nome, entidades(nome)),
      negocio_servicos(count)
    `)
    .not('status', 'eq', 'cancelado')
    .order('criado_em', { ascending: false })

  const { count: total } = await supabase
    .from('negocios')
    .select('*', { count: 'exact', head: true })
    .not('status', 'eq', 'cancelado')

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Negócios</h1>
            <p className="text-sm text-gray-400 mt-0.5">{total ?? 0} em pipeline</p>
          </div>
        </div>
        {canEdit && <NovoNegocioButton />}
      </div>

      <KanbanBoard negocios={(negocios as any) ?? []} canEdit={canEdit} processos={(processos as any) ?? []} />
    </div>
  )
}
