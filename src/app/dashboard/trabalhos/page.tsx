import { createClient } from '@/lib/supabase/server'
import { Wrench } from 'lucide-react'
import KanbanTrabalhos from './KanbanTrabalhos'

export default async function TrabalhosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const isTecnico = profile?.role === 'tecnico'

  // Técnicos veem só os seus; admins/escritório veem todos
  let query = supabase
    .from('trabalhos')
    .select(`
      id, estado, especialidade, descricao, prazo, n_processo,
      processos(designacao, lojas(nome)),
      profiles(nome)
    `)
    .not('estado', 'eq', 'cancelado')
    .order('prazo', { ascending: true, nullsFirst: false })

  if (isTecnico) query = query.eq('tecnico_id', user!.id)

  const { data: trabalhos } = await query

  const total = trabalhos?.length ?? 0
  const atrasados = (trabalhos ?? []).filter(t => {
    if (!t.prazo || t.estado === 'concluído') return false
    return new Date(t.prazo) < new Date()
  }).length

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          <Wrench className="w-5 h-5 text-gray-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trabalhos</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {total} em aberto{atrasados > 0 ? ` · ${atrasados} atrasados` : ''}
          </p>
        </div>
      </div>

      <KanbanTrabalhos trabalhos={(trabalhos as any) ?? []} />
    </div>
  )
}
