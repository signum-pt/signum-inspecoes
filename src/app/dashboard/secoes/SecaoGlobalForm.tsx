'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, X, GripVertical, Search, Trash2, Minus } from 'lucide-react'
import Link from 'next/link'
import type { Campo, TipoCampo } from '@/lib/types'
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const tipoLabel: Record<TipoCampo, string> = {
  texto: 'Texto', numero: 'Número', sim_nao: 'Sim/Não',
  escolha_multipla: 'Múltipla', data: 'Data', foto: 'Foto',
  observacao: 'Observação', separador: 'Separador',
}
const tipoCor: Record<TipoCampo, string> = {
  texto: 'bg-blue-50 text-blue-700', numero: 'bg-purple-50 text-purple-700',
  sim_nao: 'bg-green-50 text-green-700', escolha_multipla: 'bg-orange-50 text-orange-700',
  data: 'bg-pink-50 text-pink-700', foto: 'bg-yellow-50 text-yellow-700',
  observacao: 'bg-gray-100 text-gray-600', separador: 'bg-gray-800 text-white',
}

interface CampoSecao {
  uid: string
  campo: Campo
  obrigatorio: boolean
  maxCaracteres?: number
}

function SortableCampoRow({ c, onRemove, onToggleObrigatorio, onSetMax }: {
  c: CampoSecao
  onRemove: () => void
  onToggleObrigatorio: () => void
  onSetMax: (v: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: c.uid })
  const isSep = c.campo.tipo === 'separador'
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-lg px-4 py-3 space-y-2 ${isSep ? 'bg-gray-800' : 'bg-gray-50'} ${isDragging ? 'opacity-50 shadow-lg' : ''}`}>
      <div className="flex items-center gap-3">
        <GripVertical {...attributes} {...listeners}
          className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none" />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${isSep ? 'text-white uppercase tracking-widest text-xs' : 'text-gray-900'}`}>{c.campo.nome}</p>
          {!isSep && <p className="text-xs text-gray-400 font-mono">{c.campo.chave}{c.campo.unidade ? ` · ${c.campo.unidade}` : ''}</p>}
        </div>
        {!isSep && (
          <>
            <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${tipoCor[c.campo.tipo] ?? 'bg-gray-100'}`}>
              {tipoLabel[c.campo.tipo]}
            </span>
            <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none flex-shrink-0">
              <input type="checkbox" checked={c.obrigatorio} onChange={onToggleObrigatorio}
                className="rounded border-gray-300 accent-[#D41317]" />
              Obrigatório
            </label>
          </>
        )}
        <button type="button" onClick={onRemove} className={`transition-colors flex-shrink-0 ${isSep ? 'text-gray-500 hover:text-red-400' : 'text-gray-300 hover:text-red-500'}`}>
          <X className="w-4 h-4" />
        </button>
      </div>
      {!isSep && (c.campo.tipo === 'texto' || c.campo.tipo === 'observacao') && (
        <div className="flex items-center gap-2 pl-6">
          <span className="text-xs text-gray-400">Limite de caracteres:</span>
          <input type="number" min="1" max="9999" value={c.maxCaracteres ?? ''} onChange={e => onSetMax(e.target.value)}
            placeholder="Sem limite"
            className="w-24 px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#D41317] bg-white" />
          {c.maxCaracteres && <span className="text-xs text-gray-400">caracteres máx.</span>}
        </div>
      )}
    </div>
  )
}

interface Props {
  campos: Campo[]
  secao?: any
}

export default function SecaoGlobalForm({ campos, secao }: Props) {
  const router = useRouter()
  const isEdit = !!secao

  const [nome, setNome] = useState(secao?.nome ?? '')
  const [descricao, setDescricao] = useState(secao?.descricao ?? '')
  const [camposSecao, setCamposSecao] = useState<CampoSecao[]>(() => {
    if (!secao) return []
    return [...(secao.secoes_globais_campos ?? [])]
      .sort((a: any, b: any) => a.ordem - b.ordem)
      .map((sgc: any) => ({
        uid: sgc.id,
        campo: sgc.campos,
        obrigatorio: sgc.obrigatorio,
        maxCaracteres: sgc.max_caracteres ?? undefined,
      }))
  })
  const [mostrarModal, setMostrarModal] = useState(false)
  const [pesquisa, setPesquisa] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [sepAberto, setSepAberto] = useState(false)
  const [sepNome, setSepNome] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const camposJaAdicionados = new Set(camposSecao.map(c => c.campo.id))
  const camposFiltrados = campos.filter(c =>
    !camposJaAdicionados.has(c.id) &&
    (c.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
      c.chave.toLowerCase().includes(pesquisa.toLowerCase()))
  )

  function adicionarCampo(campo: Campo) {
    setCamposSecao(prev => [...prev, { uid: crypto.randomUUID(), campo, obrigatorio: false, maxCaracteres: undefined }])
  }

  function adicionarSeparador(nome: string) {
    const campo: Campo = {
      id: `sep_${crypto.randomUUID()}`,
      nome: nome || '—', chave: '', tipo: 'separador', unidade: '',
      descricao: '', opcoes: [], sistema: false, ativo: true,
      created_at: new Date().toISOString(),
    }
    setCamposSecao(prev => [...prev, { uid: crypto.randomUUID(), campo, obrigatorio: false }])
    setSepNome(''); setSepAberto(false)
  }


  function removerCampo(uid: string) {
    setCamposSecao(prev => prev.filter(c => c.uid !== uid))
  }

  function toggleObrigatorio(uid: string) {
    setCamposSecao(prev => prev.map(c => c.uid === uid ? { ...c, obrigatorio: !c.obrigatorio } : c))
  }

  function setMaxCaracteres(uid: string, valor: string) {
    const num = valor === '' ? undefined : Math.max(1, parseInt(valor) || 1)
    setCamposSecao(prev => prev.map(c => c.uid === uid ? { ...c, maxCaracteres: num } : c))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setCamposSecao(prev => {
      const oldIdx = prev.findIndex(c => c.uid === active.id)
      const newIdx = prev.findIndex(c => c.uid === over.id)
      return arrayMove(prev, oldIdx, newIdx)
    })
  }

  async function handleSave() {
    if (!nome.trim()) { setErro('O nome é obrigatório.'); return }
    setErro('')
    setCarregando(true)
    const supabase = createClient()

    const camposResolvidos = await Promise.all(camposSecao.map(async (c) => {
      if (c.campo.id.startsWith('sep_')) {
        const { data: novo } = await supabase.from('campos').insert({
          nome: c.campo.nome,
          chave: `sep_${crypto.randomUUID().split('-')[0]}`,
          tipo: 'separador', unidade: '', descricao: '', opcoes: [],
        }).select().single()
        return { ...c, campo: { ...c.campo, id: novo?.id ?? '' } }
      }
      return c
    }))

    if (isEdit) {
      const { error } = await supabase.from('secoes_globais').update({ nome, descricao }).eq('id', secao.id)
      if (error) { setErro('Erro ao guardar.'); setCarregando(false); return }

      await supabase.from('secoes_globais_campos').delete().eq('secao_id', secao.id)
      if (camposResolvidos.length > 0) {
        await supabase.from('secoes_globais_campos').insert(
          camposResolvidos.filter(c => c.campo.id).map((c, i) => ({
            secao_id: secao.id, campo_id: c.campo.id, ordem: i, obrigatorio: c.obrigatorio, max_caracteres: c.maxCaracteres ?? null,
          }))
        )
      }
    } else {
      const { data: nova, error } = await supabase
        .from('secoes_globais').insert({ nome, descricao, ordem: 999 }).select().single()
      if (error || !nova) { setErro('Erro ao criar secção.'); setCarregando(false); return }

      if (camposResolvidos.length > 0) {
        await supabase.from('secoes_globais_campos').insert(
          camposResolvidos.filter(c => c.campo.id).map((c, i) => ({
            secao_id: nova.id, campo_id: c.campo.id, ordem: i, obrigatorio: c.obrigatorio, max_caracteres: c.maxCaracteres ?? null,
          }))
        )
      }
    }

    router.push('/dashboard/secoes')
    router.refresh()
  }

  async function handleDelete() {
    if (!isEdit) return
    if (!confirm('Eliminar esta secção global? Os templates existentes não são afetados.')) return
    await createClient().from('secoes_globais').delete().eq('id', secao.id)
    router.push('/dashboard/secoes')
    router.refresh()
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/secoes" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Editar secção' : 'Nova secção global'}</h1>
            <p className="text-gray-500 text-sm mt-0.5">Secção predefinida importável em templates</p>
          </div>
        </div>
        {isEdit && (
          <button onClick={handleDelete} type="button"
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
            Eliminar
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Dados */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input value={nome} onChange={e => setNome(e.target.value)}
              placeholder="ex: Posto de Transformação"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input value={descricao} onChange={e => setDescricao(e.target.value)}
              placeholder="ex: Campos de verificação do posto de transformação"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317]" />
          </div>
        </div>

        {/* Campos */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Campos da secção</h2>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={camposSecao.map(c => c.uid)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {camposSecao.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-6">Nenhum campo adicionado ainda.</p>
                )}
                {camposSecao.map(c => (
                  <SortableCampoRow key={c.uid} c={c}
                    onRemove={() => removerCampo(c.uid)}
                    onToggleObrigatorio={() => toggleObrigatorio(c.uid)}
                    onSetMax={v => setMaxCaracteres(c.uid, v)} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {sepAberto && (
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-4 py-2.5">
              <Minus className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <input autoFocus value={sepNome} onChange={e => setSepNome(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); adicionarSeparador(sepNome.trim()) } if (e.key === 'Escape') { setSepAberto(false); setSepNome('') } }}
                placeholder="Nome opcional..."
                className="flex-1 bg-transparent text-white text-xs placeholder-gray-500 outline-none uppercase tracking-widest" />
              <button type="button" onClick={() => adicionarSeparador(sepNome.trim())} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded">✓</button>
              <button type="button" onClick={() => { setSepAberto(false); setSepNome('') }} className="text-gray-500 hover:text-gray-300"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => { setSepAberto(true); setSepNome('') }}
              className="flex items-center justify-center gap-1.5 text-sm py-2.5 rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-gray-500 hover:text-gray-600 transition-colors">
              <Minus className="w-4 h-4" /> Separador
            </button>
            <button type="button" onClick={() => { setPesquisa(''); setMostrarModal(true) }}
              className="flex items-center justify-center gap-1.5 text-sm py-2.5 rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-[#D41317] hover:text-[#D41317] transition-colors">
              <Plus className="w-4 h-4" /> Campo
            </button>
          </div>
        </div>

        {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{erro}</p>}

        <div className="flex gap-3 pb-8">
          <button onClick={handleSave} disabled={carregando} type="button"
            className="text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            style={{ backgroundColor: '#D41317' }}>
            {carregando ? 'A guardar...' : 'Guardar secção'}
          </button>
          <Link href="/dashboard/secoes"
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            Cancelar
          </Link>
        </div>
      </div>

      {/* Modal escolher campo */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Adicionar campo global</h3>
              <button onClick={() => setMostrarModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input autoFocus value={pesquisa} onChange={e => setPesquisa(e.target.value)}
                  placeholder="Pesquisar campos..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317]" />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-2">
              {camposFiltrados.length === 0
                ? <p className="text-center text-sm text-gray-400 py-8">Nenhum campo disponível.</p>
                : camposFiltrados.map(c => (
                  <button key={c.id} type="button" onClick={() => { adicionarCampo(c); setMostrarModal(false) }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{c.nome}</p>
                      <p className="text-xs text-gray-400 font-mono">{c.chave}{c.unidade ? ` · ${c.unidade}` : ''}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${tipoCor[c.tipo] ?? 'bg-gray-100'}`}>
                      {tipoLabel[c.tipo]}
                    </span>
                  </button>
                ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
