'use server'

import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Pencil, Phone, Mail, ClipboardList, Plus, Zap, Link2, Archive, RotateCcw } from 'lucide-react'
import DesativarLojaButton from './DesativarLojaButton'

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
  const isAdmin = profile?.role === 'admin'

  async function desativarLoja() {
    'use server'
    const sb = await createClient()
    await sb.from('lojas').update({ ativo: false }).eq('id', id)
    redirect('/dashboard/lojas')
  }

  async function reativarLoja() {
    'use server'
    const sb = await createClient()
    await sb.from('lojas').update({ ativo: true }).eq('id', id)
    redirect(`/dashboard/lojas/${id}`)
  }

  const { data: loja } = await supabase
    .from('lojas')
    .select('*, entidades(nome, cor)')
    .eq('id', id)
    .single()

  if (!loja) notFound()

  const { data: visitas } = await supabase
    .from('visitas')
    .select('id, data_visita, estado, visita_extra, templates(nome), profiles(nome)')
    .eq('loja_id', id)
    .order('data_visita', { ascending: false })

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
        <div className="flex items-center gap-2">
          {loja.ativo ? (
            <>
              {canEdit && (
                <Link href={`/dashboard/lojas/${id}/editar`}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </Link>
              )}
              {isAdmin && <DesativarLojaButton formAction={desativarLoja} />}
            </>
          ) : isAdmin ? (
            <form action={reativarLoja}>
              <button type="submit"
                className="flex items-center gap-2 text-sm text-green-600 border border-green-200 hover:border-green-400 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors">
                <RotateCcw className="w-3.5 h-3.5" />
                Reativar loja
              </button>
            </form>
          ) : null}
        </div>
      </div>

      {!loja.ativo && (
        <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
          <Archive className="w-4 h-4 flex-shrink-0" />
          <span>Esta loja está inativa e não aparece na listagem geral. O histórico de visitas está preservado.</span>
        </div>
      )}

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
          Visitas
        </h2>
        {canEdit && loja.ativo && (
          <Link href={`/dashboard/visitas/nova?loja_id=${id}`}
            className="flex items-center gap-1.5 text-xs font-medium hover:underline" style={{ color: '#D41317' }}>
            <Plus className="w-3.5 h-3.5" />
            Nova visita
          </Link>
        )}
      </div>

      {visitas && visitas.length > 0 ? (
        <VisitasSemestrais visitas={visitas} lojaId={id} canEdit={canEdit} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 text-center py-10 text-gray-400">
          <p className="text-sm">Ainda não há visitas para esta loja.</p>
          {canEdit && loja.ativo && (
            <Link href={`/dashboard/visitas/nova?loja_id=${id}`} className="text-sm hover:underline mt-1 inline-block" style={{ color: '#D41317' }}>
              Criar primeira visita
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function VisitasSemestrais({ visitas, lojaId, canEdit }: { visitas: any[]; lojaId: string; canEdit: boolean }) {
  // Separar semestrais das extras
  const semestrais = visitas.filter(v => !v.visita_extra)
  const extras = visitas.filter(v => v.visita_extra)

  // Agrupar semestrais por ano
  const porAno: Record<number, { s1: any | null; s2: any | null }> = {}
  const anosComVisitas = new Set(semestrais.map(v => new Date(v.data_visita).getFullYear()))
  const anoAtual = new Date().getFullYear()
  const anosParaMostrar = new Set([...anosComVisitas, anoAtual])

  for (const ano of anosParaMostrar) {
    const s1 = semestrais.find(v => {
      const d = new Date(v.data_visita)
      return d.getFullYear() === ano && d.getMonth() < 6
    }) ?? null
    const s2 = semestrais.find(v => {
      const d = new Date(v.data_visita)
      return d.getFullYear() === ano && d.getMonth() >= 6
    }) ?? null
    porAno[ano] = { s1, s2 }
  }

  const anos = Object.keys(porAno).map(Number).sort((a, b) => b - a)

  return (
    <div className="space-y-4">
      {anos.map(ano => (
        <div key={ano} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-700">{ano}</span>
          </div>
          <div className="divide-y divide-gray-50">
            <SemestreRow label="1º Semestre" visita={porAno[ano].s1} lojaId={lojaId} />
            <SemestreRow label="2º Semestre" visita={porAno[ano].s2} lojaId={lojaId} />
          </div>
        </div>
      ))}

      {/* Visitas extra */}
      {extras.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 bg-purple-50 border-b border-purple-100">
            <span className="text-sm font-semibold text-purple-700">Visitas extra</span>
          </div>
          <div className="divide-y divide-gray-50">
            {extras.map(v => (
              <div key={v.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-900">{new Date(v.data_visita + 'T12:00:00').toLocaleDateString('pt-PT')}</span>
                  <span className="text-xs text-gray-400">{v.profiles?.nome ?? '—'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${estadoCor[v.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                    {estadoLabel[v.estado] ?? v.estado}
                  </span>
                  <Link href={`/dashboard/visitas/${v.id}`} className="text-sm font-medium hover:underline" style={{ color: '#D41317' }}>Ver</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SemestreRow({ label, visita, lojaId }: { label: string; visita: any | null; lojaId: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-sm font-medium text-gray-500 w-28 flex-shrink-0">{label}</span>
        {visita ? (
          <>
            <span className="text-sm text-gray-900">{new Date(visita.data_visita + 'T12:00:00').toLocaleDateString('pt-PT')}</span>
            <span className="text-xs text-gray-400 hidden sm:inline truncate">{visita.profiles?.nome ?? '—'}</span>
          </>
        ) : (
          <span className="text-sm text-gray-300 italic">Por fazer</span>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {visita ? (
          <>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${estadoCor[visita.estado] ?? 'bg-gray-100 text-gray-600'}`}>
              {estadoLabel[visita.estado] ?? visita.estado}
            </span>
            <Link href={`/dashboard/visitas/${visita.id}`} className="text-sm font-medium hover:underline" style={{ color: '#D41317' }}>Ver</Link>
          </>
        ) : (
          <span className="w-2 h-2 rounded-full bg-gray-200 inline-block" />
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
