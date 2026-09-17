'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ESTADOS = ['a fazer', 'urgente', 'em curso', 'pendente', 'concluído', 'cancelado']

export async function moverTrabalho(trabalhoId: string, novoEstado: string) {
  if (!ESTADOS.includes(novoEstado)) return { ok: false, error: 'Estado inválido' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado' }

  const { error } = await supabase
    .from('trabalhos')
    .update({ estado: novoEstado })
    .eq('id', trabalhoId)

  if (error) return { ok: false, error: error.message }

  // Verificar se este trabalho está ligado a um negócio
  // e se todos os trabalhos do negócio estão concluídos
  if (novoEstado === 'concluído' || novoEstado === 'cancelado') {
    const { data: servico } = await supabase
      .from('negocio_servicos')
      .select('negocio_id')
      .eq('trabalho_id', trabalhoId)
      .single()

    if (servico?.negocio_id) {
      const negocioId = servico.negocio_id

      // Buscar todos os trabalhos ligados a este negócio
      const { data: todosServicos } = await supabase
        .from('negocio_servicos')
        .select('trabalho_id')
        .eq('negocio_id', negocioId)
        .not('trabalho_id', 'is', null)

      if (todosServicos && todosServicos.length > 0) {
        const trabalhoIds = todosServicos.map(s => s.trabalho_id)
        const { data: todosTrabalhos } = await supabase
          .from('trabalhos')
          .select('id, estado')
          .in('id', trabalhoIds)

        const todosConcluidos = todosTrabalhos?.every(
          t => t.estado === 'concluído' || t.estado === 'cancelado'
        )

        if (todosConcluidos) {
          // Verificar estado atual do negócio
          const { data: neg } = await supabase
            .from('negocios')
            .select('status')
            .eq('id', negocioId)
            .single()

          if (neg?.status === 'em_execucao') {
            await supabase.from('negocios').update({ status: 'concluido' }).eq('id', negocioId)
            await supabase.from('negocio_historico').insert({
              negocio_id: negocioId,
              status_anterior: 'em_execucao',
              status_novo: 'concluido',
              nota: 'Todos os trabalhos concluídos automaticamente',
              autor_id: user.id,
            })
            revalidatePath('/dashboard/negocios')
          }
        }
      }
    }
  }

  revalidatePath('/dashboard/trabalhos')
  return { ok: true }
}
