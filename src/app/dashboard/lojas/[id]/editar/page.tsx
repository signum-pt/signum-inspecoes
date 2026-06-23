'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Zap, Link2 } from 'lucide-react'
import Link from 'next/link'

const DISTRITOS_PT = [
  'Aveiro', 'Beja', 'Braga', 'Bragança', 'Castelo Branco', 'Coimbra',
  'Évora', 'Faro', 'Guarda', 'Leiria', 'Lisboa', 'Portalegre',
  'Porto', 'Santarém', 'Setúbal', 'Viana do Castelo', 'Vila Real', 'Viseu',
]

const TIPOS_ALIMENTACAO = ['MT', 'BT', 'BTN']
const TIPOS_PT = ['CA', 'CB', 'AI', 'AS', 'ED']

export default function EditarLojaPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [aCarregar, setACarregar] = useState(true)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

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

  // PT
  const [temPt, setTemPt] = useState(false)
  const [ptKva, setPtKva] = useState('')
  const [ptTipo, setPtTipo] = useState('')
  const [ptTransformador, setPtTransformador] = useState('')
  const [ptNumPtc, setPtNumPtc] = useState('')

  // Gerador Socorro
  const [temGeradorSocorro, setTemGeradorSocorro] = useState(false)
  const [geradorSocorroKva, setGeradorSocorroKva] = useState('')
  // Gerador Segurança
  const [temGeradorSeguranca, setTemGeradorSeguranca] = useState(false)
  const [geradorSegurancaKva, setGeradorSegurancaKva] = useState('')

  // Quadros US
  const [quadroUsVoltagem, setQuadroUsVoltagem] = useState('')
  const [quadroUsUc, setQuadroUsUc] = useState('')

  // UPS
  const [temUps, setTemUps] = useState(false)
  const [upsKva, setUpsKva] = useState('')

  // Trafo isolamento
  const [temTrafoIsolamento, setTemTrafoIsolamento] = useState(false)
  const [trafoIsolamentoKva, setTrafoIsolamentoKva] = useState('')

  // Bateria condensadores
  const [temBateriaCondensadores, setTemBateriaCondensadores] = useState(false)
  const [bateriaCondensadoresKvar, setBateriaCondensadoresKvar] = useState('')

  // PAC
  const [temPac, setTemPac] = useState(false)

  // UPAC
  const [temUpac, setTemUpac] = useState(false)
  const [upacKva, setUpacKva] = useState('')

  // PCVE
  const [temPcve, setTemPcve] = useState(false)
  const [pcveKva, setPcveKva] = useState('')

  // Nextbitt
  const [nextbittLoId, setNextbittLoId] = useState('')

  useEffect(() => {
    createClient().from('lojas').select('*').eq('id', id).single().then(({ data: d }) => {
      if (d) {
        setNome(d.nome ?? '')
        setMorada(d.morada ?? '')
        setCidade(d.cidade ?? '')
        setCodigoPostal(d.codigo_postal ?? '')
        setContacto(d.contacto ?? '')
        setEmailContacto(d.email_contacto ?? '')
        setNotas(d.notas ?? '')
        setDistrito(d.distrito ?? '')
        setCpe(d.cpe ?? '')
        setTipoAlimentacao(d.tipo_alimentacao ?? '')
        setTemPt(d.tem_pt ?? false)
        setPtKva(d.pt_kva ?? '')
        setPtTipo(d.pt_tipo ?? '')
        setPtTransformador(d.pt_transformador ?? '')
        setPtNumPtc(d.pt_num_ptc ?? '')
        setTemGeradorSocorro(d.tem_gerador_socorro ?? false)
        setGeradorSocorroKva(d.gerador_socorro_kva ?? '')
        setTemGeradorSeguranca(d.tem_gerador_seguranca ?? false)
        setGeradorSegurancaKva(d.gerador_seguranca_kva ?? '')
        setQuadroUsVoltagem(d.quadro_us_voltagem ?? '')
        setQuadroUsUc(d.quadro_us_uc ?? '')
        setTemUps(d.tem_ups ?? false)
        setUpsKva(d.ups_kva ?? '')
        setTemTrafoIsolamento(d.tem_trafo_isolamento ?? false)
        setTrafoIsolamentoKva(d.trafo_isolamento_kva ?? '')
        setTemBateriaCondensadores(d.tem_bateria_condensadores ?? false)
        setBateriaCondensadoresKvar(d.bateria_condensadores_kvar ?? '')
        setTemPac(d.tem_pac ?? false)
        setTemUpac(d.tem_upac ?? false)
        setUpacKva(d.upac_kva ?? '')
        setTemPcve(d.tem_pcve ?? false)
        setPcveKva(d.pcve_kva ?? '')
        setNextbittLoId(d.nextbitt_lo_id ?? '')
      }
      setACarregar(false)
    })
  }, [id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) { setErro('O nome é obrigatório.'); return }
    setErro('')
    setCarregando(true)

    const { error } = await createClient().from('lojas').update({
      nome, morada, cidade, codigo_postal: codigoPostal, distrito: distrito || null,
      contacto, email_contacto: emailContacto, notas,
      cpe, tipo_alimentacao: tipoAlimentacao,
      tem_pt: temPt, pt_kva: ptKva, pt_tipo: ptTipo, pt_transformador: ptTransformador, pt_num_ptc: ptNumPtc,
      tem_gerador_socorro: temGeradorSocorro, gerador_socorro_kva: geradorSocorroKva,
      tem_gerador_seguranca: temGeradorSeguranca, gerador_seguranca_kva: geradorSegurancaKva,
      quadro_us_voltagem: quadroUsVoltagem, quadro_us_uc: quadroUsUc,
      tem_ups: temUps, ups_kva: upsKva,
      tem_trafo_isolamento: temTrafoIsolamento, trafo_isolamento_kva: trafoIsolamentoKva,
      tem_bateria_condensadores: temBateriaCondensadores, bateria_condensadores_kvar: bateriaCondensadoresKvar,
      tem_pac: temPac,
      tem_upac: temUpac, upac_kva: upacKva,
      tem_pcve: temPcve, pcve_kva: pcveKva,
      nextbitt_lo_id: nextbittLoId || null,
    }).eq('id', id)

    if (error) { setErro('Erro ao guardar. Tente novamente.'); setCarregando(false); return }
    router.push(`/dashboard/lojas/${id}`)
    router.refresh()
  }

  if (aCarregar) return <div className="p-8 text-sm text-gray-400">A carregar...</div>

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317] focus:border-transparent"
  const selectCls = `${inputCls} bg-white`

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/dashboard/lojas/${id}`} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar loja</h1>
          <p className="text-gray-500 text-sm mt-0.5">{nome}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Dados gerais */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Dados gerais</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da loja *</label>
            <input value={nome} onChange={e => setNome(e.target.value)} required className={inputCls} />
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
              <input value={contacto} onChange={e => setContacto(e.target.value)} className={inputCls} />
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CPE <span className="text-gray-400 font-normal text-xs">— Código do Ponto de Entrega</span>
            </label>
            <input value={cpe} onChange={e => setCpe(e.target.value)}
              placeholder="ex: PT00XXXXXXXXXXXXXXXX" className={`${inputCls} font-mono`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de alimentação</label>
            <select value={tipoAlimentacao} onChange={e => setTipoAlimentacao(e.target.value)} className={selectCls}>
              <option value="">Selecionar...</option>
              {TIPOS_ALIMENTACAO.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Infra elétrica */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-900">Infraestrutura elétrica</h2>

          {/* PT */}
          <InfraRow
            label="Posto de Transformação (PT)"
            checked={temPt} onToggle={() => setTemPt(v => !v)}
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Potência <span className="text-gray-400">(kVA)</span></label>
                <input value={ptKva} onChange={e => setPtKva(e.target.value)} placeholder="ex: 630" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tipo</label>
                <select value={ptTipo} onChange={e => setPtTipo(e.target.value)} className={selectCls}>
                  <option value="">Selecionar...</option>
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
            </div>
          </InfraRow>

          {/* Gerador Socorro */}
          <InfraRow label="Grupo Gerador Socorro" checked={temGeradorSocorro} onToggle={() => setTemGeradorSocorro(v => !v)}>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Potência <span className="text-gray-400">(kVA)</span></label>
              <input value={geradorSocorroKva} onChange={e => setGeradorSocorroKva(e.target.value)} placeholder="ex: 200" className={inputCls} />
            </div>
          </InfraRow>

          {/* Gerador Segurança */}
          <InfraRow label="Grupo Gerador Segurança" checked={temGeradorSeguranca} onToggle={() => setTemGeradorSeguranca(v => !v)}>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Potência <span className="text-gray-400">(kVA)</span></label>
              <input value={geradorSegurancaKva} onChange={e => setGeradorSegurancaKva(e.target.value)} placeholder="ex: 200" className={inputCls} />
            </div>
          </InfraRow>

          {/* Quadros US */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Quadros elétricos US</p>
            <div className="grid grid-cols-2 gap-3 pl-1">
              <div>
                <label className="block text-xs text-gray-500 mb-1">US <span className="text-gray-400">(V)</span></label>
                <input value={quadroUsVoltagem} onChange={e => setQuadroUsVoltagem(e.target.value)} placeholder="ex: 400" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">UC <span className="text-gray-400">(V)</span></label>
                <input value={quadroUsUc} onChange={e => setQuadroUsUc(e.target.value)} placeholder="ex: 230" className={inputCls} />
              </div>
            </div>
          </div>

          {/* UPS */}
          <InfraRow
            label="UPS"
            checked={temUps} onToggle={() => setTemUps(v => !v)}
          >
            <div>
              <label className="block text-xs text-gray-500 mb-1">Potência <span className="text-gray-400">(kVA)</span></label>
              <input value={upsKva} onChange={e => setUpsKva(e.target.value)} placeholder="ex: 10" className={inputCls} />
            </div>
          </InfraRow>

          {/* Trafo isolamento */}
          <InfraRow
            label="Transformador de isolamento"
            checked={temTrafoIsolamento} onToggle={() => setTemTrafoIsolamento(v => !v)}
          >
            <div>
              <label className="block text-xs text-gray-500 mb-1">Potência <span className="text-gray-400">(kVA)</span></label>
              <input value={trafoIsolamentoKva} onChange={e => setTrafoIsolamentoKva(e.target.value)} placeholder="ex: 5" className={inputCls} />
            </div>
          </InfraRow>

          {/* Bateria condensadores */}
          <InfraRow
            label="Bateria de condensadores"
            checked={temBateriaCondensadores} onToggle={() => setTemBateriaCondensadores(v => !v)}
          >
            <div>
              <label className="block text-xs text-gray-500 mb-1">Potência reativa <span className="text-gray-400">(kvar)</span></label>
              <input value={bateriaCondensadoresKvar} onChange={e => setBateriaCondensadoresKvar(e.target.value)} placeholder="ex: 50" className={inputCls} />
            </div>
          </InfraRow>

          {/* PAC */}
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <span className="text-sm font-medium text-gray-700">PAC <span className="text-gray-400 font-normal text-xs">(Posto Abastecimento Combustível)</span></span>
            <Toggle checked={temPac} onToggle={() => setTemPac(v => !v)} />
          </div>

          {/* UPAC */}
          <InfraRow
            label={<>UPAC <span className="text-gray-400 font-normal text-xs">(Produção para Autoconsumo)</span></>}
            checked={temUpac} onToggle={() => setTemUpac(v => !v)}
          >
            <div>
              <label className="block text-xs text-gray-500 mb-1">Potência <span className="text-gray-400">(kVA)</span></label>
              <input value={upacKva} onChange={e => setUpacKva(e.target.value)} placeholder="ex: 100" className={inputCls} />
            </div>
          </InfraRow>

          {/* PCVE */}
          <InfraRow
            label={<>PCVE <span className="text-gray-400 font-normal text-xs">(Carregamento Veículos Elétricos)</span></>}
            checked={temPcve} onToggle={() => setTemPcve(v => !v)}
          >
            <div>
              <label className="block text-xs text-gray-500 mb-1">Potência <span className="text-gray-400">(kVA)</span></label>
              <input value={pcveKva} onChange={e => setPcveKva(e.target.value)} placeholder="ex: 22" className={inputCls} />
            </div>
          </InfraRow>
        </div>

        {/* Integração Nextbitt */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-blue-500" />
            Integração Nextbitt
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código da Localização <span className="text-gray-400 font-normal text-xs">(lo_id no Nextbitt)</span>
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

        {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{erro}</p>}

        <div className="flex gap-3 pb-8">
          <button type="submit" disabled={carregando}
            className="text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            style={{ backgroundColor: '#D41317' }}>
            {carregando ? 'A guardar...' : 'Guardar alterações'}
          </button>
          <Link href={`/dashboard/lojas/${id}`}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}

function Toggle({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-[#D41317]' : 'bg-gray-200'}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
    </button>
  )
}

function InfraRow({ label, checked, onToggle, children }: {
  label: React.ReactNode
  checked: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3 border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <Toggle checked={checked} onToggle={onToggle} />
      </div>
      {checked && <div className="pl-1">{children}</div>}
    </div>
  )
}
