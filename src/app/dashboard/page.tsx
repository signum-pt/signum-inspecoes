import { createClient } from '@/lib/supabase/server'
import { Store, ClipboardList, CheckCircle, Clock } from 'lucide-react'
import DashboardInterativo, { type LojaInfo, type VisitaRecente } from '@/components/DashboardInterativo'
import type { DistritoContagem } from '@/components/MapaPortugal'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { count: totalLojas },
    { count: totalVisitas },
    { count: visitasConcluidas },
    { count: visitasPendentes },
  ] = await Promise.all([
    supabase.from('lojas').select('*', { count: 'exact', head: true }).eq('ativo', true),
    supabase.from('visitas').select('*', { count: 'exact', head: true }),
    supabase.from('visitas').select('*', { count: 'exact', head: true }).eq('estado', 'assinada'),
    supabase.from('visitas').select('*', { count: 'exact', head: true }).in('estado', ['rascunho', 'em_curso']),
  ])

  // Lojas com distrito para o mapa e painel
  const { data: lojasRaw } = await supabase
    .from('lojas')
    .select('id, nome, cidade, distrito, entidades(nome)')
    .eq('ativo', true)
    .not('distrito', 'is', null)
    .order('nome')

  // Última visita por loja
  const lojaIds = (lojasRaw ?? []).map((l: any) => l.id)
  const { data: visitasLoja } = lojaIds.length > 0
    ? await supabase
        .from('visitas')
        .select('loja_id, estado, data_visita')
        .in('loja_id', lojaIds)
        .order('data_visita', { ascending: false })
    : { data: [] }

  // Mapa de última visita por loja
  const ultimaVisitaMap: Record<string, { estado: string; data_visita: string }> = {}
  for (const v of visitasLoja ?? []) {
    if (!ultimaVisitaMap[v.loja_id]) {
      ultimaVisitaMap[v.loja_id] = { estado: v.estado, data_visita: v.data_visita }
    }
  }

  // Agregar dados do mapa (contagem de lojas e visitas por distrito)
  const contagemLojas: Record<string, number> = {}
  const contagemVisitas: Record<string, number> = {}
  const lojasPorDistrito: Record<string, LojaInfo[]> = {}

  for (const l of lojasRaw ?? []) {
    const d = l.distrito as string
    contagemLojas[d] = (contagemLojas[d] ?? 0) + 1

    const uv = ultimaVisitaMap[l.id]
    if (uv) contagemVisitas[d] = (contagemVisitas[d] ?? 0) + 1

    if (!lojasPorDistrito[d]) lojasPorDistrito[d] = []
    lojasPorDistrito[d].push({
      id: l.id,
      nome: l.nome,
      cidade: l.cidade ?? '',
      entidade_nome: (l.entidades as any)?.nome ?? '—',
      ultimo_estado: uv?.estado ?? null,
      ultima_visita_data: uv?.data_visita ?? null,
    })
  }

  const todosDistritos = new Set([...Object.keys(contagemLojas), ...Object.keys(contagemVisitas)])
  const dadosMapa: DistritoContagem[] = Array.from(todosDistritos).map(d => ({
    distrito: d,
    total: contagemLojas[d] ?? 0,
    visitas: contagemVisitas[d] ?? 0,
  }))

  // Visitas recentes
  const { data: visitasRecentesRaw } = await supabase
    .from('visitas')
    .select('id, data_visita, estado, lojas(nome), profiles(nome)')
    .order('created_at', { ascending: false })
    .limit(5)

  const visitasRecentes: VisitaRecente[] = (visitasRecentesRaw ?? []).map((v: any) => ({
    id: v.id,
    data_visita: v.data_visita,
    estado: v.estado,
    loja_nome: v.lojas?.nome ?? '—',
    tecnico_nome: v.profiles?.nome ?? '—',
  }))

  const stats = [
    { label: 'Lojas ativas', value: totalLojas ?? 0, icon: Store, cor: 'text-[#D41317] bg-red-50' },
    { label: 'Total de visitas', value: totalVisitas ?? 0, icon: ClipboardList, cor: 'text-[#D41317] bg-red-50' },
    { label: 'Relatórios assinados', value: visitasConcluidas ?? 0, icon: CheckCircle, cor: 'text-green-600 bg-green-50' },
    { label: 'Em curso / Rascunho', value: visitasPendentes ?? 0, icon: Clock, cor: 'text-orange-600 bg-orange-50' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Início</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral das inspeções</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.cor}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          )
        })}
      </div>

      <DashboardInterativo
        dadosMapa={dadosMapa}
        lojasPorDistrito={lojasPorDistrito}
        visitasRecentes={visitasRecentes}
      />
    </div>
  )
}
