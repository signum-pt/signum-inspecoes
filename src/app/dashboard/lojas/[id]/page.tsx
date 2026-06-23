import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Pencil, Phone, Mail, ClipboardList, Plus, Zap, Link2 } from 'lucide-react'

const estadoLabel: Record<string, string> = {
  rascunho: 'Rascunho', em_curso: 'Em curso', concluida: 'Concluída', assinada: 'Assinada',
}
const estadoCor: Record<string, string> = {
  rascunho: 'bg-gray-100 text-gray-600', em_curso: 'bg-orange-100 text-orange-700',
  concluida: 'bg-green-100 text-green-700', assinada: 'bg-indigo-100 text-indigo-700',
}

export default async function LojaDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const canEdit = profile?.role === 'admin' || profile?.role === 'tecnico'

  const { data: loja } = await supabase
    .from('lojas')
    .select('*, entidades(nome, cor)')
    .eq('id', id)
    .single()

  if (!loja) notFound()

  const { data: visitas } = await supabase
    .from('visitas')
    .select('id, data_visita, estado, templates(nome), profiles(nome)')
    .eq('loja_id', id)
    .order('data_visita', { ascending: false })
    .limit(10)

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/entidades/${loja.entidade_id}`} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5" style={{ color: '#D41317' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{loja.nome}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{loja.entidades?.nome}</p>
          </div>
        </div>
        {canEdit && (
          <Link href={`/dashboard/lojas/${id}/editar`}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </Link>
        )}
      </div>

      {/* Info da loja */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 grid grid-cols-2 gap-4">
        {(loja.morada || loja.cidade || loja.codigo_postal || loja.distrito) && (
          <div className="col-span-2">
            <p className="text-xs text-gray-400 mb-0.5">Morada</p>
            <p className="text-sm text-gray-900">
              {[loja.morada, loja.cidade, loja.codigo_postal, loja.distrito].filter(Boolean).join(', ')}
            </p>
          </div>
        )}
        {loja.contacto && (
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-gray-400" />
            <p className="text-sm text-gray-900">{loja.contacto}</p>
          </div>
        )}
        {loja.email_contacto && (
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-gray-400" />
            <p className="text-sm text-gray-900">{loja.email_contacto}</p>
          </div>
        )}
        {loja.notas && (
          <div className="col-span-2">
            <p className="text-xs text-gray-400 mb-0.5">Notas</p>
            <p className="text-sm text-gray-500">{loja.notas}</p>
          </div>
        )}
      </div>

      {/* Dados elétricos */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-yellow-500" />
          Dados elétricos
        </h2>

        {/* Alimentação geral */}
        {(loja.cpe || loja.tipo_alimentacao) && (
          <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-3">
            {loja.cpe && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400 mb-0.5">CPE</p>
                <p className="text-sm font-mono text-gray-900">{loja.cpe}</p>
              </div>
            )}
            {loja.tipo_alimentacao && <InfoCell label="Alimentação" value={loja.tipo_alimentacao} />}
          </div>
        )}

        {/* Infraestrutura */}
        <div className="grid grid-cols-2 gap-2">
          <InfraBadge label="PT" ativo={loja.tem_pt} detalhe={[loja.pt_kva && `${loja.pt_kva} kVA`, loja.pt_tipo, loja.pt_transformador && `Trafo ${loja.pt_transformador} kVA`, loja.pt_num_ptc && `Nº PTC: ${loja.pt_num_ptc}`].filter(Boolean).join(' · ')} />
          <InfraBadge label="GG Socorro" ativo={loja.tem_gerador_socorro} detalhe={loja.gerador_socorro_kva ? `${loja.gerador_socorro_kva} kVA` : ''} />
          <InfraBadge label="GG Segurança" ativo={loja.tem_gerador_seguranca} detalhe={loja.gerador_seguranca_kva ? `${loja.gerador_seguranca_kva} kVA` : ''} />
          <InfraBadge label="UPS" ativo={loja.tem_ups} detalhe={loja.ups_kva ? `${loja.ups_kva} kVA` : ''} />
          <InfraBadge label="Trafo. Isolamento" ativo={loja.tem_trafo_isolamento} detalhe={loja.trafo_isolamento_kva ? `${loja.trafo_isolamento_kva} kVA` : ''} />
          <InfraBadge label="Bat. Condensadores" ativo={loja.tem_bateria_condensadores} detalhe={loja.bateria_condensadores_kvar ? `${loja.bateria_condensadores_kvar} kvar` : ''} />
          <InfraBadge label="PAC" ativo={loja.tem_pac} />
          <InfraBadge label="UPAC" ativo={loja.tem_upac} detalhe={loja.upac_kva ? `${loja.upac_kva} kVA` : ''} />
          <InfraBadge label="PCVE" ativo={loja.tem_pcve} detalhe={loja.pcve_kva ? `${loja.pcve_kva} kVA` : ''} />
        </div>

        {(loja.quadro_us_voltagem || loja.quadro_us_uc) && (
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-gray-100 pt-3">
            <p className="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Quadros US</p>
            {loja.quadro_us_voltagem && <InfoCell label="US" value={`${loja.quadro_us_voltagem} V`} />}
            {loja.quadro_us_uc && <InfoCell label="UC" value={`${loja.quadro_us_uc} V`} />}
          </div>
        )}
      </div>

      {/* Nextbitt */}
      {loja.nextbitt_lo_id && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 flex items-center gap-3">
          <Link2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Código de Localização Nextbitt</p>
            <p className="text-sm font-mono text-gray-900">{loja.nextbitt_lo_id}</p>
          </div>
        </div>
      )}

      {/* Visitas */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-gray-400" />
          Visitas ({visitas?.length ?? 0})
        </h2>
        {canEdit && (
          <Link href={`/dashboard/visitas/nova?loja_id=${id}`}
            className="flex items-center gap-1.5 text-xs font-medium hover:underline" style={{ color: '#D41317' }}>
            <Plus className="w-3.5 h-3.5" />
            Nova visita
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {visitas && visitas.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Template</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Técnico</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visitas.map((v: any) => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-sm text-gray-900">{new Date(v.data_visita).toLocaleDateString('pt-PT')}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{v.templates?.nome ?? '—'}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{v.profiles?.nome ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${estadoCor[v.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                      {estadoLabel[v.estado] ?? v.estado}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/dashboard/visitas/${v.id}`} className="text-sm font-medium hover:underline" style={{ color: '#D41317' }}>Ver</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-10 text-gray-400">
            <p className="text-sm">Ainda não há visitas para esta loja.</p>
            {canEdit && (
              <Link href={`/dashboard/visitas/nova?loja_id=${id}`} className="text-sm hover:underline mt-1 inline-block" style={{ color: '#D41317' }}>
                Criar primeira visita
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  )
}

function InfraBadge({ label, ativo, detalhe }: { label: string; ativo: boolean; detalhe?: string }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${ativo ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-400'}`}>
      <span className="font-medium">{label}</span>
      {ativo ? (
        <span className="text-green-600">{detalhe || 'Sim'}</span>
      ) : (
        <span>Não</span>
      )}
    </div>
  )
}
