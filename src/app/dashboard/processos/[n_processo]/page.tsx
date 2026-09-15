import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, FolderOpen, MapPin, User, Briefcase,
  CheckCircle2, Clock, AlertCircle, Loader2, Ban, ChevronRight,
} from 'lucide-react'

const estadoCor: Record<string, string> = {
  'a fazer':   'bg-gray-100 text-gray-600',
  'urgente':   'bg-red-100 text-red-700',
  'em curso':  'bg-blue-100 text-blue-700',
  'pendente':  'bg-amber-100 text-amber-700',
  'concluído': 'bg-green-100 text-green-700',
  'cancelado': 'bg-gray-100 text-gray-400',
}

const estadoIcon: Record<string, any> = {
  'a fazer':   Clock,
  'urgente':   AlertCircle,
  'em curso':  Loader2,
  'pendente':  Loader2,
  'concluído': CheckCircle2,
  'cancelado': Ban,
}

export default async function ProcessoDetalhe({
  params,
}: {
  params: Promise<{ n_processo: string }>
}) {
  const { n_processo } = await params
  const n = parseInt(n_processo)
  if (isNaN(n)) notFound()

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const isAdmin = profile?.role === 'admin'

  const [
    { data: processo },
    { data: trabalhos },
    { data: notas },
  ] = await Promise.all([
    supabase
      .from('processos')
      .select('*, requerentes(nome, nif, email, telefone), lojas(id, nome, entidades(nome))')
      .eq('n_processo', n)
      .single(),
    supabase
      .from('trabalhos')
      .select('*, profiles(nome)')
      .eq('n_processo', n)
      .order('ano', { ascending: false })
      .order('criado_em', { ascending: false }),
    supabase
      .from('processo_notas')
      .select('*, profiles(nome)')
      .eq('n_processo', n)
      .order('criado_em', { ascending: true }),
  ])

  if (!processo) notFound()

  // Agrupar trabalhos por ano
  const trabalhosPorAno = (trabalhos ?? []).reduce<Record<number, any[]>>((acc, t) => {
    const ano = t.ano ?? 0
    if (!acc[ano]) acc[ano] = []
    acc[ano].push(t)
    return acc
  }, {})
  const anos = Object.keys(trabalhosPorAno).map(Number).sort((a, b) => b - a)

  return (
    <div className="p-8 max-w-4xl">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-3">
          <Link href="/dashboard/processos" className="text-gray-400 hover:text-gray-600 transition-colors mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FolderOpen className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-400">#{processo.n_processo}</span>
                {processo.aberto ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Aberto
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    <Clock className="w-3 h-3" /> Fechado
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mt-0.5">{processo.designacao}</h1>
              {processo.concelho && (
                <p className="text-gray-500 text-sm flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" /> {processo.concelho}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal — trabalhos */}
        <div className="lg:col-span-2 space-y-6">

          {/* Trabalhos por ano */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <Briefcase className="w-4 h-4 text-gray-400" />
              Trabalhos ({trabalhos?.length ?? 0})
            </h2>

            {anos.length > 0 ? (
              <div className="space-y-4">
                {anos.map((ano) => (
                  <div key={ano}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{ano || 'Sem ano'}</p>
                    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                      {trabalhosPorAno[ano].map((t) => {
                        const Icon = estadoIcon[t.estado] ?? Clock
                        const cor = estadoCor[t.estado] ?? 'bg-gray-100 text-gray-500'
                        return (
                          <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                            <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${cor}`}>
                              <Icon className="w-3 h-3" />
                              {t.estado}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-800 truncate">
                                {t.especialidade || '—'}
                              </p>
                              {t.profiles?.nome && (
                                <p className="text-xs text-gray-400">{t.profiles.nome}</p>
                              )}
                            </div>
                            {t.prazo && (
                              <p className="text-xs text-gray-400 flex-shrink-0">
                                {new Date(t.prazo).toLocaleDateString('pt-PT')}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-dashed border-gray-200 text-center py-10 text-gray-400">
                <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Ainda não há trabalhos neste processo.</p>
              </div>
            )}
          </div>

          {/* Notas */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Notas</h2>
            {notas && notas.length > 0 ? (
              <div className="space-y-2">
                {notas.map((nota) => (
                  <div key={nota.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">{nota.profiles?.nome}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(nota.criado_em).toLocaleDateString('pt-PT', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{nota.nota}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 bg-white rounded-xl border border-dashed border-gray-200 py-6 text-center">
                Sem notas.
              </p>
            )}
          </div>
        </div>

        {/* Coluna lateral — info */}
        <div className="space-y-4">

          {/* Requerente */}
          {processo.requerentes && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Requerente
              </h3>
              <p className="text-sm font-semibold text-gray-900">{processo.requerentes.nome}</p>
              {processo.requerentes.nif && (
                <p className="text-xs text-gray-500 mt-1">NIF {processo.requerentes.nif}</p>
              )}
              {processo.requerentes.email && (
                <a href={`mailto:${processo.requerentes.email}`}
                  className="text-xs text-blue-600 hover:underline block mt-1 truncate">
                  {processo.requerentes.email}
                </a>
              )}
              {processo.requerentes.telefone && (
                <p className="text-xs text-gray-500 mt-1">{processo.requerentes.telefone}</p>
              )}
            </div>
          )}

          {/* Loja associada */}
          {processo.lojas && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Loja associada
              </h3>
              <Link
                href={`/dashboard/lojas/${processo.lojas.id}`}
                className="flex items-center justify-between gap-2 text-sm font-medium text-gray-900 hover:text-red-600 transition-colors group"
              >
                <div>
                  <p>{processo.lojas.nome}</p>
                  {processo.lojas.entidades?.nome && (
                    <p className="text-xs text-gray-400">{processo.lojas.entidades.nome}</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-red-400 flex-shrink-0" />
              </Link>
            </div>
          )}

          {/* Metadados */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Informação</h3>
            {processo.primeiro_ano && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Primeiro ano</span>
                <span className="font-medium text-gray-900">{processo.primeiro_ano}</span>
              </div>
            )}
            {processo.concelho && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Concelho</span>
                <span className="font-medium text-gray-900">{processo.concelho}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Estado</span>
              <span className={`font-medium ${processo.aberto ? 'text-green-600' : 'text-gray-400'}`}>
                {processo.aberto ? 'Aberto' : 'Fechado'}
              </span>
            </div>
          </div>

          {/* Notas do processo (campo texto livre) */}
          {processo.notas && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 mb-1">Nota</p>
              <p className="text-sm text-amber-900 whitespace-pre-wrap">{processo.notas}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
