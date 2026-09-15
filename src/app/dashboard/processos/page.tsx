import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FolderOpen, Search, Plus, CheckCircle2, Clock } from 'lucide-react'

export default async function ProcessosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string }>
}) {
  const { q = '', estado = '' } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const isAdmin = profile?.role === 'admin'

  // Query base com contagem de trabalhos
  let query = supabase
    .from('processos')
    .select('n_processo, designacao, concelho, aberto, primeiro_ano, trabalhos(count)')
    .order('n_processo', { ascending: false })
    .limit(100)

  if (q) {
    query = query.ilike('designacao', `%${q}%`)
  }
  if (estado === 'aberto') {
    query = query.eq('aberto', true)
  } else if (estado === 'fechado') {
    query = query.eq('aberto', false)
  }

  const { data: processos, count } = await query

  // Total para o subtítulo
  const { count: total } = await supabase
    .from('processos')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Processos</h1>
          <p className="text-gray-500 text-sm mt-1">{total ?? 0} processos no total</p>
        </div>
        {isAdmin && (
          <Link
            href="/dashboard/processos/novo"
            className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: '#D41317' }}
          >
            <Plus className="w-4 h-4" />
            Novo processo
          </Link>
        )}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-6">
        <form className="flex-1 max-w-md relative" method="GET">
          {/* preservar filtro estado ao pesquisar */}
          {estado && <input type="hidden" name="estado" value={estado} />}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Pesquisar por nome..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 bg-white"
          />
        </form>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <Link
            href={`/dashboard/processos${q ? `?q=${q}` : ''}`}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              !estado ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Todos
          </Link>
          <Link
            href={`/dashboard/processos?estado=aberto${q ? `&q=${q}` : ''}`}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              estado === 'aberto' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Abertos
          </Link>
          <Link
            href={`/dashboard/processos?estado=fechado${q ? `&q=${q}` : ''}`}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              estado === 'fechado' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Fechados
          </Link>
        </div>
      </div>

      {/* Resultados */}
      {q && (
        <p className="text-xs text-gray-400 mb-4">
          {processos?.length ?? 0} resultado{processos?.length !== 1 ? 's' : ''} para "{q}"
          {(processos?.length ?? 0) === 100 && ' (mostrando os primeiros 100)'}
        </p>
      )}
      {!q && (processos?.length ?? 0) === 100 && (
        <p className="text-xs text-gray-400 mb-4">A mostrar os 100 mais recentes — use a pesquisa para filtrar</p>
      )}

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {processos && processos.length > 0 ? (
          processos.map((p: any) => (
            <Link
              key={p.n_processo}
              href={`/dashboard/processos/${p.n_processo}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
            >
              {/* Número */}
              <div className="w-14 flex-shrink-0">
                <span className="text-xs font-mono font-semibold text-gray-400">
                  #{p.n_processo}
                </span>
              </div>

              {/* Ícone + Nome */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-red-50 transition-colors">
                  <FolderOpen className="w-4 h-4 text-gray-400 group-hover:text-red-400 transition-colors" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{p.designacao}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[p.concelho, p.primeiro_ano].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>

              {/* Trabalhos */}
              <div className="flex-shrink-0 text-right">
                <p className="text-xs text-gray-400">
                  {p.trabalhos?.[0]?.count ?? 0} trabalho{(p.trabalhos?.[0]?.count ?? 0) !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Estado */}
              <div className="flex-shrink-0">
                {p.aberto ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Aberto
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    <Clock className="w-3 h-3" />
                    Fechado
                  </span>
                )}
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-16 text-gray-400">
            <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {q ? `Nenhum processo encontrado para "${q}".` : 'Ainda não há processos.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
