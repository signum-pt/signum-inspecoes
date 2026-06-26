'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, CheckCircle, FileDown, Camera, X, Upload, AlertTriangle, Trash2, PenLine, Send, Search, Paperclip, XCircle } from 'lucide-react'
import Link from 'next/link'
import type { TipoCampo } from '@/lib/types'

const estadoLabel: Record<string, string> = {
  agendada: 'Agendada', rascunho: 'Rascunho', em_curso: 'Em curso', concluida: 'Concluída', assinada: 'Assinada',
}
const estadoCor: Record<string, string> = {
  agendada: 'bg-blue-100 text-blue-700',
  rascunho: 'bg-gray-100 text-gray-600',
  em_curso: 'bg-orange-100 text-orange-700',
  concluida: 'bg-green-100 text-green-700',
  assinada: 'bg-indigo-100 text-indigo-700',
}

type EstadoGuardar = 'guardado' | 'guardando' | 'alterado' | 'erro'

// Campos de detalhe que só aparecem quando o respectivo tem_X é true
const DEPENDENCIAS: Record<string, string> = {
  pt_kva:                     'tem_pt',
  pt_tipo:                    'tem_pt',
  gerador_kva:                'tem_gerador',
  ups_kva:                    'tem_ups',
  trafo_isolamento_kva:       'tem_trafo_isolamento',
  bateria_condensadores_kvar: 'tem_bateria_condensadores',
  upac_kva:                   'tem_upac',
  pcve_kva:                   'tem_pcve',
}

// Campos da loja que podem ser atualizados a partir da visita
const CAMPOS_LOJA_BOOL = [
  'tem_gerador', 'tem_ups', 'tem_trafo_isolamento',
  'tem_bateria_condensadores', 'tem_pac', 'tem_upac', 'tem_pcve',
]
const CAMPOS_LOJA_TEXTO = [
  'cpe', 'tipo_alimentacao', 'potencia_contratada', 'disjuntor_geral',
  'pt_kva', 'pt_tipo', 'gerador_kva', 'quadro_us_voltagem', 'quadro_us_uc',
  'ups_kva', 'trafo_isolamento_kva', 'bateria_condensadores_kvar',
  'upac_kva', 'pcve_kva',
]
const TODOS_CAMPOS_LOJA = [...CAMPOS_LOJA_BOOL, ...CAMPOS_LOJA_TEXTO]

const LABEL_CAMPO: Record<string, string> = {
  tem_pt: 'Tem PT', pt_kva: 'PT — Potência (kVA)', pt_tipo: 'PT — Tipo',
  tem_gerador: 'Tem Gerador', gerador_kva: 'Gerador — Potência (kVA)',
  quadro_us_voltagem: 'Quadros — US (V)', quadro_us_uc: 'Quadros — UC (V)',
  tem_ups: 'Tem UPS', ups_kva: 'UPS — Potência (kVA)',
  tem_trafo_isolamento: 'Tem Trafo. Isolamento', trafo_isolamento_kva: 'Trafo. Isolamento — Potência (kVA)',
  tem_bateria_condensadores: 'Tem Bat. Condensadores', bateria_condensadores_kvar: 'Bat. Condensadores (kvar)',
  tem_pac: 'Tem PAC',
  tem_upac: 'Tem UPAC', upac_kva: 'UPAC — Potência (kVA)',
  tem_pcve: 'Tem PCVE', pcve_kva: 'PCVE — Potência (kVA)',
  cpe: 'CPE', tipo_alimentacao: 'Tipo de alimentação', tensao: 'Tensão',
  potencia_contratada: 'Potência contratada (kVA)', disjuntor_geral: 'Disjuntor geral (A)',
}

interface Alteracao {
  chave: string
  label: string
  anterior: any
  novo: any
}

export default function VisitaForm({ visita, profile, secoes, respostasIniciais, fotosIniciais }: {
  visita: any; profile: any; secoes: any[]
  respostasIniciais: any[]; fotosIniciais: any[]
}) {
  const router = useRouter()

  const init: Record<string, any> = {}
  respostasIniciais.forEach(r => {
    if (r.valor_texto !== null && r.valor_texto !== undefined) init[r.campo_id] = r.valor_texto
    else if (r.valor_numero !== null && r.valor_numero !== undefined) init[r.campo_id] = r.valor_numero
    else if (r.valor_bool !== null && r.valor_bool !== undefined) init[r.campo_id] = r.valor_bool
    else if (r.valor_data !== null && r.valor_data !== undefined) init[r.campo_id] = r.valor_data
    else if (r.valor_opcoes !== null && r.valor_opcoes !== undefined) init[r.campo_id] = r.valor_opcoes
  })

  const [respostas, setRespostas] = useState<Record<string, any>>(init)
  const [observacoes, setObservacoes] = useState(visita.observacoes_gerais ?? '')
  const [nomeCliente, setNomeCliente] = useState(visita.nome_cliente ?? '')
  const [fotos, setFotos] = useState<any[]>(fotosIniciais)
  const [estadoGuardar, setEstadoGuardar] = useState<EstadoGuardar>('guardado')
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [estadoVisita, setEstadoVisita] = useState(visita.estado)
  const [modalAlteracoes, setModalAlteracoes] = useState<Alteracao[] | null>(null)
  const [aAtualizarLoja, setAAtualizarLoja] = useState(false)
  const [aApagar, setAApagar] = useState(false)
  const [modalAssinatura, setModalAssinatura] = useState(false)
  const [modalReagendar, setModalReagendar] = useState(false)
  const [novaData, setNovaData] = useState(visita.data_visita)
  const [aReagendar, setAReagendar] = useState(false)
  const [modalNextbitt, setModalNextbitt] = useState(false)
  const [aExportar, setAExportar] = useState(false)
  const [erroNextbitt, setErroNextbitt] = useState('')
  const [avisoNextbitt, setAvisoNextbitt] = useState('')
  const [logsNextbitt, setLogsNextbitt] = useState<string[]>([])
  const [nextbittExportado, setNextbittExportado] = useState(!!visita.nextbitt_id)
  const [nextbittExportadoEm, setNextbittExportadoEm] = useState<string | null>(visita.nextbitt_exportado_em ?? null)
  const [modalConsultar, setModalConsultar] = useState(false)
  const [aConsultar, setAConsultar] = useState(false)
  const [dadosNextbitt, setDadosNextbitt] = useState<any>(null)
  const [erroConsultar, setErroConsultar] = useState('')

  const hoje = new Date().toISOString().split('T')[0]
  const dataPassou = visita.data_visita < hoje && estadoVisita === 'agendada'
  const [pdfAssinadoFile, setPdfAssinadoFile] = useState<File | null>(null)
  const [aAssinar, setAAssinar] = useState(false)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fotoInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const podeGerir = profile?.id === visita.tecnico_id || profile?.role === 'admin'
  const podeEditar = estadoVisita !== 'assinada' && estadoVisita !== 'agendada' && podeGerir

  // ── AUTO-SAVE ────────────────────────────────────────────────
  const guardarRespostas = useCallback(async (
    respostasActuais: Record<string, any>,
    obsActual: string,
    nomeClienteActual: string
  ) => {
    setEstadoGuardar('guardando')
    const supabase = createClient()
    try {
      await supabase.from('visitas').update({
        observacoes_gerais: obsActual,
        nome_cliente: nomeClienteActual,
      }).eq('id', visita.id)

      for (const [campoId, valor] of Object.entries(respostasActuais)) {
        if (valor === undefined || valor === '' || valor === null) continue
        let tipo: TipoCampo = 'texto'
        for (const s of secoes) {
          const tc = s.template_campos?.find((tc: any) => tc.campo_id === campoId)
          if (tc) { tipo = tc.campos?.tipo; break }
        }
        const resposta: any = { visita_id: visita.id, campo_id: campoId }
        if (tipo === 'numero') resposta.valor_numero = Number(valor)
        else if (tipo === 'sim_nao') resposta.valor_bool = valor
        else if (tipo === 'data') resposta.valor_data = valor
        else if (tipo === 'escolha_multipla') resposta.valor_opcoes = valor
        else resposta.valor_texto = String(valor)
        await supabase.from('visita_respostas').upsert(resposta, { onConflict: 'visita_id,campo_id' })
      }
      setEstadoGuardar('guardado')
    } catch {
      setEstadoGuardar('erro')
    }
  }, [visita.id, secoes])

  const triggerAutoSave = useCallback((r: Record<string, any>, obs: string, nome: string) => {
    setEstadoGuardar('alterado')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => guardarRespostas(r, obs, nome), 2000)
  }, [guardarRespostas])

  function setResposta(campoId: string, valor: any) {
    const novas = { ...respostas, [campoId]: valor }
    setRespostas(novas)
    triggerAutoSave(novas, observacoes, nomeCliente)
  }

  function setObs(v: string) { setObservacoes(v); triggerAutoSave(respostas, v, nomeCliente) }
  function setNome(v: string) { setNomeCliente(v); triggerAutoSave(respostas, observacoes, v) }

  // Construir mapa chave→campoId a partir das secções
  function buildChaveMap(): Record<string, string> {
    const map: Record<string, string> = {}
    for (const s of secoes) {
      for (const tc of s.template_campos ?? []) {
        if (tc.campos?.chave) map[tc.campos.chave] = tc.campo_id
      }
    }
    return map
  }

  // Verificar alterações vs loja antes de concluir
  async function handleConcluir() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    await guardarRespostas(respostas, observacoes, nomeCliente)

    const supabase = createClient()
    const { data: loja } = await supabase.from('lojas').select('*').eq('id', visita.loja_id).single()
    if (!loja) { avancarEstadoDireto('concluida'); return }

    const chaveMap = buildChaveMap()
    const alteracoes: Alteracao[] = []

    for (const chave of TODOS_CAMPOS_LOJA) {
      const campoId = chaveMap[chave]
      if (!campoId) continue
      const valorVisita = respostas[campoId]
      if (valorVisita === undefined || valorVisita === null || valorVisita === '') continue
      const valorLoja = loja[chave]

      // Normalizar para comparação
      const vVisita = typeof valorVisita === 'boolean' ? valorVisita : String(valorVisita)
      const vLoja = typeof valorLoja === 'boolean' ? valorLoja : (valorLoja !== null && valorLoja !== undefined ? String(valorLoja) : '')

      if (vVisita !== vLoja) {
        alteracoes.push({
          chave,
          label: LABEL_CAMPO[chave] ?? chave,
          anterior: vLoja,
          novo: vVisita,
        })
      }
    }

    if (alteracoes.length > 0) {
      setModalAlteracoes(alteracoes)
    } else {
      avancarEstadoDireto('concluida')
    }
  }

  async function avancarEstadoDireto(novoEstado: string) {
    const supabase = createClient()
    await supabase.from('visitas').update({ estado: novoEstado }).eq('id', visita.id)
    setEstadoVisita(novoEstado)
    router.refresh()
  }

  async function confirmarConclusao(atualizarLoja: boolean) {
    setAAtualizarLoja(true)
    const supabase = createClient()

    if (atualizarLoja && modalAlteracoes) {
      const chaveMap = buildChaveMap()
      const update: Record<string, any> = {}
      for (const alt of modalAlteracoes) {
        const campoId = chaveMap[alt.chave]
        if (!campoId) continue
        const valor = respostas[campoId]
        update[alt.chave] = valor
      }
      await supabase.from('lojas').update(update).eq('id', visita.loja_id)
    }

    await supabase.from('visitas').update({ estado: 'concluida' }).eq('id', visita.id)
    setEstadoVisita('concluida')
    setModalAlteracoes(null)
    setAAtualizarLoja(false)
    router.refresh()
  }

  async function handleAssinar() {
    setAAssinar(true)
    const supabase = createClient()
    let pdfUrl: string | null = null

    if (pdfAssinadoFile) {
      const nomeStorage = `${visita.id}/assinado_${Date.now()}.pdf`
      const { error: uploadErr } = await supabase.storage
        .from('visita-fotos')
        .upload(nomeStorage, pdfAssinadoFile, { contentType: 'application/pdf' })

      if (uploadErr) {
        alert('Erro ao fazer upload do PDF: ' + uploadErr.message)
        setAAssinar(false)
        return
      }
      const { data: { publicUrl } } = supabase.storage.from('visita-fotos').getPublicUrl(nomeStorage)
      pdfUrl = publicUrl
    }

    const { error } = await supabase.from('visitas').update({
      estado: 'assinada',
      pdf_assinado_url: pdfUrl,
      data_assinatura: new Date().toISOString(),
    }).eq('id', visita.id)

    if (error) {
      // Tentar só atualizar o estado — colunas novas podem ainda não existir na BD
      const { error: err2 } = await supabase.from('visitas')
        .update({ estado: 'assinada' })
        .eq('id', visita.id)

      if (err2) {
        alert('Erro ao marcar como assinada: ' + err2.message)
        setAAssinar(false)
        return
      }
    }

    setEstadoVisita('assinada')
    setModalAssinatura(false)
    setAAssinar(false)
    router.refresh()
  }

  async function handleReagendar() {
    if (!novaData) return
    setAReagendar(true)
    const supabase = createClient()
    await supabase.from('visitas').update({ data_visita: novaData }).eq('id', visita.id)
    setModalReagendar(false)
    setAReagendar(false)
    router.refresh()
  }

  async function handleConsultarNextbitt() {
    setErroConsultar('')
    setDadosNextbitt(null)
    setAConsultar(true)
    setModalConsultar(true)
    try {
      const res = await fetch(`/api/nextbitt/consultar?visita_id=${visita.id}`)
      const json = await res.json()
      if (!res.ok) { setErroConsultar(json.erro ?? 'Erro ao consultar.'); setAConsultar(false); return }
      setDadosNextbitt(json)
    } catch {
      setErroConsultar('Erro de rede. Não foi possível contactar o servidor.')
    }
    setAConsultar(false)
  }

  async function handleExportarNextbitt() {
    setErroNextbitt('')
    setAvisoNextbitt('')
    setAExportar(true)
    try {
      const res = await fetch('/api/nextbitt/exportar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visita_id: visita.id }),
      })
      const json = await res.json()
      if (json.logs) setLogsNextbitt(json.logs)
      if (!res.ok) {
        setErroNextbitt(json.erro ?? 'Erro ao exportar.')
        setAExportar(false)
        return
      }
      setNextbittExportado(true)
      setNextbittExportadoEm(new Date().toISOString())
      if (json.aviso) {
        setAvisoNextbitt(json.aviso)
      }
    } catch {
      setErroNextbitt('Erro de rede. Não foi possível contactar o servidor. Tente novamente.')
    }
    setAExportar(false)
  }

  async function handleApagar() {
    if (!confirm('Apagar esta visita? Esta ação não pode ser revertida.')) return
    setAApagar(true)
    const supabase = createClient()
    // Apagar fotos do storage
    for (const foto of fotos) {
      const path = foto.url.split('/visita-fotos/')[1]
      if (path) await supabase.storage.from('visita-fotos').remove([path])
    }
    await supabase.from('visitas').delete().eq('id', visita.id)
    router.push('/dashboard/visitas')
    router.refresh()
  }

  // ── UPLOAD DE FOTOS ──────────────────────────────────────────
  async function handleUploadFoto(file: File) {
    setUploadingFoto(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop() ?? 'jpg'
    const nomeStorage = `${visita.id}/foto_${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('visita-fotos').upload(nomeStorage, file, { contentType: file.type })

    if (uploadError) { alert('Erro ao fazer upload da foto: ' + uploadError.message); setUploadingFoto(false); return }

    const { data: { publicUrl } } = supabase.storage.from('visita-fotos').getPublicUrl(nomeStorage)
    const { data: novaFoto } = await supabase.from('visita_fotos').insert({
      visita_id: visita.id, url: publicUrl, ordem: fotos.length,
    }).select().single()

    if (novaFoto) setFotos(prev => [...prev, novaFoto])
    setUploadingFoto(false)
  }

  async function handleRemoverFoto(fotoId: string, url: string) {
    if (!confirm('Remover esta foto?')) return
    const supabase = createClient()
    const path = url.split('/visita-fotos/')[1]
    if (path) await supabase.storage.from('visita-fotos').remove([path])
    await supabase.from('visita_fotos').delete().eq('id', fotoId)
    setFotos(prev => prev.filter(f => f.id !== fotoId))
  }

  const indicadorGuardar = {
    guardado:  { texto: '✓ Guardado', cor: 'text-green-600' },
    guardando: { texto: '● A guardar...', cor: 'text-gray-400' },
    alterado:  { texto: '● Por guardar', cor: 'text-orange-500' },
    erro:      { texto: '✗ Erro ao guardar', cor: 'text-red-500' },
  }[estadoGuardar]

  return (
    <div className="p-4 lg:p-8 max-w-3xl pb-24 lg:pb-8">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/visitas" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{visita.lojas?.nome}</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {visita.lojas?.entidades?.nome} · {visita.templates?.nome} ·{' '}
              {new Date(visita.data_visita).toLocaleDateString('pt-PT')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium ${indicadorGuardar.cor}`}>{indicadorGuardar.texto}</span>
          <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${estadoCor[estadoVisita]}`}>
            {estadoLabel[estadoVisita]}
          </span>
        </div>
      </div>

      {/* Banner: visita agendada */}
      {estadoVisita === 'agendada' && (
        <div className={`border rounded-xl p-4 mb-6 flex items-center justify-between gap-4 ${dataPassou ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${dataPassou ? 'bg-amber-100' : 'bg-blue-100'}`}>
              {dataPassou
                ? <AlertTriangle className="w-4 h-4 text-amber-600" />
                : <CheckCircle className="w-4 h-4 text-blue-600" />
              }
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-medium ${dataPassou ? 'text-amber-800' : 'text-blue-800'}`}>
                {dataPassou ? 'A data desta visita já passou' : 'Visita agendada'}
              </p>
              <p className={`text-xs mt-0.5 ${dataPassou ? 'text-amber-600' : 'text-blue-600'}`}>
                {dataPassou
                  ? `Estava prevista para ${new Date(visita.data_visita + 'T12:00:00').toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}. A visita foi realizada?`
                  : `Prevista para ${new Date(visita.data_visita + 'T12:00:00').toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}`
                }
              </p>
            </div>
          </div>
          {podeGerir && (
            <div className="flex gap-2 flex-shrink-0">
              {dataPassou && (
                <button
                  onClick={() => setModalReagendar(true)}
                  className="px-3 py-2 rounded-lg text-sm font-medium border border-amber-300 text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  Reagendar
                </button>
              )}
              <button
                onClick={async () => {
                  await createClient().from('visitas').update({ estado: 'em_curso' }).eq('id', visita.id)
                  setEstadoVisita('em_curso')
                }}
                className="text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: '#D41317' }}
              >
                {dataPassou ? 'Sim, iniciar' : 'Iniciar relatório'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Info técnico / cliente */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-5 mb-6 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-400 mb-1">Técnico</p>
          <p className="text-sm font-medium text-gray-900">{visita.profiles?.nome}</p>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Nome do cliente / responsável</label>
          <input value={nomeCliente} onChange={e => setNome(e.target.value)}
            disabled={!podeEditar} placeholder="Nome de quem assina"
            className="w-full px-3 py-3 lg:py-2 border border-gray-200 rounded-lg text-base lg:text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317] disabled:bg-gray-50 disabled:text-gray-500" />
        </div>
      </div>

      {/* Secções e campos */}
      <div className="space-y-6 mb-6">
        {secoes.map((secao: any) => (
          <div key={secao.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 lg:px-5 py-3.5 lg:py-3 bg-gray-50 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">{secao.titulo}</h2>
            </div>
            <div className="p-4 lg:p-5 space-y-6 lg:space-y-5">
              {[...(secao.template_campos ?? [])]
                .sort((a: any, b: any) => a.ordem - b.ordem)
                .map((tc: any) => (
                  <CampoInput key={tc.id} tc={tc}
                    valor={respostas[tc.campo_id]}
                    respostas={respostas}
                    secoes={secoes}
                    onChange={(v) => setResposta(tc.campo_id, v)}
                    disabled={!podeEditar} />
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Fotos */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Camera className="w-4 h-4 text-gray-400" />
            Fotos ({fotos.length})
          </h2>
          {podeEditar && (
            <div className="flex gap-2">
              {/* Câmara directa — só aparece em touch/tablet */}
              <button onClick={() => cameraInputRef.current?.click()} disabled={uploadingFoto}
                className="lg:hidden flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                <Camera className="w-4 h-4" />
                Câmara
              </button>
              {/* Galeria / ficheiro */}
              <button onClick={() => fotoInputRef.current?.click()} disabled={uploadingFoto}
                className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 lg:px-3 lg:py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                <Upload className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
                {uploadingFoto ? 'A carregar...' : <span><span className="lg:hidden">Galeria</span><span className="hidden lg:inline">Adicionar foto</span></span>}
              </button>
            </div>
          )}
          {/* Input galeria */}
          <input ref={fotoInputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => { Array.from(e.target.files ?? []).forEach(f => handleUploadFoto(f)); e.target.value = '' }} />
          {/* Input câmara directa */}
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={e => { Array.from(e.target.files ?? []).forEach(f => handleUploadFoto(f)); e.target.value = '' }} />
        </div>
        {fotos.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {fotos.map((foto) => (
              <div key={foto.id} className="relative aspect-square group">
                <img src={foto.url} alt={foto.legenda || 'Foto'} className="w-full h-full object-cover rounded-lg border border-gray-200" />
                {podeEditar && (
                  <button onClick={() => handleRemoverFoto(foto.id, foto.url)}
                    className="absolute top-2 right-2 w-8 h-8 lg:w-6 lg:h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shadow-sm">
                    <X className="w-4 h-4 lg:w-3 lg:h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 lg:p-8 text-center text-sm text-gray-400">
            {podeEditar ? (
              <div className="space-y-3">
                <Camera className="w-10 h-10 lg:w-8 lg:h-8 mx-auto opacity-20" />
                <p>Sem fotos ainda</p>
                <div className="flex gap-2 justify-center">
                  <button onClick={() => cameraInputRef.current?.click()}
                    className="lg:hidden px-4 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Câmara
                  </button>
                  <button onClick={() => fotoInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span className="lg:hidden">Galeria</span>
                    <span className="hidden lg:inline">Adicionar fotos</span>
                  </button>
                </div>
              </div>
            ) : <p>Sem fotos nesta visita</p>}
          </div>
        )}
      </div>


      {/* Acções — barra fixa no fundo em mobile/tablet, inline no desktop */}
      <div className="fixed bottom-0 left-0 right-0 lg:static bg-white lg:bg-transparent border-t border-gray-200 lg:border-0 px-4 py-3 lg:p-0 shadow-[0_-2px_12px_rgba(0,0,0,0.08)] lg:shadow-none z-30 flex items-center gap-2 lg:gap-3 flex-wrap">
        {(estadoVisita === 'concluida' || estadoVisita === 'assinada') && (
          <a href={`/api/visitas/${visita.id}/pdf`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <FileDown className="w-4 h-4" />
            Gerar PDF
          </a>
        )}
        {estadoVisita === 'assinada' && !visita.pdf_assinado_url && (profile?.role === 'admin' || profile?.id === visita.tecnico_id) && (
          <button onClick={() => setModalAssinatura(true)}
            className="flex items-center gap-2 border border-orange-300 text-orange-700 bg-orange-50 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors">
            <Upload className="w-4 h-4" />
            Adicionar PDF assinado
          </button>
        )}
        {estadoVisita === 'assinada' && visita.pdf_assinado_url && (
          <a href={visita.pdf_assinado_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 border border-green-300 text-green-700 bg-green-50 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors">
            <FileDown className="w-4 h-4" />
            PDF Assinado
          </a>
        )}
        {estadoVisita === 'assinada' && visita.pdf_assinado_url && visita.lojas?.nextbitt_lo_id && (
          nextbittExportado ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 border border-blue-200 text-blue-600 bg-blue-50 px-5 py-2.5 rounded-lg text-sm font-medium">
                <Send className="w-4 h-4" />
                Exportado para Nextbitt
                {nextbittExportadoEm && (
                  <span className="text-xs text-blue-400 ml-1">
                    {new Date(nextbittExportadoEm).toLocaleDateString('pt-PT')}
                  </span>
                )}
              </div>
              <button
                onClick={handleConsultarNextbitt}
                className="flex items-center gap-2 border border-gray-200 text-gray-600 bg-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Verificar dados
              </button>
            </div>
          ) : (
            <button
              onClick={() => setModalNextbitt(true)}
              className="flex items-center gap-2 border border-blue-300 text-blue-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              <Send className="w-4 h-4" />
              Exportar para Nextbitt
            </button>
          )
        )}
        {podeEditar && estadoVisita === 'rascunho' && (
          <button onClick={() => avancarEstadoDireto('em_curso')}
            className="flex items-center gap-2 bg-orange-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
            Marcar em curso
          </button>
        )}
        {podeEditar && estadoVisita === 'em_curso' && (
          <button onClick={handleConcluir}
            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
            <CheckCircle className="w-4 h-4" />
            Concluir visita
          </button>
        )}
        {estadoVisita === 'concluida' && (profile?.role === 'admin' || profile?.id === visita.tecnico_id) && (
          <button onClick={() => setModalAssinatura(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: '#D41317' }}>
            <PenLine className="w-4 h-4" />
            Marcar como assinada
          </button>
        )}
        {(estadoVisita === 'rascunho' || estadoVisita === 'em_curso') &&
          (profile?.role === 'admin' || profile?.id === visita.tecnico_id) && (
          <button onClick={handleApagar} disabled={aApagar}
            className="ml-auto flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-4 py-2.5 rounded-lg disabled:opacity-50 transition-colors">
            <Trash2 className="w-4 h-4" />
            {aApagar ? 'A apagar...' : 'Apagar visita'}
          </button>
        )}
      </div>

      {/* Input PDF oculto */}
      <input ref={pdfInputRef} type="file" accept="application/pdf" className="hidden"
        onChange={e => setPdfAssinadoFile(e.target.files?.[0] ?? null)} />

      {/* Modal de assinatura */}
      {modalAssinatura && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FEE2E2' }}>
                <PenLine className="w-4 h-4" style={{ color: '#D41317' }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Marcar como assinada</h3>
                <p className="text-xs text-gray-500 mt-0.5">O relatório ficará bloqueado para edição</p>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-600">
                Anexe o PDF devolvido pelo cliente com a assinatura. É obrigatório para exportar para o Nextbitt.
              </p>

              <div>
                {pdfAssinadoFile ? (
                  <div className="flex items-center gap-3 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg">
                    <FileDown className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-green-800 flex-1 truncate">{pdfAssinadoFile.name}</span>
                    <button onClick={() => setPdfAssinadoFile(null)} className="text-green-500 hover:text-green-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => pdfInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors">
                    <Upload className="w-4 h-4" />
                    Anexar PDF assinado
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-400">
                Sem PDF não é possível exportar para o Nextbitt.
              </p>
            </div>

            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex gap-2">
              <button onClick={handleAssinar} disabled={aAssinar || !pdfAssinadoFile}
                className="flex-1 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                style={{ backgroundColor: '#D41317' }}>
                {aAssinar ? 'A processar...' : 'Confirmar assinatura'}
              </button>
              <button onClick={() => { setModalAssinatura(false); setPdfAssinadoFile(null) }} disabled={aAssinar}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-100 disabled:opacity-50 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de reagendamento */}
      {modalReagendar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Reagendar visita</h3>
                <p className="text-xs text-gray-500 mt-0.5">Escolha a nova data para esta visita</p>
              </div>
            </div>
            <div className="px-6 py-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nova data</label>
              <input
                type="date"
                value={novaData}
                min={hoje}
                onChange={e => setNovaData(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317]"
              />
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex gap-2">
              <button onClick={handleReagendar} disabled={aReagendar || !novaData}
                className="flex-1 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                style={{ backgroundColor: '#D41317' }}>
                {aReagendar ? 'A guardar...' : 'Confirmar reagendamento'}
              </button>
              <button onClick={() => setModalReagendar(false)} disabled={aReagendar}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-100 disabled:opacity-50 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal exportar Nextbitt */}
      {modalNextbitt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Send className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Exportar para Nextbitt</h3>
                <p className="text-xs text-gray-500 mt-0.5">Inserir dados do relatório na plataforma Nextbitt</p>
              </div>
            </div>

            <div className="px-6 py-5 space-y-3">
              {nextbittExportado ? (
                <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800 font-medium">Pedido criado com sucesso no Nextbitt.</p>
                </div>
              ) : (
                <>
                  <div className="bg-gray-50 rounded-lg px-4 py-3 text-xs text-gray-500 space-y-1">
                    <p><span className="font-medium text-gray-700">Loja:</span> {visita.lojas?.nome}</p>
                    <p><span className="font-medium text-gray-700">Data:</span> {new Date(visita.data_visita + 'T12:00:00').toLocaleDateString('pt-PT')}</p>
                    <p><span className="font-medium text-gray-700">Técnico:</span> {visita.profiles?.nome}</p>
                  </div>
                  {erroNextbitt && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 whitespace-pre-line">{erroNextbitt}</p>
                    </div>
                  )}
                </>
              )}
              {avisoNextbitt && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 whitespace-pre-line">{avisoNextbitt}</p>
                </div>
              )}
              {logsNextbitt.length > 0 && (
                <div className="bg-gray-900 rounded-lg px-3 py-2.5 max-h-48 overflow-y-auto">
                  {logsNextbitt.map((l, i) => (
                    <p key={i} className="text-xs font-mono text-gray-300 leading-5">{l}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex gap-2">
              {nextbittExportado ? (
                <button
                  onClick={() => { setModalNextbitt(false); setLogsNextbitt([]) }}
                  className="flex-1 py-2 rounded-lg text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  Fechar
                </button>
              ) : (
                <>
                  <button
                    onClick={handleExportarNextbitt}
                    disabled={aExportar}
                    className="flex-1 flex items-center justify-center gap-2 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4" />
                    {aExportar ? 'A exportar...' : 'Confirmar exportação'}
                  </button>
                  <button
                    onClick={() => { setModalNextbitt(false); setErroNextbitt(''); setLogsNextbitt([]) }}
                    disabled={aExportar}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal consultar Nextbitt */}
      {modalConsultar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Search className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Dados no Nextbitt</h3>
                  <p className="text-xs text-gray-500 mt-0.5">OT {visita.nextbitt_id} — estado actual</p>
                </div>
              </div>
              <button onClick={() => setModalConsultar(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
              {aConsultar && (
                <div className="flex items-center justify-center py-8 text-gray-400 text-sm gap-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  A consultar Nextbitt...
                </div>
              )}
              {erroConsultar && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{erroConsultar}</p>
                </div>
              )}
              {dadosNextbitt && (
                <>
                  {/* Cabeçalho OT */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Situação</span>
                      <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${dadosNextbitt.ot.situacao_codigo === '14' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {dadosNextbitt.ot.situacao_descricao}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Loja</span>
                      <span className="font-medium text-gray-800">{dadosNextbitt.ot.loja}</span>
                    </div>
                    {dadosNextbitt.ot.data_fecho && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Data de fecho</span>
                        <span className="font-medium text-gray-800">
                          {new Date(dadosNextbitt.ot.data_fecho).toLocaleDateString('pt-PT')}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Anexos</span>
                      <span className={`flex items-center gap-1 font-medium ${dadosNextbitt.ot.anexos > 0 ? 'text-green-700' : 'text-red-600'}`}>
                        <Paperclip className="w-3.5 h-3.5" />
                        {dadosNextbitt.ot.anexos} {dadosNextbitt.ot.anexos === 1 ? 'ficheiro' : 'ficheiros'}
                      </span>
                    </div>
                  </div>

                  {/* Checklist */}
                  {dadosNextbitt.checklist.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Checklist — {dadosNextbitt.checklist.filter((c: any) => c.estado).length}/{dadosNextbitt.checklist.length} preenchidos
                      </p>
                      <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                        {dadosNextbitt.checklist.map((item: any, i: number) => (
                          <div key={i} className="px-4 py-2.5 flex items-start gap-3 bg-white hover:bg-gray-50 transition-colors">
                            <span className={`mt-0.5 text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                              item.estado === 'OK' ? 'bg-green-100 text-green-700' :
                              item.estado === 'NOK' ? 'bg-red-100 text-red-700' :
                              item.estado === 'Sem Aplicacao' ? 'bg-gray-100 text-gray-500' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {item.estado ?? '—'}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-700 font-medium leading-tight">{item.tarefa}</p>
                              {item.notas && <p className="text-xs text-gray-400 mt-0.5 truncate">{item.notas}</p>}
                            </div>
                            {item.data && <span className="text-xs text-gray-400 flex-shrink-0">{item.data}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setModalConsultar(false)}
                className="w-full py-2 rounded-lg text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de alterações na loja */}
      {modalAlteracoes && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Alterações detetadas</h3>
                <p className="text-xs text-gray-500 mt-0.5">Os dados preenchidos diferem da ficha da loja</p>
              </div>
            </div>

            <div className="px-6 py-4 space-y-2 max-h-60 overflow-y-auto">
              {modalAlteracoes.map(alt => (
                <div key={alt.chave} className="flex items-start gap-3 text-xs py-1.5 border-b border-gray-50 last:border-0">
                  <span className="font-medium text-gray-700 flex-1">{alt.label}</span>
                  <div className="text-right flex-shrink-0">
                    <span className="text-gray-400 line-through block">
                      {alt.anterior === '' || alt.anterior === null || alt.anterior === undefined
                        ? '—'
                        : typeof alt.anterior === 'boolean'
                          ? (alt.anterior ? 'Sim' : 'Não')
                          : alt.anterior}
                    </span>
                    <span className="text-green-700 font-medium block">
                      {typeof alt.novo === 'boolean' ? (alt.novo ? 'Sim' : 'Não') : alt.novo}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
              <p className="text-xs text-gray-500 mb-4">
                Deseja atualizar a ficha da loja com os dados desta visita?
              </p>
              <div className="flex gap-2">
                <button onClick={() => confirmarConclusao(true)} disabled={aAtualizarLoja}
                  className="flex-1 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: '#D41317' }}>
                  {aAtualizarLoja ? 'A atualizar...' : 'Sim, atualizar loja'}
                </button>
                <button onClick={() => confirmarConclusao(false)} disabled={aAtualizarLoja}
                  className="flex-1 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-100 disabled:opacity-50 transition-colors">
                  Não, concluir só visita
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── CAMPO INPUT ──────────────────────────────────────────────────────────────
function CampoInput({ tc, valor, respostas, secoes, onChange, disabled }: {
  tc: any; valor: any; respostas: Record<string, any>; secoes: any[]
  onChange: (v: any) => void; disabled: boolean
}) {
  const campo = tc.campos
  if (!campo) return null

  // Visibilidade condicional: se este campo depende de um tem_X, verificar se está ativo
  const chaveParent = DEPENDENCIAS[campo.chave]
  if (chaveParent) {
    // Encontrar o campoId do parent nas secções
    let parentCampoId: string | null = null
    for (const s of secoes) {
      const parentTc = s.template_campos?.find((t: any) => t.campos?.chave === chaveParent)
      if (parentTc) { parentCampoId = parentTc.campo_id; break }
    }
    // Se o parent existe, esconder sub-campos se: não respondido, false (sim_nao), ou "Sem Aplicação" (escolha_multipla)
    if (parentCampoId) {
      const parentVal = respostas[parentCampoId]
      if (parentVal === undefined || parentVal === null) return null
      if (parentVal === false) return null
      const opcaoSelecionada = Array.isArray(parentVal) ? parentVal[0] : parentVal
      if (opcaoSelecionada === 'Sem Aplicação') return null
    }
  }

  const max = tc.max_caracteres ?? null
  const textoActual = typeof valor === 'string' ? valor : ''
  const base = "w-full px-3 py-3 lg:py-2 border border-gray-200 rounded-lg text-base lg:text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317] disabled:bg-gray-50 disabled:text-gray-500"

  if (campo.tipo === 'separador') {
    return (
      <div className="col-span-full flex items-center gap-3 pt-1 pb-0.5">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">{campo.nome}</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
    )
  }

  return (
    <div>
      <label className={`block text-sm mb-1 ${tc.negrito ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
        {campo.nome}
        {campo.unidade && <span className="text-gray-400 font-normal ml-1">({campo.unidade})</span>}
        {tc.obrigatorio && <span className="text-red-500 ml-1">*</span>}
      </label>
      {campo.descricao && <p className="text-xs text-gray-400 mb-1.5">{campo.descricao}</p>}

      {campo.tipo === 'sim_nao' && (
        <div className="flex gap-3">
          {[{ v: true, l: 'Sim' }, { v: false, l: 'Não' }].map(opt => (
            <button key={String(opt.v)} type="button" disabled={disabled}
              onClick={() => onChange(opt.v)}
              className={`flex-1 py-3 lg:py-2 rounded-lg text-base lg:text-sm font-medium border transition-colors ${
                valor === opt.v
                  ? opt.v ? 'bg-green-50 border-green-400 text-green-700' : 'bg-red-50 border-red-400 text-red-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              } disabled:cursor-not-allowed`}>
              {opt.l}
            </button>
          ))}
        </div>
      )}

      {campo.tipo === 'numero' && (
        <input type="number" step="any" value={valor ?? ''} onChange={e => onChange(e.target.value)}
          disabled={disabled} placeholder={tc.placeholder || '0'} className={base} />
      )}

      {campo.tipo === 'texto' && (
        <div>
          {(max ?? 0) >= 100
            ? <textarea value={textoActual} onChange={e => onChange(e.target.value)}
                disabled={disabled} placeholder={tc.placeholder || ''}
                maxLength={max ?? undefined} rows={5}
                className={`${base} resize-none min-h-[100px]`} />
            : <input type="text" value={textoActual} onChange={e => onChange(e.target.value)}
                disabled={disabled} placeholder={tc.placeholder || ''}
                maxLength={max ?? undefined} className={base} />
          }
          {max && <p className="text-xs text-right mt-1 text-gray-400">{textoActual.length}/{max}</p>}
        </div>
      )}

      {campo.tipo === 'observacao' && (
        <div>
          <textarea value={textoActual} onChange={e => onChange(e.target.value)}
            disabled={disabled} rows={5} placeholder={tc.placeholder || ''}
            maxLength={max ?? undefined} className={`${base} resize-none min-h-[100px]`} />
          {max && <p className="text-xs text-right mt-1 text-gray-400">{textoActual.length}/{max}</p>}
        </div>
      )}

      {campo.tipo === 'data' && (
        <input type="date" value={valor ?? ''} onChange={e => onChange(e.target.value)}
          disabled={disabled} className={base} />
      )}

      {campo.tipo === 'escolha_multipla' && (
        <div className="flex flex-wrap gap-2">
          {(campo.opcoes ?? []).map((op: string, idx: number, arr: string[]) => {
            const selected = valor === op
            const pos = arr.length === 1 ? 'mid'
              : idx === 0 ? 'first'
              : idx === arr.length - 1 ? 'last'
              : 'mid'
            const cor = pos === 'first'
              ? selected ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-600'
              : pos === 'last'
              ? selected ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600'
              : selected ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-gray-200 text-gray-600 hover:border-yellow-300 hover:text-yellow-600'
            return (
              <button key={op} type="button" disabled={disabled}
                onClick={() => onChange(op)}
                className={`px-4 py-3 lg:py-2 rounded-lg text-base lg:text-sm border transition-colors ${cor} ${selected ? 'font-medium' : ''} disabled:cursor-not-allowed`}>
                {op}
              </button>
            )
          })}
        </div>
      )}

      {campo.tipo === 'foto' && (
        <p className="text-xs text-gray-400 italic">Use a secção de fotos em baixo para adicionar fotografias.</p>
      )}
    </div>
  )
}
