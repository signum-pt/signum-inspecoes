import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Handshake, MapPin, User, FolderOpen,
  Clock, CheckCircle2, Loader2, AlertTriangle, Ban, Euro, History,
} from 'lucide-react'
import NegocioEditSection from './NegocioEditSection'
import ServicosSection from './ServicosSection'

const statusLabel: Record<string, string> = {
  pendente:    'Pendente',
  em_execucao: 'Em Execução',
  concluido:   'Concluído',
  faturar:     'Faturar',
  faturado:    'Faturado',
  cancelado:   'Cancelado',
}
const statusCor: Record<string, string> = {
  pendente:    'bg-amber-100 text-amber-700',
  em_execucao: 'bg-blue-100 text-blue-700',
  concluido:   'bg-green-100 text-green-700',
  faturar:     'bg-orange-100 text-orange-700',
  faturado:    'bg-gray-100 text-gray-600',
  cancelado:   'bg-gray-100 text-gray-400',
}

export default async function NegocioDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const canEdit = ['admin', 'escritorio'].includes(profile?.role ?? '')

  const [
    { data: negocio },
    { data: servicos_list },
    { data: historico },
    { data: requerentes },
    { data: lojas },
    { data: servicos },
  ] = await Promise.all([
    supabase
      .from('negocios')
      .select(`
        id, designacao, status, concelho, observacoes, valor_proposta, n_processo, criado_em,
        requerentes(id, nome, nif, email, telefone),
        lojas(id, nome, entidades(nome))
      `)
      .eq('id', id)
      .single(),
    supabase
      .from('negocio_servicos')
      .select('id, descricao, quantidade, valor_unit, servicos(nome)')
      .eq('negocio_id', id)
      .order('id'),
    supabase
      .from('negocio_historico')
      .select('id, status_anterior, status_novo, nota, criado_em, profiles(nome)')
      .eq('negocio_id', id)
      .order('criado_em', { ascending: false }),
    supabase.from('requerentes').select('id, nome').order('nome'),
    supabase.from('lojas').select('id, nome, entidades(nome)').eq('ativo', true).order('nome'),
    supabase.from('servicos').select('id, nome').eq('ativo', true).order('ordem'),
  ])

  if (!negocio) notFound()

  const req = (negocio.requerentes as any)?.[0] ?? null
  const loja = (negocio.lojas as any)?.[0] ?? null
  const totalServicos = (servicos_list ?? []).reduce((s: number, l: any) => {
    return s + (l.valor_unit ?? 0) * (l.quantidade ?? 1)
  }, 0)

  return (
    <div className="p-8 max-w-4xl">
      {/* Cabeçalho */}
      <div className="flex items-start gap-3 mb-8">
        <Link href="/dashboard/negocios" className="text-gray-400 hover:text-gray-600 transition-colors mt-1">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Handshake className="w-5 h-5 text-gray-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusCor[negocio.status] ?? 'bg-gray-100 text-gray-500'}`}>
                {statusLabel[negocio.status] ?? negocio.status}
              </span>
              {negocio.n_processo && (
                <Link href={`/dashboard/processos/${negocio.n_processo}`}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                  <FolderOpen className="w-3 h-3" /> Proc. #{negocio.n_processo}
                </Link>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-0.5 truncate">{negocio.designacao}</h1>
            {negocio.concelho && (
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5" /> {negocio.concelho}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-6">

          {/* Serviços */}
          <ServicosSection
            negocioId={id}
            servicos={(servicos_list as any) ?? []}
            servicosDisponiveis={(servicos as any) ?? []}
            totalProposta={totalServicos}
            canEdit={canEdit}
          />

          {/* Observações */}
          {negocio.observacoes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 mb-1">Observações</p>
              <p className="text-sm text-amber-900 whitespace-pre-wrap">{negocio.observacoes}</p>
            </div>
          )}

          {/* Histórico */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-gray-400" /> Histórico
            </h2>
            {(historico ?? []).length > 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
                {(historico ?? []).map((h: any) => (
                  <div key={h.id} className="px-4 py-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600">
                        {h.status_anterior
                          ? <><span className="font-medium">{statusLabel[h.status_anterior] ?? h.status_anterior}</span> → <span className="font-medium">{statusLabel[h.status_novo] ?? h.status_novo}</span></>
                          : <span className="font-medium">Criado como {statusLabel[h.status_novo] ?? h.status_novo}</span>
                        }
                      </p>
                      {h.profiles?.[0]?.nome && (
                        <p className="text-xs text-gray-400 mt-0.5">{h.profiles[0].nome}</p>
                      )}
                      {h.nota && <p className="text-xs text-gray-500 mt-1 italic">{h.nota}</p>}
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(h.criado_em).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center bg-white rounded-xl border border-dashed border-gray-200 py-6">
                Sem histórico.
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Requerente */}
          {req && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Requerente
              </h3>
              <p className="text-sm font-semibold text-gray-900">{req.nome}</p>
              {req.nif && <p className="text-xs text-gray-500 mt-1">NIF {req.nif}</p>}
              {req.email && (
                <a href={`mailto:${req.email}`} className="text-xs text-blue-600 hover:underline block mt-1 truncate">
                  {req.email}
                </a>
              )}
              {req.telefone && <p className="text-xs text-gray-500 mt-1">{req.telefone}</p>}
            </div>
          )}

          {/* Loja */}
          {loja && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Loja
              </h3>
              <Link href={`/dashboard/lojas/${loja.id}`}
                className="text-sm font-medium text-gray-900 hover:text-red-600 transition-colors">
                {loja.nome}
              </Link>
              {loja.entidades?.[0]?.nome && (
                <p className="text-xs text-gray-400 mt-0.5">{loja.entidades[0].nome}</p>
              )}
            </div>
          )}

          {/* Resumo financeiro */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Financeiro</h3>
            {negocio.valor_proposta != null && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Valor proposta</span>
                <span className="font-semibold text-gray-900">
                  {negocio.valor_proposta.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
            )}
            {totalServicos > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total serviços</span>
                <span className="font-medium text-gray-700">
                  {totalServicos.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm pt-1 border-t border-gray-50">
              <span className="text-gray-500">Criado em</span>
              <span className="text-gray-700">
                {new Date(negocio.criado_em).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Editar dados gerais */}
          {canEdit && (
            <NegocioEditSection
              negocioId={id}
              initial={{
                designacao: negocio.designacao ?? '',
                concelho: negocio.concelho ?? '',
                observacoes: negocio.observacoes ?? '',
                valor_proposta: negocio.valor_proposta ?? '',
                requerente_id: req?.id ?? '',
                loja_id: loja?.id ?? '',
              }}
              requerentes={(requerentes as any) ?? []}
              lojas={(lojas as any) ?? []}
            />
          )}
        </div>
      </div>
    </div>
  )
}
