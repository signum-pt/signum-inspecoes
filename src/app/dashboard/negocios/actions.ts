'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const VALID_STATUS = ['pendente', 'em_execucao', 'concluido', 'faturar', 'faturado', 'cancelado'] as const
type Status = typeof VALID_STATUS[number]

function isValidStatus(s: string): s is Status {
  return VALID_STATUS.includes(s as Status)
}

export async function atualizarStatusNegocio(negocioId: string, novoStatus: string) {
  if (!isValidStatus(novoStatus)) return { ok: false, error: 'Estado inválido' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'escritorio'].includes(profile?.role ?? '')) {
    return { ok: false, error: 'Sem permissão' }
  }

  const { data: negocio } = await supabase
    .from('negocios')
    .select('status, n_processo')
    .eq('id', negocioId)
    .single()

  if (!negocio) return { ok: false, error: 'Negócio não encontrado' }

  const { error } = await supabase
    .from('negocios')
    .update({ status: novoStatus })
    .eq('id', negocioId)

  if (error) return { ok: false, error: error.message }

  // Registar no histórico
  await supabase.from('negocio_historico').insert({
    negocio_id: negocioId,
    status_anterior: negocio.status,
    status_novo: novoStatus,
    autor_id: user.id,
  })

  revalidatePath('/dashboard/negocios')
  return { ok: true }
}

export async function criarNegocio(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado' }

  const designacao = formData.get('designacao') as string
  if (!designacao?.trim()) return { ok: false, error: 'Designação obrigatória' }

  const { data, error } = await supabase.from('negocios').insert({
    designacao: designacao.trim(),
    concelho: (formData.get('concelho') as string) || null,
    observacoes: (formData.get('observacoes') as string) || null,
    valor_proposta: formData.get('valor_proposta') ? Number(formData.get('valor_proposta')) : null,
    status: 'pendente',
    criado_por: user.id,
  }).select('id').single()

  if (error) return { ok: false, error: error.message }

  await supabase.from('negocio_historico').insert({
    negocio_id: data.id,
    status_anterior: null,
    status_novo: 'pendente',
    autor_id: user.id,
  })

  revalidatePath('/dashboard/negocios')
  return { ok: true, id: data.id }
}
