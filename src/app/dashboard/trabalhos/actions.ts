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
  revalidatePath('/dashboard/trabalhos')
  return { ok: true }
}
