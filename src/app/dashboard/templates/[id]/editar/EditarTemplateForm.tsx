'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, Trash2, GripVertical, ChevronDown, ChevronUp, X, Layers, Minus } from 'lucide-react'
import Link from 'next/link'
import type { Campo, TipoCampo } from '@/lib/types'
import ModalAdicionarCampo from '@/components/ModalAdicionarCampo'
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const tipoCor: Record<TipoCampo, string> = {
  texto: 'bg-blue-50 text-blue-700', numero: 'bg-purple-50 text-purple-700',
  sim_nao: 'bg-green-50 text-green-700', escolha_multipla: 'bg-orange-50 text-orange-700',
  data: 'bg-pink-50 text-pink-700', foto: 'bg-yellow-50 text-yellow-700',
  observacao: 'bg-gray-100 text-gray-600', separador: 'bg-gray-800 text-white',
}
const tipoLabel: Record<TipoCampo, string> = {
  texto: 'Texto', numero: 'Número', sim_nao: 'Sim/Não',
  escolha_multipla: 'Múltipla', data: 'Data', foto: 'Foto', observacao: 'Observação',
  separador: 'Separador',
}

interface SecaoLocal {
  id: string
  dbId?: string
  titulo: string
  campos: CampoLocal[]
  aberta: boolean
}
interface CampoLocal {
  uid: string
  campo: Campo
  obrigatorio: boolean
  negrito: boolean
  placeholder: string
  maxCaracteres?: number
}

// ── Sortable campo ────────────────────────────────────────────────────────────
function SortableCampoItem({ c, onToggleObrigatorio, onToggleNegrito, onRemove, onSetMax }: {
  c: CampoLocal
  onToggleObrigatorio: () => void
  onToggleNegrito: () => void
  onRemove: () => void
  onSetMax: (v: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: c.uid })
  const isSep = c.campo.tipo === 'separador'
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-lg px-4 py-3 space-y-2 ${isSep ? 'bg-gray-800' : 'bg-gray-50'} ${isDragging ? 'opacity-50 shadow-lg z-50' : ''}`}>
      <div className="flex items-center gap-3">
        <GripVertical {...attributes} {...listeners}
          className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${isSep ? 'text-white uppercase tracking-widest text-xs' : 'text-gray-900'}`}>{isSep ? (c.placeholder || '—') : c.campo.nome}</span>
            {!isSep && c.campo.unidade && <span className="text-xs text-gray-400">({c.campo.unidade})</span>}
            {!isSep && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${tipoCor[c.campo.tipo] ?? 'bg-gray-100'}`}>
                {tipoLabel[c.campo.tipo] ?? c.campo.tipo}
              </span>
            )}
          </div>
        </div>
        {!isSep && (
          <>
            <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none flex-shrink-0">
              <input type="checkbox" checked={c.negrito} onChange={onToggleNegrito}
                className="rounded accent-[#D41317]" />
              Negrito
            </label>
            <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none flex-shrink-0">
              <input type="checkbox" checked={c.obrigatorio} onChange={onToggleObrigatorio}
                className="rounded accent-[#D41317]" />
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

// ── Sortable secção ───────────────────────────────────────────────────────────
function SortableSecaoItem({
  secao, onUpdateTitulo, onToggle, onRemove, onAddCampo, onAddSeparador,
  onCampoDragEnd, onToggleObrigatorio, onToggleNegrito, onRemoveCampo, onSetMax,
}: {
  secao: SecaoLocal
  onUpdateTitulo: (v: string) => void
  onToggle: () => void
  onRemove: () => void
  onAddCampo: () => void
  onAddSeparador: (nome: string) => void
  onCampoDragEnd: (e: DragEndEvent) => void
  onToggleObrigatorio: (uid: string) => void
  onToggleNegrito: (uid: string) => void
  onRemoveCampo: (uid: string) => void
  onSetMax: (uid: string, v: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: secao.id })
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const [sepAberto, setSepAberto] = useState(false)
  const [sepNome, setSepNome] = useState('')

  function confirmarSep() {
    onAddSeparador(sepNome.trim()); setSepNome(''); setSepAberto(false)
  }

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${isDragging ? 'shadow-xl opacity-90 z-50' : ''}`}>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <GripVertical {...attributes} {...listeners}
          className="w-4 h-4 text-gray-400 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none" />
        <input value={secao.titulo} onChange={e => onUpdateTitulo(e.target.value)}
          className="flex-1 text-sm font-semibold text-gray-900 bg-transparent border-none outline-none focus:bg-gray-50 rounded px-1 py-0.5" />
        <span className="text-xs text-gray-400">{secao.campos.length} campos</span>
        <button type="button" onClick={onToggle} className="text-gray-400 hover:text-gray-600">
          {secao.aberta ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <button type="button" onClick={onRemove} className="text-gray-300 hover:text-red-500 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      {secao.aberta && (
        <div className="p-4 space-y-2">
          {secao.campos.length === 0 && !sepAberto && (
            <p className="text-sm text-gray-400 text-center py-4">Nenhum campo.</p>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onCampoDragEnd}>
            <SortableContext items={secao.campos.map(c => c.uid)} strategy={verticalListSortingStrategy}>
              {secao.campos.map(c => (
                <SortableCampoItem key={c.uid} c={c}
                  onToggleObrigatorio={() => onToggleObrigatorio(c.uid)}
                  onToggleNegrito={() => onToggleNegrito(c.uid)}
                  onRemove={() => onRemoveCampo(c.uid)}
                  onSetMax={v => onSetMax(c.uid, v)} />
              ))}
            </SortableContext>
          </DndContext>

          {sepAberto && (
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-4 py-2.5">
              <Minus className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <input autoFocus value={sepNome} onChange={e => setSepNome(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirmarSep() } if (e.key === 'Escape') { setSepAberto(false); setSepNome('') } }}
                placeholder="Nome do separador..."
                className="flex-1 bg-transparent text-white text-xs placeholder-gray-500 outline-none uppercase tracking-widest" />
              <button type="button" onClick={confirmarSep} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded">✓</button>
              <button type="button" onClick={() => { setSepAberto(false); setSepNome('') }} className="text-gray-500 hover:text-gray-300"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button type="button" onClick={() => { setSepAberto(true); setSepNome('') }}
              className="flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-gray-500 hover:text-gray-600 transition-colors">
              <Minus className="w-3.5 h-3.5" /> Separador
            </button>
            <button type="button" onClick={onAddCampo}
              className="flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-[#D41317] hover:text-[#D41317] transition-colors">
              <Plus className="w-3.5 h-3.5" /> Campo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Modal importar secção global ──────────────────────────────────────────────
function ModalImportarSecao({ onImportar, onFechar }: {
  onImportar: (secao: any) => void
  onFechar: () => void
}) {
  const [secoes, setSecoes] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    createClient()
      .from('secoes_globais')
      .select('*, secoes_globais_campos(*, campos(*))')
      .order('ordem')
      .then(({ data }) => { setSecoes(data ?? []); setCarregando(false) })
  }, [])

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Importar secção predefinida</h3>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {carregando && <p className="text-sm text-gray-400 text-center py-8">A carregar...</p>}
          {!carregando && secoes.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">Ainda não há secções globais criadas.</p>
          )}
          {secoes.map(s => (
            <button key={s.id} type="button" onClick={() => onImportar(s)}
              className="w-full flex items-start gap-3 px-4 py-3 rounded-lg text-left hover:bg-gray-50 transition-colors">
              <Layers className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{s.nome}</p>
                {s.descricao && <p className="text-xs text-gray-400 mt-0.5">{s.descricao}</p>}
                <p className="text-xs text-gray-400 mt-1">{s.secoes_globais_campos?.length ?? 0} campos</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Formulário principal ──────────────────────────────────────────────────────
export default function EditarTemplateForm({ template, secoesIniciais, todosCampos }: {
  template: any
  secoesIniciais: any[]
  todosCampos: Campo[]
}) {
  const router = useRouter()

  const [nome, setNome] = useState(template.nome)
  const [descricao, setDescricao] = useState(template.descricao ?? '')
  const [referencia, setReferencia] = useState(template.referencia ?? '')
  const [secoes, setSecoes] = useState<SecaoLocal[]>(
    secoesIniciais.map(s => ({
      id: crypto.randomUUID(),
      dbId: s.id,
      titulo: s.titulo,
      aberta: true,
      campos: [...(s.template_campos ?? [])]
        .sort((a: any, b: any) => a.ordem - b.ordem)
        .map((tc: any) => ({
          uid: crypto.randomUUID(),
          campo: tc.campos,
          obrigatorio: tc.obrigatorio,
          negrito: tc.negrito ?? false,
          placeholder: tc.placeholder ?? '',
          maxCaracteres: tc.max_caracteres ?? undefined,
        })),
    }))
  )
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [modalSecaoId, setModalSecaoId] = useState<string | null>(null)
  const [mostrarImportar, setMostrarImportar] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function addSecao() {
    setSecoes(s => [...s, { id: crypto.randomUUID(), titulo: 'Nova secção', campos: [], aberta: true }])
  }

  function importarSecao(secaoGlobal: any) {
    const campos: CampoLocal[] = [...(secaoGlobal.secoes_globais_campos ?? [])]
      .sort((a: any, b: any) => a.ordem - b.ordem)
      .map((sgc: any) => ({
        uid: crypto.randomUUID(),
        campo: sgc.campos,
        obrigatorio: sgc.obrigatorio,
        negrito: false,
        placeholder: '',
        maxCaracteres: sgc.max_caracteres ?? undefined,
      }))
    setSecoes(s => [...s, { id: crypto.randomUUID(), titulo: secaoGlobal.nome, campos, aberta: true }])
    setMostrarImportar(false)
  }

  function updateTitulo(id: string, titulo: string) {
    setSecoes(s => s.map(x => x.id === id ? { ...x, titulo } : x))
  }
  function toggleSecao(id: string) {
    setSecoes(s => s.map(x => x.id === id ? { ...x, aberta: !x.aberta } : x))
  }
  function removeSecao(id: string) { setSecoes(s => s.filter(x => x.id !== id)) }

  function adicionarCampo(secaoId: string, campo: Campo) {
    setSecoes(s => s.map(x => {
      if (x.id !== secaoId) return x
      if (x.campos.find(c => c.campo.id === campo.id)) return x
      return { ...x, campos: [...x.campos, { uid: crypto.randomUUID(), campo, obrigatorio: false, negrito: false, placeholder: '' }] }
    }))
    setModalSecaoId(null)
  }

  async function adicionarSeparador(secaoId: string, nome: string) {
    const { data: sepCampo } = await createClient().from('campos').select('*').eq('chave', 'separador').single()
    if (!sepCampo) return
    const campo: Campo = { ...sepCampo }
    setSecoes(s => s.map(x => x.id !== secaoId ? x : {
      ...x, campos: [...x.campos, { uid: crypto.randomUUID(), campo, obrigatorio: false, negrito: false, placeholder: nome || '' }]
    }))
  }

  function removeCampo(secaoId: string, uid: string) {
    setSecoes(s => s.map(x => x.id === secaoId ? { ...x, campos: x.campos.filter(c => c.uid !== uid) } : x))
  }
  function toggleObrigatorio(secaoId: string, uid: string) {
    setSecoes(s => s.map(x => x.id === secaoId ? {
      ...x, campos: x.campos.map(c => c.uid === uid ? { ...c, obrigatorio: !c.obrigatorio } : c)
    } : x))
  }
  function toggleNegrito(secaoId: string, uid: string) {
    setSecoes(s => s.map(x => x.id === secaoId ? {
      ...x, campos: x.campos.map(c => c.uid === uid ? { ...c, negrito: !c.negrito } : c)
    } : x))
  }
  function setMaxCaracteres(secaoId: string, uid: string, valor: string) {
    const num = valor === '' ? undefined : Math.max(1, parseInt(valor) || 1)
    setSecoes(s => s.map(x => x.id === secaoId ? {
      ...x, campos: x.campos.map(c => c.uid === uid ? { ...c, maxCaracteres: num } : c)
    } : x))
  }
  function handleSecaoDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setSecoes(s => arrayMove(s, s.findIndex(x => x.id === active.id), s.findIndex(x => x.id === over.id)))
  }
  function handleCampoDragEnd(secaoId: string, event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setSecoes(s => s.map(x => {
      if (x.id !== secaoId) return x
      return { ...x, campos: arrayMove(x.campos, x.campos.findIndex(c => c.uid === active.id), x.campos.findIndex(c => c.uid === over.id)) }
    }))
  }

  async function handleSave() {
    if (!nome.trim()) { setErro('O nome é obrigatório.'); return }
    setErro('')
    setCarregando(true)
    const supabase = createClient()

    await supabase.from('templates').update({ nome, descricao, referencia, versao: template.versao + 1 }).eq('id', template.id)
    await supabase.from('template_secoes').delete().eq('template_id', template.id)

    for (let si = 0; si < secoes.length; si++) {
      const s = secoes[si]
      const { data: secao } = await supabase
        .from('template_secoes').insert({ template_id: template.id, titulo: s.titulo, ordem: si }).select().single()
      if (!secao) continue
      if (s.campos.length > 0) {
        const rows = s.campos.map((c, ci) => ({
          secao_id: secao.id, campo_id: c.campo.id, obrigatorio: c.obrigatorio,
          negrito: c.negrito, ordem: ci, placeholder: c.placeholder, max_caracteres: c.maxCaracteres ?? null,
        }))
        await supabase.from('template_campos').insert(rows.filter(r => r.campo_id))
      }
    }

    router.push(`/dashboard/templates/${template.id}`)
    router.refresh()
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/dashboard/templates/${template.id}`} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar template</h1>
          <p className="text-gray-500 text-sm mt-0.5">v{template.versao} → v{template.versao + 1} ao guardar</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input value={nome} onChange={e => setNome(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input value={descricao} onChange={e => setDescricao(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Referência do documento
              <span className="text-gray-400 font-normal ml-2 text-xs">— aparece no rodapé do PDF</span>
            </label>
            <input value={referencia} onChange={e => setReferencia(e.target.value)}
              placeholder="ex: MI03-1.b"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317] font-mono" />
          </div>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSecaoDragEnd}>
          <SortableContext items={secoes.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {secoes.map(secao => (
                <SortableSecaoItem key={secao.id} secao={secao}
                  onUpdateTitulo={v => updateTitulo(secao.id, v)}
                  onToggle={() => toggleSecao(secao.id)}
                  onRemove={() => removeSecao(secao.id)}
                  onAddCampo={() => setModalSecaoId(secao.id)}
                  onAddSeparador={nome => adicionarSeparador(secao.id, nome)}
                  onCampoDragEnd={e => handleCampoDragEnd(secao.id, e)}
                  onToggleObrigatorio={uid => toggleObrigatorio(secao.id, uid)}
                  onToggleNegrito={uid => toggleNegrito(secao.id, uid)}
                  onRemoveCampo={uid => removeCampo(secao.id, uid)}
                  onSetMax={(uid, v) => setMaxCaracteres(secao.id, uid, v)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setMostrarImportar(true)}
            className="flex items-center justify-center gap-2 text-sm py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
            <Layers className="w-4 h-4" /> Importar secção
          </button>
          <button type="button" onClick={addSecao}
            className="flex items-center justify-center gap-2 text-sm py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-[#D41317] hover:text-[#D41317] transition-colors">
            <Plus className="w-4 h-4" /> Secção em branco
          </button>
        </div>

        {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{erro}</p>}

        <div className="flex gap-3 pb-8">
          <button onClick={handleSave} disabled={carregando}
            className="text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            style={{ backgroundColor: '#D41317' }}>
            {carregando ? 'A guardar...' : 'Guardar alterações'}
          </button>
          <Link href={`/dashboard/templates/${template.id}`}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            Cancelar
          </Link>
        </div>
      </div>

      {modalSecaoId && (
        <ModalAdicionarCampo
          camposGlobais={todosCampos}
          camposJaAdicionados={secoes.find(s => s.id === modalSecaoId)?.campos.map(c => c.campo.id) ?? []}
          onAdicionar={campo => adicionarCampo(modalSecaoId, campo)}
          onFechar={() => setModalSecaoId(null)}
        />
      )}

      {mostrarImportar && (
        <ModalImportarSecao onImportar={importarSecao} onFechar={() => setMostrarImportar(false)} />
      )}
    </div>
  )
}
