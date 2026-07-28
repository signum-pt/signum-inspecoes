'use server'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Building2, MapPin, FileText, Plus, Pencil, Archive } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import DesativarEntidadeButton from './DesativarEntidadeButton'

export default async function EntidadeDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  const canEdit = profile?.role === 'admin' || profile?.role === 'tecnico'

  const { data: entidade } = await supabase
    .from('entidades')
    .select('*')
    .eq('id', id)
    .single()

  if (!entidade) notFound()

  // Se entidade inativa, admin vê todas as lojas para consulta histórica
  const lojasQuery = supabase.from('lojas').select('*').eq('entidade_id', id).order('nome')
  const [{ data: lojas }, { data: templates }, { count: lojasInativas }] = await Promise.all([
    entidade.ativo ? lojasQuery.eq('ativo', true) : lojasQuery,
    supabase.from('templates').select('*').eq('entidade_id', id).order('nome'),
    supabase.from('lojas').select('*', { count: 'exact', head: true }).eq('entidade_id', id).eq('ativo', false),
  ])

  async function desativarEntidade() {
    'use server'
    const sb = await createClient()
    await sb.from('entidades').update({ ativo: false }).eq('id', id)
    redirect('/dashboard/entidades')
  }

  async function reativarEntidade() {
    'use server'
    const sb = await createClient()
    await sb.from('entidades').update({ ativo: true }).eq('id', id)
    redirect(`/dashboard/entidades/${id}`)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/entidades" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${entidade.cor}20` }}
          >
            <Building2 className="w-5 h-5" style={{ color: entidade.cor }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{entidade.nome}</h1>
            {entidade.notas && <p className="text-gray-500 text-sm mt-0.5">{entidade.notas}</p>}
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            {entidade.ativo ? (
              <>
                <Link
                  href={`/dashboard/entidades/${id}/editar`}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </Link>
                <DesativarEntidadeButton formAction={desativarEntidade} />
              </>
            ) : (
              <form action={reativarEntidade}>
                <button type="submit"
                  className="flex items-center gap-2 text-sm text-green-600 border border-green-200 hover:border-green-400 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors">
                  Reativar entidade
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {!entidade.ativo && (
        <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
          <Archive className="w-4 h-4 flex-shrink-0" />
          <span>Esta entidade está inativa. As lojas não aparecem na listagem geral, mas o histórico de visitas está preservado.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lojas */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              Lojas ({lojas?.length ?? 0})
              {isAdmin && entidade.ativo && (lojasInativas ?? 0) > 0 && (
                <Link href={`/dashboard/lojas/inativas`}
                  className="flex items-center gap-1 text-xs font-normal text-gray-400 hover:text-gray-600 ml-1">
                  <Archive className="w-3 h-3" />
                  {lojasInativas} inativa{lojasInativas !== 1 ? 's' : ''}
                </Link>
              )}
            </h2>
            {canEdit && (
              <Link
                href={`/dashboard/lojas/nova?entidade_id=${id}`}
                className="flex items-center gap-1.5 text-xs font-medium hover:underline"
                style={{ color: '#D41317' }}
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </Link>
            )}
          </div>
          <div className="space-y-2">
            {lojas && lojas.length > 0 ? lojas.map((loja) => (
              <Link
                key={loja.id}
                href={`/dashboard/lojas/${loja.id}`}
                className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-4 py-3 hover:border-red-300 transition-colors"
              >
                <MapPin className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{loja.nome}</p>
                  {loja.cidade && <p className="text-xs text-gray-400 truncate">{loja.cidade}</p>}
                </div>
              </Link>
            )) : (
              <p className="text-sm text-gray-400 py-4 text-center bg-white rounded-lg border border-dashed border-gray-200">
                Ainda não há lojas nesta entidade.
              </p>
            )}
          </div>
        </div>

        {/* Templates */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              Templates ({templates?.length ?? 0})
            </h2>
            {isAdmin && (
              <Link
                href={`/dashboard/templates/novo?entidade_id=${id}`}
                className="flex items-center gap-1.5 text-xs font-medium hover:underline"
                style={{ color: '#D41317' }}
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </Link>
            )}
          </div>
          <div className="space-y-2">
            {templates && templates.length > 0 ? templates.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/templates/${t.id}`}
                className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-4 py-3 hover:border-red-300 transition-colors"
              >
                <FileText className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{t.nome}</p>
                  <p className="text-xs text-gray-400">
                    v{t.versao} · {Array.isArray(t.secoes)
                      ? t.secoes.reduce((acc: number, s: any) => acc + (s.questoes?.length ?? 0), 0)
                      : 0} questões
                  </p>
                </div>
                {!t.ativo && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">Inativo</span>
                )}
              </Link>
            )) : (
              <p className="text-sm text-gray-400 py-4 text-center bg-white rounded-lg border border-dashed border-gray-200">
                Ainda não há templates para esta entidade.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
