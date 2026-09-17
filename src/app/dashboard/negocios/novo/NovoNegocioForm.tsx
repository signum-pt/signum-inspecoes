'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Loader2, ChevronDown } from 'lucide-react'
import { criarNegocioCompleto } from '../actions'

type Requerente = { id: string; nome: string; nif: string | null; email: string | null; telefone: string | null; morada: string | null; cod_postal: string | null; localidade: string | null }
type Loja = { id: string; nome: string; entidades: { nome: string }[] | null }
type Servico = { id: string; nome: string }
type Processo = { n_processo: number; designacao: string; concelho: string | null; requerentes: { nome: string } | null }
type Tecnico = { id: string; nome: string }

type LinhaServico = {
  id: number
  servico_id: string
  descricao: string
  quantidade: number
  valor_unit: string
  prazo: string
  tecnico_id: string
}

const INPUT = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 bg-white'
const LABEL = 'block text-xs font-medium text-gray-700 mb-1'
const SECTION = 'bg-white rounded-xl border border-gray-200 p-5 mb-4'
const SECTION_TITLE = 'text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100'

let nextId = 1

export default function NovoNegocioForm({ requerentes, lojas, servicos, processos, tecnicos }: {
  requerentes: Requerente[]
  lojas: Loja[]
  servicos: Servico[]
  processos: Processo[]
  tecnicos: Tecnico[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Tipo de negócio: novo processo ou processo existente
  const [tipoNegocio, setTipoNegocio] = useState<'novo' | 'existente'>('novo')
  const [nProcessoExistente, setNProcessoExistente] = useState('')

  // Requerente selecionado
  const [reqId, setReqId] = useState('')
  const reqInfo = requerentes.find(r => r.id === reqId)

  // Linhas de serviços
  const [linhas, setLinhas] = useState<LinhaServico[]>([
    { id: nextId++, servico_id: '', descricao: '', quantidade: 1, valor_unit: '', prazo: '', tecnico_id: '' }
  ])

  function addLinha() {
    setLinhas(prev => [...prev, { id: nextId++, servico_id: '', descricao: '', quantidade: 1, valor_unit: '', prazo: '', tecnico_id: '' }])
  }

  function removeLinha(id: number) {
    setLinhas(prev => prev.length > 1 ? prev.filter(l => l.id !== id) : prev)
  }

  function updateLinha(id: number, field: keyof LinhaServico, value: string | number) {
    setLinhas(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    fd.set('linhas', JSON.stringify(linhas))
    fd.set('tipo_negocio', tipoNegocio)
    if (tipoNegocio === 'existente') fd.set('n_processo_existente', nProcessoExistente)

    const res = await criarNegocioCompleto(fd)
    setLoading(false)
    if (!res.ok) { setError(res.error ?? 'Erro ao criar'); return }
    router.push('/dashboard/negocios')
    router.refresh()
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/negocios" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Novo negócio</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-0">

        {/* Tipo de negócio */}
        <div className={SECTION}>
          <p className={SECTION_TITLE}>Tipo de negócio</p>
          <div className="flex gap-3">
            {(['novo', 'existente'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTipoNegocio(t)}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  tipoNegocio === t
                    ? 'text-white border-transparent'
                    : 'text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
                style={tipoNegocio === t ? { backgroundColor: '#D41317' } : {}}
              >
                {t === 'novo' ? 'Novo processo' : 'Processo existente'}
              </button>
            ))}
          </div>

          {tipoNegocio === 'existente' && (
            <div className="mt-4">
              <label className={LABEL}>Selecionar processo</label>
              <select
                value={nProcessoExistente}
                onChange={e => setNProcessoExistente(e.target.value)}
                className={INPUT}
                required
              >
                <option value="">Selecionar…</option>
                {processos.map(p => (
                  <option key={p.n_processo} value={p.n_processo}>
                    #{p.n_processo} — {p.designacao}{p.requerentes ? ` (${p.requerentes.nome})` : ''}{p.concelho ? ` · ${p.concelho}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Dados do negócio */}
        <div className={SECTION}>
          <p className={SECTION_TITLE}>Dados do negócio</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={LABEL}>Designação <span className="text-red-500">*</span></label>
              <input name="designacao" required placeholder="Ex: KFC Fafe — Elétrico" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Concelho</label>
              <input name="concelho" placeholder="Ex: Fafe" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Valor proposta (€)</label>
              <input name="valor_proposta" type="number" min="0" step="0.01" placeholder="0.00" className={INPUT} />
            </div>
            <div className="md:col-span-2">
              <label className={LABEL}>Observações</label>
              <textarea name="observacoes" rows={3} placeholder="Notas da proposta, condições especiais…" className={INPUT + ' resize-none'} />
            </div>
          </div>
        </div>

        {/* Requerente */}
        <div className={SECTION}>
          <p className={SECTION_TITLE}>Requerente</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className={LABEL}>Requerente</label>
              <select name="requerente_id" value={reqId} onChange={e => setReqId(e.target.value)} className={INPUT}>
                <option value="">Selecionar…</option>
                {requerentes.map(r => (
                  <option key={r.id} value={r.id}>{r.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>NIF</label>
              <input readOnly value={reqInfo?.nif ?? ''} placeholder="—" className={INPUT + ' bg-gray-50 text-gray-500'} />
            </div>
            <div>
              <label className={LABEL}>Email</label>
              <input readOnly value={reqInfo?.email ?? ''} placeholder="—" className={INPUT + ' bg-gray-50 text-gray-500'} />
            </div>
            <div>
              <label className={LABEL}>Telefone</label>
              <input readOnly value={reqInfo?.telefone ?? ''} placeholder="—" className={INPUT + ' bg-gray-50 text-gray-500'} />
            </div>
            <div>
              <label className={LABEL}>Localidade</label>
              <input readOnly value={reqInfo?.localidade ?? ''} placeholder="—" className={INPUT + ' bg-gray-50 text-gray-500'} />
            </div>
            <div className="md:col-span-3">
              <label className={LABEL}>Morada</label>
              <input readOnly value={reqInfo?.morada ?? ''} placeholder="—" className={INPUT + ' bg-gray-50 text-gray-500'} />
            </div>
          </div>
        </div>

        {/* Loja */}
        <div className={SECTION}>
          <p className={SECTION_TITLE}>Loja associada</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Loja (opcional)</label>
              <select name="loja_id" className={INPUT}>
                <option value="">Nenhuma</option>
                {lojas.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.nome}{l.entidades?.[0] ? ` — ${l.entidades[0].nome}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Serviços / trabalhos */}
        <div className={SECTION}>
          <p className={SECTION_TITLE}>Trabalhos da proposta</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 border-b border-gray-100">
                  <th className="pb-2 pr-3 w-48">Especialidade</th>
                  <th className="pb-2 pr-3">Descrição</th>
                  <th className="pb-2 pr-3 w-16 text-center">Qtd.</th>
                  <th className="pb-2 pr-3 w-28 text-right">Preço (€)</th>
                  <th className="pb-2 pr-3 w-32">Prazo</th>
                  <th className="pb-2 pr-3 w-36">Técnico</th>
                  <th className="pb-2 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {linhas.map((l) => (
                  <tr key={l.id} className="group">
                    <td className="py-2 pr-3">
                      <select
                        value={l.servico_id}
                        onChange={e => updateLinha(l.id, 'servico_id', e.target.value)}
                        className={INPUT}
                      >
                        <option value="">Selecionar…</option>
                        {servicos.map(s => (
                          <option key={s.id} value={s.id}>{s.nome}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        value={l.descricao}
                        onChange={e => updateLinha(l.id, 'descricao', e.target.value)}
                        placeholder="Descrição…"
                        className={INPUT}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number" min="1" step="1"
                        value={l.quantidade}
                        onChange={e => updateLinha(l.id, 'quantidade', Number(e.target.value))}
                        className={INPUT + ' text-center'}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number" min="0" step="0.01"
                        value={l.valor_unit}
                        onChange={e => updateLinha(l.id, 'valor_unit', e.target.value)}
                        placeholder="0.00"
                        className={INPUT + ' text-right'}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="date"
                        value={l.prazo}
                        onChange={e => updateLinha(l.id, 'prazo', e.target.value)}
                        className={INPUT}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <select
                        value={l.tecnico_id}
                        onChange={e => updateLinha(l.id, 'tecnico_id', e.target.value)}
                        className={INPUT}
                      >
                        <option value="">Sem técnico</option>
                        {tecnicos.map(t => (
                          <option key={t.id} value={t.id}>{t.nome}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => removeLinha(l.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addLinha}
            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar linha
          </button>
        </div>

        {/* Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Botões */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/dashboard/negocios" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60 transition-opacity"
            style={{ backgroundColor: '#D41317' }}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Criar negócio
          </button>
        </div>

      </form>
    </div>
  )
}
