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

export async function aprovarNegocio(negocioId: string, opcoes: {
  criarProcesso: boolean
  nProcessoExistente?: number
  designacao: string
  concelho?: string
  primeiro_ano?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'escritorio'].includes(profile?.role ?? '')) return { ok: false, error: 'Sem permissão' }

  // Buscar o negócio e os seus serviços
  const { data: negocio } = await supabase
    .from('negocios')
    .select('id, designacao, requerente_id, loja_id, concelho, status, negocio_servicos(id, servico_id, descricao, quantidade, valor_unit)')
    .eq('id', negocioId)
    .single()

  if (!negocio) return { ok: false, error: 'Negócio não encontrado' }
  if (negocio.status !== 'pendente') return { ok: false, error: 'Negócio já não está pendente' }

  let nProcesso: number

  if (opcoes.criarProcesso) {
    // Criar novo processo
    const { data: proc, error: procErr } = await supabase
      .from('processos')
      .insert({
        designacao: opcoes.designacao.trim(),
        concelho: opcoes.concelho || negocio.concelho || null,
        primeiro_ano: opcoes.primeiro_ano || new Date().getFullYear(),
        requerente_id: negocio.requerente_id || null,
        loja_id: negocio.loja_id || null,
        aberto: true,
      })
      .select('n_processo')
      .single()

    if (procErr || !proc) return { ok: false, error: procErr?.message ?? 'Erro ao criar processo' }
    nProcesso = proc.n_processo
  } else {
    if (!opcoes.nProcessoExistente) return { ok: false, error: 'Processo não selecionado' }
    nProcesso = opcoes.nProcessoExistente
  }

  // Converter negocio_servicos em trabalhos
  const servicos = (negocio as any).negocio_servicos ?? []
  if (servicos.length > 0) {
    // Buscar nomes das especialidades
    const servicoIds = servicos.filter((s: any) => s.servico_id).map((s: any) => s.servico_id)
    const mapaServicos: Record<string, string> = {}
    if (servicoIds.length > 0) {
      const { data: servicosData } = await supabase.from('servicos').select('id, nome').in('id', servicoIds)
      for (const sv of servicosData ?? []) mapaServicos[sv.id] = sv.nome
    }

    // Inserir trabalhos um a um para capturar IDs e ligar ao negocio_servico
    for (const s of servicos) {
      const { data: trab, error: trabErr } = await supabase
        .from('trabalhos')
        .insert({
          n_processo: nProcesso,
          especialidade: s.servico_id ? (mapaServicos[s.servico_id] ?? null) : null,
          descricao: s.descricao || null,
          estado: 'a fazer',
          ano: new Date().getFullYear(),
        })
        .select('id')
        .single()

      if (trabErr) return { ok: false, error: trabErr.message }

      // Ligar o trabalho criado de volta ao negocio_servico
      await supabase.from('negocio_servicos').update({ trabalho_id: trab.id }).eq('id', s.id)
    }
  }

  // Atualizar negócio: status + n_processo
  const { error: negErr } = await supabase
    .from('negocios')
    .update({ status: 'em_execucao', n_processo: nProcesso })
    .eq('id', negocioId)

  if (negErr) return { ok: false, error: negErr.message }

  await supabase.from('negocio_historico').insert({
    negocio_id: negocioId,
    status_anterior: 'pendente',
    status_novo: 'em_execucao',
    nota: `Aprovado — Processo #${nProcesso}`,
    autor_id: user.id,
  })

  revalidatePath('/dashboard/negocios')
  revalidatePath('/dashboard/trabalhos')
  revalidatePath(`/dashboard/processos/${nProcesso}`)
  return { ok: true, nProcesso }
}

export async function criarNegocioCompleto(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'escritorio'].includes(profile?.role ?? '')) {
    return { ok: false, error: 'Sem permissão' }
  }

  const designacao = formData.get('designacao') as string
  if (!designacao?.trim()) return { ok: false, error: 'Designação obrigatória' }

  const tipoNegocio = formData.get('tipo_negocio') as string
  let nProcesso: number | null = null
  if (tipoNegocio === 'existente') {
    const raw = formData.get('n_processo_existente') as string
    nProcesso = raw ? Number(raw) : null
  }

  const { data, error } = await supabase.from('negocios').insert({
    designacao: designacao.trim(),
    concelho: (formData.get('concelho') as string) || null,
    observacoes: (formData.get('observacoes') as string) || null,
    valor_proposta: formData.get('valor_proposta') ? Number(formData.get('valor_proposta')) : null,
    requerente_id: (formData.get('requerente_id') as string) || null,
    loja_id: (formData.get('loja_id') as string) || null,
    n_processo: nProcesso,
    status: 'pendente',
    criado_por: user.id,
  }).select('id').single()

  if (error) return { ok: false, error: error.message }

  // Inserir serviços
  const linhasRaw = formData.get('linhas') as string
  if (linhasRaw) {
    const linhas = JSON.parse(linhasRaw) as Array<{
      servico_id: string; descricao: string; quantidade: number
      valor_unit: string; prazo: string; tecnico_id: string
    }>
    const servicosValidos = linhas.filter(l => l.servico_id)
    if (servicosValidos.length > 0) {
      await supabase.from('negocio_servicos').insert(
        servicosValidos.map(l => ({
          negocio_id: data.id,
          servico_id: l.servico_id,
          descricao: l.descricao || null,
          quantidade: l.quantidade || 1,
          valor_unit: l.valor_unit ? Number(l.valor_unit) : null,
          especialidade: null,
        }))
      )
    }
  }

  await supabase.from('negocio_historico').insert({
    negocio_id: data.id,
    status_anterior: null,
    status_novo: 'pendente',
    autor_id: user.id,
  })

  revalidatePath('/dashboard/negocios')
  return { ok: true, id: data.id }
}
