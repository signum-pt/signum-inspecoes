'use client'

import { useState, useCallback, useEffect } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, useDroppable, useDraggable } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Plus, X, AlertTriangle, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const estadoCor: Record<string, string> = {
  agendada: 'bg-blue-50 text-blue-700 border-blue-200',
  rascunho: 'bg-gray-100 text-gray-600 border-gray-200',
  em_curso: 'bg-orange-50 text-orange-700 border-orange-200',
  concluida: 'bg-green-50 text-green-700 border-green-200',
  assinada: 'bg-indigo-50 text-indigo-700 border-indigo-200',
}

const estadoPonto: Record<string, string> = {
  agendada: 'bg-blue-400',
  rascunho: 'bg-gray-400',
  em_curso: 'bg-orange-400',
  concluida: 'bg-green-500',
  assinada: 'bg-indigo-500',
}

const ARRASTAVEL = new Set(['agendada', 'rascunho', 'em_curso'])

interface Visita {
  id: string
  data_visita: string
  estado: string
  lojas: { nome: string } | null
  profiles: { nome: string } | null
}

interface Props {
  ano: number
  mes: number
  celulas: (number | null)[]
  visitasPorDia: Record<number, Visita[]>
  hojeStr: string
  esMesAtual: boolean
}

// ── Card de visita arrastável ─────────────────────────────────
function VisitaCard({ visita, isDragOverlay = false }: { visita: Visita; isDragOverlay?: boolean }) {
  const arrastavel = ARRASTAVEL.has(visita.estado)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: visita.id,
    disabled: !arrastavel,
    data: { visita },
  })

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined

  if (isDragOverlay) {
    return (
      <div className={`px-1.5 py-1 rounded text-xs border shadow-lg rotate-1 ${estadoCor[visita.estado] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
        <span className="font-medium block">{visita.lojas?.nome ?? '—'}</span>
        <span className="opacity-70 block">{visita.profiles?.nome ?? ''}</span>
      </div>
    )
  }

  if (isDragging) {
    return (
      <div ref={setNodeRef} className="px-1.5 py-1 rounded text-xs border border-dashed border-gray-300 bg-gray-100 opacity-40">
        <span className="block">{'...'}</span>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(arrastavel ? { ...attributes, ...listeners } : {})}
      className={`block px-1.5 py-1 rounded text-xs border truncate ${estadoCor[visita.estado] ?? 'bg-gray-100 text-gray-600 border-gray-200'} ${arrastavel ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
    >
      <Link
        href={`/dashboard/visitas/${visita.id}`}
        onClick={e => { if (arrastavel) e.stopPropagation() }}
        className="hover:opacity-80 transition-opacity"
        draggable={false}
      >
        <span className="font-medium truncate block">{visita.lojas?.nome ?? '—'}</span>
        <span className="opacity-70 truncate block">{visita.profiles?.nome ?? ''}</span>
      </Link>
    </div>
  )
}

// ── Célula do calendário (drop target) ───────────────────────
function CalendarioCelula({
  dia, diaStr, isHoje, isWeekend, visitas, isDragOver, activeEstado, hojeStr, isDragging,
}: {
  dia: number | null; diaStr: string; isHoje: boolean; isWeekend: boolean
  visitas: Visita[]; isDragOver: boolean; activeEstado: string | null
  hojeStr: string; isDragging: boolean
}) {
  const isPassado = !!diaStr && diaStr < hojeStr
  const { setNodeRef } = useDroppable({ id: diaStr || `vazio-${Math.random()}`, disabled: !diaStr || isPassado })

  return (
    <div
      ref={setNodeRef}
      className={`min-h-28 p-2 group relative transition-colors
        ${!dia ? 'bg-gray-50/50' : ''}
        ${isWeekend && dia ? 'bg-gray-50/30' : ''}
        ${isDragOver && dia && !isPassado ? 'bg-blue-50 ring-2 ring-inset ring-blue-300' : ''}
        ${isDragging && isPassado && dia ? 'opacity-50 cursor-not-allowed' : ''}
        ${!isDragOver && dia && !isPassado ? 'hover:bg-gray-50/60' : ''}
      `}
    >
      {dia && (
        <>
          <div className="flex items-center justify-between mb-1.5">
            <span
              className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isHoje ? 'text-white' : 'text-gray-700'}`}
              style={isHoje ? { backgroundColor: '#D41317' } : {}}
            >
              {dia}
            </span>
            <Link
              href={`/dashboard/visitas/nova?data=${diaStr}`}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-300 hover:text-[#D41317] transition-all"
              title="Agendar visita neste dia"
            >
              <Plus className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-1">
            {visitas.slice(0, 3).map(v => (
              <VisitaCard key={v.id} visita={v} />
            ))}
            {visitas.length > 3 && (
              <p className="text-xs text-gray-400 pl-1">+{visitas.length - 3} mais</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────
export default function CalendarioGrid({ ano, mes, celulas, visitasPorDia: inicial, hojeStr, esMesAtual }: Props) {
  const router = useRouter()
  const [visitasPorDia, setVisitasPorDia] = useState(inicial)
  const [activeVisita, setActiveVisita] = useState<Visita | null>(null)
  const [overDia, setOverDia] = useState<string | null>(null)
  const [toast, setToast] = useState<{ tipo: 'erro' | 'ok'; mensagem: string } | null>(null)
  const isDragging = activeVisita !== null

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function handleDragStart(event: DragStartEvent) {
    setActiveVisita(event.active.data.current?.visita ?? null)
  }

  function handleDragOver(event: any) {
    setOverDia(event.over?.id ?? null)
  }

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveVisita(null)
    setOverDia(null)

    const { active, over } = event
    if (!over || !active) return

    const visita: Visita = active.data.current?.visita
    const novaDataStr = over.id as string
    if (!visita || !novaDataStr || novaDataStr === visita.data_visita) return
    if (!novaDataStr.match(/^\d{4}-\d{2}-\d{2}$/)) return
    if (novaDataStr < hojeStr) {
      setToast({ tipo: 'erro', mensagem: 'Não é possível agendar para uma data no passado.' })
      return
    }

    // Optimistic update
    const diaAntigo = new Date(visita.data_visita + 'T12:00:00').getDate()
    const diaNovo = new Date(novaDataStr + 'T12:00:00').getDate()

    setVisitasPorDia(prev => {
      const next = { ...prev }
      next[diaAntigo] = (next[diaAntigo] ?? []).filter(v => v.id !== visita.id)
      next[diaNovo] = [...(next[diaNovo] ?? []), { ...visita, data_visita: novaDataStr }]
      return next
    })

    const supabase = createClient()
    const { error } = await supabase
      .from('visitas')
      .update({ data_visita: novaDataStr })
      .eq('id', visita.id)

    if (error) {
      setVisitasPorDia(prev => {
        const next = { ...prev }
        next[diaNovo] = (next[diaNovo] ?? []).filter(v => v.id !== visita.id)
        next[diaAntigo] = [...(next[diaAntigo] ?? []), visita]
        return next
      })
      setToast({ tipo: 'erro', mensagem: 'Erro ao mover a visita. Tente novamente.' })
    } else {
      const dataFormatada = new Date(novaDataStr + 'T12:00:00').toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })
      setToast({ tipo: 'ok', mensagem: `Visita reagendada para ${dataFormatada}.` })
      router.refresh()
    }
  }, [router])

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      {/* Legenda */}
      <div className="flex gap-4 mb-4 flex-wrap">
        {[
          { estado: 'agendada', label: 'Agendada' },
          { estado: 'rascunho', label: 'Rascunho' },
          { estado: 'em_curso', label: 'Em curso' },
          { estado: 'concluida', label: 'Concluída' },
          { estado: 'assinada', label: 'Assinada' },
        ].map(({ estado, label }) => (
          <div key={estado} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${estadoPonto[estado]}`} />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
        <span className="text-xs text-gray-400 ml-2">· Arraste visitas agendadas, rascunhos e em curso para reagendar</span>
      </div>

      {/* Grelha */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DIAS_SEMANA.map(d => (
            <div key={d} className="px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
          {celulas.map((dia, i) => {
            const diaStr = dia
              ? `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
              : ''
            const isHoje = esMesAtual && diaStr === hojeStr
            const isWeekend = i % 7 >= 5
            const visitas = dia ? (visitasPorDia[dia] ?? []) : []
            const isDragOver = overDia === diaStr

            return (
              <CalendarioCelula
                key={i}
                dia={dia}
                diaStr={diaStr}
                isHoje={isHoje}
                isWeekend={isWeekend}
                visitas={visitas}
                isDragOver={isDragOver}
                activeEstado={activeVisita?.estado ?? null}
                hojeStr={hojeStr}
                isDragging={isDragging}
              />
            )
          })}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeVisita && <VisitaCard visita={activeVisita} isDragOverlay />}
      </DragOverlay>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all
          ${toast.tipo === 'erro' ? 'bg-white border-red-200 text-red-700' : 'bg-white border-green-200 text-green-700'}`}>
          {toast.tipo === 'erro'
            ? <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            : <CheckCircle className="w-4 h-4 flex-shrink-0" />
          }
          <span>{toast.mensagem}</span>
          <button onClick={() => setToast(null)} className="ml-1 opacity-50 hover:opacity-100 transition-opacity">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </DndContext>
  )
}
