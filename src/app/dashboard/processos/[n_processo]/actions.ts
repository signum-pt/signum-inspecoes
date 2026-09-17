'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getProfileOrFail() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, profile: null }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return { supabase, user, profile }
}

export async function atualizarProcesso(nProcesso: number, campos: {
  designacao?: string
  concelho?: string
  aberto?: boolean
  notas?: string
}) {
  const { supabase, profile } = await getProfileOrFail()
  if (!['admin', 'escritorio'].includes(profile?.role ?? '')) return { ok: false, error: 'Sem permissão' }

  const { error } = await supabase.from('processos').update(campos).eq('n_processo', nProcesso)
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/dashboard/processos/${nProcesso}`)
  return { ok: true }
}

export async function adicionarNota(nProcesso: number, nota: string) {
  const { supabase, user } = await getProfileOrFail()
  if (!user) return { ok: false, error: 'Não autenticado' }
  if (!nota.trim()) return { ok: false, error: 'Nota vazia' }

  const { error } = await supabase.from('processo_notas').insert({
    n_processo: nProcesso,
    nota: nota.trim(),
    autor_id: user.id,
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/dashboard/processos/${nProcesso}`)
  return { ok: true }
}

export async function eliminarNota(notaId: string, nProcesso: number) {
  const { supabase, user, profile } = await getProfileOrFail()
  if (!user) return { ok: false, error: 'Não autenticado' }

  // Admins podem apagar qualquer nota; outros só as suas
  const query = supabase.from('processo_notas').delete().eq('id', notaId)
  if (profile?.role !== 'admin') query.eq('autor_id', user.id)

  const { error } = await query
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/dashboard/processos/${nProcesso}`)
  return { ok: true }
}

export async function atualizarTrabalho(trabalhoId: string, nProcesso: number, campos: {
  estado?: string
  especialidade?: string
  descricao?: string
  prazo?: string | null
  tecnico_id?: string | null
}) {
  const { supabase, profile } = await getProfileOrFail()
  if (!['admin', 'escritorio'].includes(profile?.role ?? '')) return { ok: false, error: 'Sem permissão' }

  const { error } = await supabase.from('trabalhos').update(campos).eq('id', trabalhoId)
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/dashboard/processos/${nProcesso}`)
  return { ok: true }
}

export async function adicionarTrabalho(nProcesso: number, campos: {
  especialidade: string
  descricao?: string
  estado?: string
  ano?: number
  prazo?: string | null
  tecnico_id?: string | null
}) {
  const { supabase, profile } = await getProfileOrFail()
  if (!['admin', 'escritorio'].includes(profile?.role ?? '')) return { ok: false, error: 'Sem permissão' }

  const { error } = await supabase.from('trabalhos').insert({
    n_processo: nProcesso,
    especialidade: campos.especialidade,
    descricao: campos.descricao || null,
    estado: campos.estado || 'a fazer',
    ano: campos.ano || new Date().getFullYear(),
    prazo: campos.prazo || null,
    tecnico_id: campos.tecnico_id || null,
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/dashboard/processos/${nProcesso}`)
  return { ok: true }
}
