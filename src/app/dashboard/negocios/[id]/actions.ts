'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function auth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, profile: null }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return { supabase, user, profile }
}

export async function editarNegocio(id: string, campos: {
  designacao?: string
  concelho?: string | null
  observacoes?: string | null
  valor_proposta?: number | null
  requerente_id?: string | null
  loja_id?: string | null
}) {
  const { supabase, profile } = await auth()
  if (!['admin', 'escritorio'].includes(profile?.role ?? '')) return { ok: false, error: 'Sem permissão' }

  const { error } = await supabase.from('negocios').update(campos).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/dashboard/negocios/${id}`)
  revalidatePath('/dashboard/negocios')
  return { ok: true }
}

export async function eliminarServico(servicoId: string, negocioId: string) {
  const { supabase, profile } = await auth()
  if (!['admin', 'escritorio'].includes(profile?.role ?? '')) return { ok: false, error: 'Sem permissão' }

  const { error } = await supabase.from('negocio_servicos').delete().eq('id', servicoId)
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/dashboard/negocios/${negocioId}`)
  return { ok: true }
}

export async function adicionarServico(negocioId: string, campos: {
  servico_id: string
  descricao?: string
  quantidade?: number
  valor_unit?: number | null
}) {
  const { supabase, profile } = await auth()
  if (!['admin', 'escritorio'].includes(profile?.role ?? '')) return { ok: false, error: 'Sem permissão' }

  const { error } = await supabase.from('negocio_servicos').insert({
    negocio_id: negocioId,
    servico_id: campos.servico_id,
    descricao: campos.descricao || null,
    quantidade: campos.quantidade || 1,
    valor_unit: campos.valor_unit || null,
    especialidade: null,
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/dashboard/negocios/${negocioId}`)
  return { ok: true }
}
