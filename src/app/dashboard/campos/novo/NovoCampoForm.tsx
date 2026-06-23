'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, X } from 'lucide-react'
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

function gerarChave(nome: string) {
  return nome
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
}

export default function NovoCampoForm() {
  const router = useRouter()
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [tipo, setTipo] = useState<TipoCampo>('sim_nao')
  const [nome, setNome] = useState('')
  const [chave, setChave] = useState('')
  const [chaveEditada, setChaveEditada] = useState(false)
  const [opcoes, setOpcoes] = useState<string[]>(['Conforme', 'Não conforme', 'N/A'])
  const [novaOpcao, setNovaOpcao] = useState('')

  function handleNome(v: string) {
    setNome(v)
    if (!chaveEditada) setChave(gerarChave(v))
  }

  function adicionarOpcao() {
    if (novaOpcao.trim()) {
      setOpcoes([...opcoes, novaOpcao.trim()])
      setNovaOpcao('')
    }
  }

  function removerOpcao(i: number) {
    setOpcoes(opcoes.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro('')
    if (!chave) { setErro('A chave é obrigatória.'); return }
    if (tipo === 'escolha_multipla' && opcoes.length === 0) { setErro('Adicione pelo menos uma opção.'); return }
    setCarregando(true)

    const form = e.currentTarget
    const dados = {
      nome,
      chave,
      tipo,
      unidade: (form.elements.namedItem('unidade') as HTMLInputElement).value,
      descricao: (form.elements.namedItem('descricao') as HTMLInputElement).value,
      opcoes: tipo === 'escolha_multipla' ? opcoes : [],
    }

    const supabase = createClient()
    const { error } = await supabase.from('campos').insert(dados)

    if (error) {
      setErro(error.message.includes('unique') ? 'Já existe um campo com esta chave.' : 'Erro ao guardar.')
      setCarregando(false)
      return
    }

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
          <h1 className="text-2xl font-bold text-gray-900">Novo campo global</h1>
          <p className="text-gray-500 text-sm mt-0.5">Campo reutilizável em qualquer template e pesquisável</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <label className="block text-sm font-semibold text-gray-900 mb-3">Tipo de campo</label>
          <div className="grid grid-cols-2 gap-2">
            {TIPOS.map((t) => (
              <button
                key={t.valor}
                type="button"
                onClick={() => setTipo(t.valor)}
                className={`flex flex-col items-start px-4 py-3 rounded-lg border text-left transition-all ${
                  tipo === t.valor
                    ? 'border-[#D41317] bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-sm font-medium text-gray-900">{t.label}</span>
                <span className="text-xs text-gray-400 mt-0.5">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dados base */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do campo *</label>
            <input
              type="text" required value={nome} onChange={(e) => handleNome(e.target.value)}
              placeholder="ex: Resistência de terra"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chave única *
              <span className="text-xs text-gray-400 font-normal ml-2">— usada para pesquisas e dashboards</span>
            </label>
            <input
              type="text" required value={chave}
              onChange={(e) => { setChave(e.target.value); setChaveEditada(true) }}
              placeholder="ex: resistencia_terra"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#D41317] focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">Apenas letras minúsculas, números e underscores. Não pode mudar depois de usada em visitas.</p>
          </div>

          {tipo === 'numero' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
              <input
                type="text" name="unidade"
                placeholder="ex: Ω, V, A, kW, %, m"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317] focus:border-transparent"
              />
            </div>
          )}
          {tipo !== 'numero' && <input type="hidden" name="unidade" value="" />}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição / Ajuda ao técnico</label>
            <input
              type="text" name="descricao"
              placeholder="ex: Medir entre o terminal de terra e o eléctrodo"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317] focus:border-transparent"
            />
          </div>
        </div>

        {/* Opções para escolha múltipla */}
        {tipo === 'escolha_multipla' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-semibold text-gray-900 mb-3">Opções de resposta</label>
            <div className="space-y-2 mb-3">
              {opcoes.map((op, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">{op}</span>
                  <button type="button" onClick={() => removerOpcao(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text" value={novaOpcao} onChange={(e) => setNovaOpcao(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarOpcao())}
                placeholder="Nova opção..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317] focus:border-transparent"
              />
              <button
                type="button" onClick={adicionarOpcao}
                className="px-3 py-2 rounded-lg text-white text-sm transition-colors"
                style={{ backgroundColor: '#D41317' }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{erro}</p>}

        <div className="flex gap-3">
          <button
            type="submit" disabled={carregando}
            className="text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            style={{ backgroundColor: '#D41317' }}
          >
            {carregando ? 'A guardar...' : 'Guardar campo'}
          </button>
          <Link href="/dashboard/campos" className="px-5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
