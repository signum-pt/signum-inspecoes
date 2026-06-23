'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Zap, Link2 } from 'lucide-react'
import Link from 'next/link'
import type { Entidade } from '@/lib/types'

const DISTRITOS_PT = [
  'Aveiro', 'Beja', 'Braga', 'Bragança', 'Castelo Branco', 'Coimbra',
  'Évora', 'Faro', 'Guarda', 'Leiria', 'Lisboa', 'Portalegre',
  'Porto', 'Santarém', 'Setúbal', 'Viana do Castelo', 'Vila Real', 'Viseu',
]
const TIPOS_ALIMENTACAO = ['Monofásico', 'Trifásico']
const TENSOES = ['230V', '400V', '230/400V']
const TIPOS_PT = ['CA', 'CB', 'AI', 'AS', 'ED']

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-700">{label}</span>
      <button type="button" onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${value ? 'bg-[#D41317]' : 'bg-gray-200'}`}>
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

function InfraRow({ show, children }: { show: boolean; children: React.ReactNode }) {
  if (!show) return null
  return <div className="ml-4 mt-2 grid grid-cols-2 gap-3 border-l-2 border-red-100 pl-4">{children}</div>
}

export default function NovaLojaForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const entidadeIdInicial = searchParams.get('entidade_id') ?? ''

  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [entidades, setEntidades] = useState<Entidade[]>([])
  const [entidadeId, setEntidadeId] = useState(entidadeIdInicial)
  const [nomeEntidade, setNomeEntidade] = useState('')

  // Dados gerais
  const [nome, setNome] = useState('')
  const [morada, setMorada] = useState('')
  const [cidade, setCidade] = useState('')
  const [codigoPostal, setCodigoPostal] = useState('')
  const [distrito, setDistrito] = useState('')
  const [contacto, setContacto] = useState('')
  const [emailContacto, setEmailContacto] = useState('')
  const [notas, setNotas] = useState('')

  // Alimentação geral
  const [cpe, setCpe] = useState('')
  const [tipoAlimentacao, setTipoAlimentacao] = useState('')
  const [tensao, setTensao] = useState('')
  const [potenciaContratada, setPotenciaContratada] = useState('')
  const [disjuntorGeral, setDisjuntorGeral] = useState('')

  // Infraestrutura
  const [temPt, setTemPt] = useState(false)
  const [ptKva, setPtKva] = useState('')
  const [ptTipo, setPtTipo] = useState('')
  const [ptTransformador, setPtTransformador] = useState('')
  const [ptNumPtc, setPtNumPtc] = useState('')
  const [temGerador, setTemGerador] = useState(false)
  const [geradorKva, setGeradorKva] = useState('')
  const [quadroUsVoltagem, setQuadroUsVoltagem] = useState('')
  const [quadroUsUc, setQuadroUsUc] = useState('')
  const [temUps, setTemUps] = useState(false)
  const [upsKva, setUpsKva] = useState('')
  const [temTrafoIsolamento, setTemTrafoIsolamento] = useState(false)
  const [trafoIsolamentoKva, setTrafoIsolamentoKva] = useState('')
  const [temBateriaCondensadores, setTemBateriaCondensadores] = useState(false)
  const [bateriaCondensadoresKvar, setBateriaCondensadoresKvar] = useState('')
  const [temPac, setTemPac] = useState(false)
  const [temUpac, setTemUpac] = useState(false)
  const [upacKva, setUpacKva] = useState('')
  const [temPcve, setTemPcve] = useState(false)
  const [pcveKva, setPcveKva] = useState('')
  const [nextbittLoId, setNextbittLoId] = useState('')

  useEffect(() => {
    createClient().from('entidades').select('*').eq('ativo', true).order('nome').then(({ data }) => {
      if (data) {
        setEntidades(data)
        if (entidadeIdInicial) {
          const encontrada = data.find((e) => e.id === entidadeIdInicial)
          if (encontrada) setNomeEntidade(encontrada.nome)
        }
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!entidadeId) { setErro('Selecione uma entidade.'); return }
    if (!nome.trim()) { setErro('O nome é obrigatório.'); return }
    setErro('')
    setCarregando(true)

    const { error } = await createClient().from('lojas').insert({
      entidade_id: entidadeId,
      nome, morada, cidade, codigo_postal: codigoPostal,
      distrito: distrito || null,
      contacto, email_contacto: emailContacto, notas,
      cpe, tipo_alimentacao: tipoAlimentacao, tensao,
      potencia_contratada: potenciaContratada, disjuntor_geral: disjuntorGeral,
      tem_pt: temPt, pt_kva: ptKva, pt_tipo: ptTipo, pt_transformador: ptTransformador, pt_num_ptc: ptNumPtc,
      tem_gerador: temGerador, gerador_kva: geradorKva,
      quadro_us_voltagem: quadroUsVoltagem, quadro_us_uc: quadroUsUc,
      tem_ups: temUps, ups_kva: upsKva,
      tem_trafo_isolamento: temTrafoIsolamento, trafo_isolamento_kva: trafoIsolamentoKva,
      tem_bateria_condensadores: temBateriaCondensadores, bateria_condensadores_kvar: bateriaCondensadoresKvar,
      tem_pac: temPac,
      tem_upac: temUpac, upac_kva: upacKva,
      tem_pcve: temPcve, pcve_kva: pcveKva,
      nextbitt_lo_id: nextbittLoId || null,
    })

    if (error) { setErro('Erro ao guardar. Tente novamente.'); setCarregando(false); return }
    router.push(entidadeIdInicial ? `/dashboard/entidades/${entidadeId}` : '/dashboard/lojas')
    router.refresh()
  }

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317] focus:border-transparent"
  const selectCls = `${inputCls} bg-white`
  const backHref = entidadeIdInicial ? `/dashboard/entidades/${entidadeIdInicial}` : '/dashboard/lojas'

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href={backHref} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova loja</h1>
          <p className="text-gray-500 text-sm mt-0.5">{nomeEntidade || 'Preencha os dados da instalação'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Dados gerais */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Dados gerais</h2>

          {!entidadeIdInicial && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entidade *</label>
              <select value={entidadeId} onChange={e => {
                setEntidadeId(e.target.value)
                setNomeEntidade(entidades.find(en => en.id === e.target.value)?.nome ?? '')
              }} required className={selectCls}>
                <option value="">Selecionar entidade...</option>
                {entidades.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da loja *</label>
            <input value={nome} onChange={e => setNome(e.target.value)} required
              placeholder={nomeEntidade ? `ex: ${nomeEntidade} de Viseu` : 'ex: Nome da loja'}
              className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Morada</label>
            <input value={morada} onChange={e => setMorada(e.target.value)} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input value={cidade} onChange={e => setCidade(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código postal</label>
              <input value={codigoPostal} onChange={e => setCodigoPostal(e.target.value)} placeholder="0000-000" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Distrito</label>
            <select value={distrito} onChange={e => setDistrito(e.target.value)} className={selectCls}>
              <option value="">— Selecionar distrito —</option>
              {DISTRITOS_PT.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
              <input value={contacto} onChange={e => setContacto(e.target.value)} placeholder="+351 000 000 000" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={emailContacto} onChange={e => setEmailContacto(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas</label>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={3}
              className={`${inputCls} resize-none`} placeholder="Informações relevantes sobre a instalação..." />
          </div>
        </div>

        {/* Alimentação geral */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            Alimentação geral
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPE</label>
            <input value={cpe} onChange={e => setCpe(e.target.value)} placeholder="PT00XXXXXXXXXX" className={inputCls} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select value={tipoAlimentacao} onChange={e => setTipoAlimentacao(e.target.value)} className={selectCls}>
                <option value="">—</option>
                {TIPOS_ALIMENTACAO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tensão</label>
              <select value={tensao} onChange={e => setTensao(e.target.value)} className={selectCls}>
                <option value="">—</option>
                {TENSOES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Potência (kVA)</label>
              <input value={potenciaContratada} onChange={e => setPotenciaContratada(e.target.value)} placeholder="ex: 41.4" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Disjuntor geral (A)</label>
            <input value={disjuntorGeral} onChange={e => setDisjuntorGeral(e.target.value)} placeholder="ex: 63A" className={inputCls} />
          </div>
        </div>

        {/* Infraestrutura elétrica */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            Infraestrutura elétrica
          </h2>

          <Toggle label="Posto de transformação (PT)" value={temPt} onChange={setTemPt} />
          <InfraRow show={temPt}>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Potência (kVA)</label>
              <input value={ptKva} onChange={e => setPtKva(e.target.value)} placeholder="ex: 630" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipo</label>
              <select value={ptTipo} onChange={e => setPtTipo(e.target.value)} className={selectCls}>
                <option value="">—</option>
                {TIPOS_PT.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Transformador <span className="text-gray-400">(kVA)</span></label>
              <input value={ptTransformador} onChange={e => setPtTransformador(e.target.value)} placeholder="ex: 250" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nº PTC</label>
              <input value={ptNumPtc} onChange={e => setPtNumPtc(e.target.value)} placeholder="ex: PTC-12345" className={inputCls} />
            </div>
          </InfraRow>

          <Toggle label="Grupo gerador" value={temGerador} onChange={setTemGerador} />
          <InfraRow show={temGerador}>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Potência (kVA)</label>
              <input value={geradorKva} onChange={e => setGeradorKva(e.target.value)} placeholder="ex: 250" className={inputCls} />
            </div>
          </InfraRow>

          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-medium text-gray-500 mb-2">Quadros elétricos</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">US (V)</label>
                <input value={quadroUsVoltagem} onChange={e => setQuadroUsVoltagem(e.target.value)} placeholder="ex: 400" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">UC (V)</label>
                <input value={quadroUsUc} onChange={e => setQuadroUsUc(e.target.value)} placeholder="ex: 230" className={inputCls} />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-3">
            <Toggle label="UPS" value={temUps} onChange={setTemUps} />
            <InfraRow show={temUps}>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Potência (kVA)</label>
                <input value={upsKva} onChange={e => setUpsKva(e.target.value)} placeholder="ex: 10" className={inputCls} />
              </div>
            </InfraRow>

            <Toggle label="Transformador de isolamento" value={temTrafoIsolamento} onChange={setTemTrafoIsolamento} />
            <InfraRow show={temTrafoIsolamento}>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Potência (kVA)</label>
                <input value={trafoIsolamentoKva} onChange={e => setTrafoIsolamentoKva(e.target.value)} placeholder="ex: 10" className={inputCls} />
              </div>
            </InfraRow>

            <Toggle label="Bateria de condensadores" value={temBateriaCondensadores} onChange={setTemBateriaCondensadores} />
            <InfraRow show={temBateriaCondensadores}>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Potência (kVAr)</label>
                <input value={bateriaCondensadoresKvar} onChange={e => setBateriaCondensadoresKvar(e.target.value)} placeholder="ex: 50" className={inputCls} />
              </div>
            </InfraRow>

            <Toggle label="PAC (posto abastecimento combustível)" value={temPac} onChange={setTemPac} />

            <Toggle label="UPAC" value={temUpac} onChange={setTemUpac} />
            <InfraRow show={temUpac}>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Potência (kVA)</label>
                <input value={upacKva} onChange={e => setUpacKva(e.target.value)} placeholder="ex: 100" className={inputCls} />
              </div>
            </InfraRow>

            <Toggle label="PCVE (posto carregamento veículos elétricos)" value={temPcve} onChange={setTemPcve} />
            <InfraRow show={temPcve}>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Potência (kVA)</label>
                <input value={pcveKva} onChange={e => setPcveKva(e.target.value)} placeholder="ex: 22" className={inputCls} />
              </div>
            </InfraRow>
          </div>
        </div>

        {/* Integração Nextbitt */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-blue-500" />
            Integração Nextbitt
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código da Localização <span className="text-gray-400 font-normal text-xs">(lo_id)</span>
            </label>
            <input
              value={nextbittLoId}
              onChange={e => setNextbittLoId(e.target.value.toUpperCase())}
              placeholder="ex: PTCBD35745"
              className={`${inputCls} font-mono`}
            />
            <p className="text-xs text-gray-400 mt-1">Se preenchido, os relatórios desta loja podem ser exportados para o Nextbitt.</p>
          </div>
        </div>

        {erro && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={carregando}
            className="text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#A50E11] disabled:opacity-50 transition-colors"
            style={{ backgroundColor: '#D41317' }}>
            {carregando ? 'A guardar...' : 'Guardar loja'}
          </button>
          <Link href={backHref}
            className="px-5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </Link>
        </div>

      </form>
    </div>
  )
}
