import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, ClipboardList, AlertTriangle } from 'lucide-react'
import { Suspense } from 'react'
import VisitasFiltros from './VisitasFiltros'

const estadoLabel: Record<string, string> = {
  agendada: 'Agendada', rascunho: 'Rascunho', em_curso: 'Em curso', concluida: 'Concluída', assinada: 'Assinada',
}
const estadoCor: Record<string, string> = {
  agendada: 'bg-blue-100 text-blue-700',
  agendada_atrasada: 'bg-amber-100 text-amber-700',
  rascunho: 'bg-gray-100 text-gray-600',
  em_curso: 'bg-orange-100 text-orange-700',
  concluida: 'bg-green-100 text-green-700',
  assinada: 'bg-indigo-100 text-indigo-700',
}

export default async function VisitasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Carregar técnicos para o filtro
  const { data: tecnicos } = await supabase
    .from('profiles')
    .select('id, nome')
    .eq('ativo', true)
    .order('nome')

  // Construir query base
  let query = supabase
    .from('visitas')
    .select('id, data_visita, estado, visita_extra, loja_id, lojas(nome, distrito), profiles(nome, id), templates(nome)')
    .order('data_visita', { ascending: false })

  // Filtro: estado
  if (params.estado) query = query.eq('estado', params.estado)

  // Filtro: técnico
  if (params.tecnico_id) query = query.eq('tecnico_id', params.tecnico_id)

  // Filtro: tipo (semestral / extra)
  if (params.tipo === 'semestral') query = query.eq('visita_extra', false)
  else if (params.tipo === 'extra') query = query.eq('visita_extra', true)

  // Filtro: ano (server-side) — semestre sem ano aplica-se client-side abaixo
  const ano = parseInt(params.ano ?? '') || null
  if (ano) {
    query = query.gte('data_visita', `${ano}-01-01`).lte('data_visita', `${ano}-12-31`)
  }

  // Filtro: intervalo de datas manual
  if (params.data_de) query = query.gte('data_visita', params.data_de)
  if (params.data_ate) query = query.lte('data_visita', params.data_ate)

  // Filtro: campo de instalação (ex: tem_pt=true)
  // Estratégia: encontrar visita_ids que têm a resposta pretendida
  let visitaIdsFiltro: string[] | null = null
  if (params.campo && params.campo_valor) {
    const { data: campos } = await supabase
      .from('campos')
      .select('id')
      .eq('chave', params.campo)

    if (campos && campos.length > 0) {
      const campoIds = campos.map(c => c.id)
      let respostasQ = supabase
        .from('visita_respostas')
        .select('visita_id')
        .in('campo_id', campoIds)

      if (params.campo_valor === 'true') respostasQ = respostasQ.eq('valor_bool', true)
      else if (params.campo_valor === 'false') respostasQ = respostasQ.eq('valor_bool', false)
      else respostasQ = respostasQ.ilike('valor_texto', `%${params.campo_valor}%`)

      const { data: respostas } = await respostasQ
      visitaIdsFiltro = respostas?.map(r => r.visita_id) ?? []
    }
  }

  if (visitaIdsFiltro !== null) {
    if (visitaIdsFiltro.length === 0) {
      // Nenhuma visita corresponde
      return <PageLayout tecnicos={tecnicos ?? []} visitas={[]} params={params} />
    }
    query = query.in('id', visitaIdsFiltro)
  }

  const { data: visitas } = await query

  // Filtros client-side
  const q = params.q?.toLowerCase() ?? ''
  const distrito = params.distrito?.toLowerCase() ?? ''
  const semestre = params.semestre ?? ''
  let visitasFiltradas = visitas ?? []
  if (q) visitasFiltradas = visitasFiltradas.filter((v: any) => v.lojas?.nome?.toLowerCase().includes(q))
  if (distrito) visitasFiltradas = visitasFiltradas.filter((v: any) => v.lojas?.distrito?.toLowerCase() === distrito)
  if (semestre) {
    visitasFiltradas = visitasFiltradas.filter((v: any) => {
      const mes = new Date(v.data_visita + 'T12:00:00').getMonth() + 1
      return semestre === 's1' ? mes <= 6 : mes >= 7
    })
  }

  return (
    <PageLayout tecnicos={tecnicos ?? []} visitas={visitasFiltradas} params={params} />
  )
}

function PageLayout({ tecnicos, visitas, params }: {
  tecnicos: { id: string; nome: string }[]
  visitas: any[]
  params: Record<string, string>
}) {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-500 text-sm mt-1">{visitas.length} relatório{visitas.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/dashboard/visitas/nova"
          className="flex items-center gap-2 bg-[#D41317] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#A50E11] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova visita
        </Link>
      </div>

      <Suspense>
        <VisitasFiltros tecnicos={tecnicos} totalResultados={visitas.length} params={params} />
      </Suspense>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {visitas.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Loja</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Técnico</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Template</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visitas.map((v: any) => {
                const hoje = new Date().toISOString().split('T')[0]
                const atrasada = v.estado === 'agendada' && v.data_visita < hoje
                const corKey = atrasada ? 'agendada_atrasada' : v.estado
                return (
                <tr key={v.id} className={`hover:bg-gray-50 transition-colors ${atrasada ? 'bg-amber-50/40' : ''}`}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{v.lojas?.nome ?? '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{v.profiles?.nome ?? '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{v.templates?.nome ?? '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className={atrasada ? 'text-amber-700 font-medium' : ''}>
                      {new Date(v.data_visita).toLocaleDateString('pt-PT')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${estadoCor[corKey] ?? 'bg-gray-100 text-gray-600'}`}>
                        {atrasada && <AlertTriangle className="w-3 h-3" />}
                        {atrasada ? 'Em atraso' : (estadoLabel[v.estado] ?? v.estado)}
                      </span>
                      {v.visita_extra && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Extra</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/dashboard/visitas/${v.id}`} className="text-sm text-[#D41317] hover:text-[#A50E11] font-medium">
                      Ver
                    </Link>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {Object.keys(params).length > 0 ? 'Nenhuma visita corresponde aos filtros.' : 'Ainda não há visitas registadas.'}
            </p>
            {Object.keys(params).length === 0 && (
              <Link href="/dashboard/visitas/nova" className="text-sm text-[#D41317] hover:underline mt-1 inline-block">
                Criar a primeira visita
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
