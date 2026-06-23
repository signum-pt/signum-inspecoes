'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, X, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import type { TipoCampo } from '@/lib/types'

const TIPOS: { valor: TipoCampo; label: string; desc: string }[] = [
  { valor: 'sim_nao',          label: 'Sim / Não',          desc: 'Conforme / Não conforme' },
  { valor: 'numero',           label: 'Número',             desc: 'Valor numérico (ex: 4.2 Ω)' },
  { valor: 'texto',            label: 'Texto',              desc: 'Resposta em texto livre' },
  { valor: 'escolha_multipla', label: 'Escolha múltipla',   desc: 'Uma opção de uma lista' },
  { valor: 'data',             label: 'Data',               desc: 'Campo de data' },
  { valor: 'foto',             label: 'Foto',               desc: 'Upload de fotografia' },
  { valor: 'observacao',       label: 'Observação',         desc: 'Texto longo / notas' },
]

export default function EditarCampoForm({ campo, temRespostas }: { campo: any; temRespostas: boolean }) {
  const isSistema = campo.sistema === true
  const router = useRouter()
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [tipo, setTipo] = useState<TipoCampo>(campo.tipo)
  const [nome, setNome] = useState(campo.nome)
  const [unidade, setUnidade] = useState(campo.unidade ?? '')
  const [descricao, setDescricao] = useState(campo.descricao ?? '')
  const [opcoes, setOpcoes] = useState<string[]>(campo.opcoes ?? [])
  const [novaOpcao, setNovaOpcao] = useState('')

  function adicionarOpcao() {
    if (novaOpcao.trim()) { setOpcoes([...opcoes, novaOpcao.trim()]); setNovaOpcao('') }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!nome.trim()) { setErro('O nome é obrigatório.'); return }
    if (tipo === 'escolha_multipla' && opcoes.length === 0) { setErro('Adicione pelo menos uma opção.'); return }
    setCarregando(true)

    const supabase = createClient()
    const { error } = await supabase.from('campos').update({
      nome: nome.trim(),
      tipo,
      unidade: tipo === 'numero' ? unidade : '',
      descricao: descricao.trim(),
      opcoes: tipo === 'escolha_multipla' ? opcoes : [],
    }).eq('id', campo.id)

    if (error) { setErro('Erro ao guardar: ' + error.message); setCarregando(false); return }
    router.push('/dashboard/campos')
    router.refresh()
  }

  async function handleApagar() {
    if (temRespostas || isSistema) return
    if (!confirm(`Apagar o campo "${campo.nome}"? Esta acção não pode ser desfeita.`)) return
    const supabase = createClient()
    await supabase.from('campos').delete().eq('id', campo.id)
    router.push('/dashboard/campos')
    router.refresh()
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/campos" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar campo</h1>
          <p className="text-gray-500 text-sm mt-0.5">Campo global da biblioteca</p>
        </div>
      </div>

      {isSistema && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6 text-sm text-blue-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Campo de sistema — pré-preenchimento automático da loja.</p>
            <p className="text-blue-700 text-xs mt-0.5">A chave e o tipo não podem ser alterados nem este campo pode ser eliminado.</p>
          </div>
        </div>
      )}
      {!isSistema && temRespostas && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Este campo já tem respostas registadas em visitas.</p>
            <p className="text-amber-700 text-xs mt-0.5">A chave e o tipo não podem ser alterados. Só o nome, unidade e descrição são editáveis.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <label className="block text-sm font-semibold text-gray-900 mb-3">Tipo de campo</label>
          <div className="grid grid-cols-2 gap-2">
            {TIPOS.map(t => (
              <button key={t.valor} type="button"
                onClick={() => { if (!temRespostas && !isSistema) setTipo(t.valor) }}
                disabled={(temRespostas || isSistema) && t.valor !== tipo}
                className={`flex flex-col items-start px-4 py-3 rounded-lg border text-left transition-all ${
                  tipo === t.valor ? 'border-[#D41317] bg-red-50' : 'border-gray-200 hover:border-gray-300'
                } ${(temRespostas || isSistema) && t.valor !== tipo ? 'opacity-40 cursor-not-allowed' : ''}`}>
                <span className="text-sm font-medium text-gray-900">{t.label}</span>
                <span className="text-xs text-gray-400 mt-0.5">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dados */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do campo *</label>
            <input type="text" required value={nome} onChange={e => setNome(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317]" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chave única
              <span className="text-xs text-gray-400 font-normal ml-2">— não editável</span>
            </label>
            <input type="text" value={campo.chave} disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono bg-gray-50 text-gray-400 cursor-not-allowed" />
          </div>

          {tipo === 'numero' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
              <input type="text" value={unidade} onChange={e => setUnidade(e.target.value)}
                placeholder="ex: Ω, V, A, kW, %, m"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317]" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição / Ajuda ao técnico</label>
            <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)}
              placeholder="ex: Medir entre o terminal de terra e o eléctrodo"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317]" />
          </div>
        </div>

        {/* Opções */}
        {tipo === 'escolha_multipla' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-semibold text-gray-900 mb-3">Opções de resposta</label>
            <div className="space-y-2 mb-3">
              {opcoes.map((op, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">{op}</span>
                  <button type="button" onClick={() => setOpcoes(opcoes.filter((_, j) => j !== i))}
                    className="text-gray-400 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={novaOpcao} onChange={e => setNovaOpcao(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), adicionarOpcao())}
                placeholder="Nova opção..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317]" />
              <button type="button" onClick={adicionarOpcao}
                className="px-3 py-2 rounded-lg text-white" style={{ backgroundColor: '#D41317' }}>
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{erro}</p>}

        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <button type="submit" disabled={carregando}
              className="text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              style={{ backgroundColor: '#D41317' }}>
              {carregando ? 'A guardar...' : 'Guardar alterações'}
            </button>
            <Link href="/dashboard/campos"
              className="px-5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              Cancelar
            </Link>
          </div>
          {!temRespostas && !isSistema && (
            <button type="button" onClick={handleApagar}
              className="text-sm text-red-500 hover:text-red-700 hover:underline transition-colors">
              Apagar campo
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
