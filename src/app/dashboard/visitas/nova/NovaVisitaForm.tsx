'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, AlertTriangle, Calendar, Plus } from 'lucide-react'
import Link from 'next/link'
import type { Entidade, Loja, Template } from '@/lib/types'

function getSemestre(data: string) {
  const mes = parseInt(data.split('-')[1])
  return mes <= 6 ? 1 : 2
}

function getSemestreLabel(data: string) {
  const ano = data.split('-')[0]
  return `${getSemestre(data)}º semestre de ${ano}`
}

export default function NovaVisitaForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const lojaIdInicial = searchParams.get('loja_id') ?? ''
  const dataInicial = searchParams.get('data') ?? new Date().toISOString().split('T')[0]

  const [entidades, setEntidades] = useState<Entidade[]>([])
  const [lojas, setLojas] = useState<Loja[]>([])
  const [templates, setTemplates] = useState<Template[]>([])

  const [entidadeId, setEntidadeId] = useState('')
  const [lojaId, setLojaId] = useState(lojaIdInicial)
  const [templateId, setTemplateId] = useState('')
  const [dataVisita, setDataVisita] = useState(dataInicial)

  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [visitaExistente, setVisitaExistente] = useState<any>(null)
  const [modalTipo, setModalTipo] = useState(false)
  const [estadoPendente, setEstadoPendente] = useState<'agendada' | 'rascunho' | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('entidades').select('*').eq('ativo', true).order('nome').then(({ data }) => {
      if (data) setEntidades(data)
    })
    if (lojaIdInicial) {
      supabase.from('lojas').select('*, entidades(*)').eq('id', lojaIdInicial).single().then(({ data }) => {
        if (data) {
          setLojaId(data.id)
          setEntidadeId(data.entidade_id)
          setLojas([data])
          supabase.from('templates').select('*').eq('entidade_id', data.entidade_id).eq('ativo', true).order('nome').then(({ data: tpls }) => {
            if (tpls) setTemplates(tpls)
          })
        }
      })
    }
  }, [])

  // Verificar se já existe visita semestral para esta loja+semestre
  useEffect(() => {
    if (!lojaId || !dataVisita) { setVisitaExistente(null); return }
    const ano = dataVisita.split('-')[0]
    const sem = getSemestre(dataVisita)
    const inicio = sem === 1 ? `${ano}-01-01` : `${ano}-07-01`
    const fim    = sem === 1 ? `${ano}-06-30` : `${ano}-12-31`

    const supabase = createClient()
    supabase.from('visitas')
      .select('id, data_visita, estado')
      .eq('loja_id', lojaId)
      .eq('visita_extra', false)
      .gte('data_visita', inicio)
      .lte('data_visita', fim)
      .order('data_visita')
      .limit(1)
      .single()
      .then(({ data }) => setVisitaExistente(data ?? null))
  }, [lojaId, dataVisita])

  async function handleEntidadeChange(eid: string) {
    setEntidadeId(eid)
    setLojaId('')
    setTemplateId('')
    const supabase = createClient()
    const [{ data: ls }, { data: ts }] = await Promise.all([
      supabase.from('lojas').select('*').eq('entidade_id', eid).eq('ativo', true).order('nome'),
      supabase.from('templates').select('*').eq('entidade_id', eid).eq('ativo', true).order('nome'),
    ])
    setLojas(ls ?? [])
    setTemplates(ts ?? [])
  }

  async function iniciarCriacao(estado: 'agendada' | 'rascunho') {
    if (!lojaId || !templateId) { setErro('Preencha todos os campos obrigatórios.'); return }
    setErro('')
    if (visitaExistente) {
      setEstadoPendente(estado)
      setModalTipo(true)
      return
    }
    await criarVisita(estado, false)
  }

  async function criarVisita(estado: 'agendada' | 'rascunho', extra: boolean) {
    setModalTipo(false)
    setCarregando(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: template } = await supabase.from('templates').select('versao').eq('id', templateId).single()
    const { data: secoesSnapshot } = await supabase
      .from('template_secoes')
      .select(`*, template_campos(*, campos(*))`)
      .eq('template_id', templateId)
      .order('ordem')

    const { data: visita, error } = await supabase
      .from('visitas')
      .insert({
        loja_id: lojaId,
        tecnico_id: user!.id,
        template_id: templateId,
        template_versao: template?.versao ?? 1,
        template_snapshot: secoesSnapshot ?? [],
        data_visita: dataVisita,
        estado,
        visita_extra: extra,
      })
      .select()
      .single()

    if (error || !visita) {
      setErro('Erro ao criar visita.')
      setCarregando(false)
      return
    }

    const { data: lojaData } = await supabase.from('lojas').select('*, entidades(nome)').eq('id', lojaId).single()
    const { data: tecnicoData } = await supabase.from('profiles').select('nome').eq('id', visita.tecnico_id).single()
    if (lojaData && secoesSnapshot) {
      const entidadeNome = (lojaData as any).entidades?.nome ?? ''
      const tecnicoNome = tecnicoData?.nome ?? ''
      const preRespostas: any[] = []
      for (const secao of secoesSnapshot as any[]) {
        for (const tc of secao.template_campos ?? []) {
          const chave = tc.campos?.chave
          if (!chave) continue
          let valor: any
          if (chave === 'entidade_nome') valor = entidadeNome
          else if (chave === 'tecnico_nome') valor = tecnicoNome
          else if (chave in lojaData) valor = (lojaData as any)[chave]
          else continue
          if (valor === null || valor === undefined || valor === '' || valor === false) continue
          const resposta: any = { visita_id: visita.id, campo_id: tc.campo_id }
          if (typeof valor === 'boolean') resposta.valor_bool = valor
          else if (typeof valor === 'number') resposta.valor_numero = valor
          else resposta.valor_texto = String(valor)
          preRespostas.push(resposta)
        }
      }
      if (preRespostas.length > 0) await supabase.from('visita_respostas').insert(preRespostas)
    }

    if (estado === 'agendada') {
      router.push(`/dashboard/calendario?ano=${dataVisita.split('-')[0]}&mes=${parseInt(dataVisita.split('-')[1])}`)
    } else {
      router.push(`/dashboard/visitas/${visita.id}`)
    }
    router.refresh()
  }

  return (
    <div className="p-8 max-w-xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/visitas" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova visita</h1>
          <p className="text-gray-500 text-sm mt-0.5">Selecione a loja e o template a usar</p>
        </div>
      </div>

      {/* Modal tipo de visita */}
      {modalTipo && visitaExistente && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Visita já existe neste semestre</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Já existe uma visita semestral em {new Date(visitaExistente.data_visita + 'T12:00:00').toLocaleDateString('pt-PT')} ({visitaExistente.estado})
                </p>
              </div>
            </div>
            <div className="px-6 py-4 space-y-3">
              <p className="text-sm text-gray-600">Que tipo de visita é esta?</p>
              <button onClick={() => criarVisita(estadoPendente!, false)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-[#D41317] bg-red-50 hover:bg-red-100 transition-colors text-left">
                <Calendar className="w-4 h-4 text-[#D41317] flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#D41317]">Visita semestral</p>
                  <p className="text-xs text-red-400">Visita oficial do {getSemestreLabel(dataVisita)}</p>
                </div>
              </button>
              <button onClick={() => criarVisita(estadoPendente!, true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                <Plus className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">Visita extra</p>
                  <p className="text-xs text-gray-400">Auditoria, avaria ou outra — não exporta para Nextbitt</p>
                </div>
              </button>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
              <button onClick={() => { setModalTipo(false); setEstadoPendente(null) }}
                className="w-full py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={e => e.preventDefault()} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

        {!lojaIdInicial && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entidade *</label>
            <select value={entidadeId} onChange={e => handleEntidadeChange(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317] bg-white">
              <option value="">Selecionar entidade...</option>
              {entidades.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Loja *</label>
          {lojaIdInicial ? (
            <p className="text-sm text-gray-900 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
              {lojas[0]?.nome ?? 'A carregar...'}
            </p>
          ) : (
            <select value={lojaId} onChange={e => setLojaId(e.target.value)} required disabled={!entidadeId}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317] bg-white disabled:opacity-50">
              <option value="">Selecionar loja...</option>
              {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Template de relatório *</label>
          <select value={templateId} onChange={e => setTemplateId(e.target.value)} required disabled={!entidadeId && !lojaIdInicial}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317] bg-white disabled:opacity-50">
            <option value="">Selecionar template...</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.nome} (v{t.versao})</option>)}
          </select>
          {entidadeId && templates.length === 0 && (
            <p className="text-xs text-orange-600 mt-1">Esta entidade ainda não tem templates. <Link href={`/dashboard/templates/novo?entidade_id=${entidadeId}`} className="underline">Criar template</Link></p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data da visita *</label>
          <input type="date" value={dataVisita} onChange={e => setDataVisita(e.target.value)} required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317]" />
          {lojaId && dataVisita && (
            <p className="text-xs text-gray-400 mt-1">
              {getSemestreLabel(dataVisita)}
              {visitaExistente
                ? <span className="text-orange-600 ml-1">· já existe visita semestral ({new Date(visitaExistente.data_visita + 'T12:00:00').toLocaleDateString('pt-PT')})</span>
                : <span className="text-green-600 ml-1">· semestre disponível</span>
              }
            </p>
          )}
        </div>

        {erro && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>}

        <div className="border-t border-gray-100 pt-4 space-y-2">
          <p className="text-xs text-gray-400 mb-3">Como queres prosseguir?</p>
          <div className="flex gap-3">
            <button type="button" disabled={carregando}
              onClick={() => iniciarCriacao('rascunho')}
              className="text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              style={{ backgroundColor: '#D41317' }}>
              {carregando ? 'A criar...' : 'Criar e preencher agora'}
            </button>
            <button type="button" disabled={carregando}
              onClick={() => iniciarCriacao('agendada')}
              className="px-5 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
              {carregando ? 'A criar...' : 'Agendar para depois'}
            </button>
          </div>
          <Link href="/dashboard/visitas" className="inline-block mt-1 text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
