'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, RotateCcw } from 'lucide-react'

export default async function EntidadesInativasPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard/entidades')

  const { data: entidades } = await supabase
    .from('entidades')
    .select('*')
    .eq('ativo', false)
    .order('nome')

  async function reativarEntidade(entidadeId: string) {
    'use server'
    const sb = await createClient()
    await sb.from('entidades').update({ ativo: true }).eq('id', entidadeId)
    redirect('/dashboard/entidades/inativas')
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/entidades" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entidades inativas</h1>
          <p className="text-gray-500 text-sm mt-1">
            {entidades?.length ?? 0} entidade{entidades?.length !== 1 ? 's' : ''} desativada{entidades?.length !== 1 ? 's' : ''} — histórico de visitas mantido
          </p>
        </div>
      </div>

      {entidades && entidades.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {entidades.map((entidade) => (
            <div key={entidade.id} className="flex items-center justify-between px-5 py-4 gap-4">
              <Link href={`/dashboard/entidades/${entidade.id}`} className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-75 transition-opacity">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${entidade.cor}20` }}>
                  <Building2 className="w-4 h-4" style={{ color: entidade.cor }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-700 truncate">{entidade.nome}</p>
                  {entidade.notas && <p className="text-xs text-gray-400 truncate">{entidade.notas}</p>}
                </div>
              </Link>
              <form action={reativarEntidade.bind(null, entidade.id)} className="flex-shrink-0">
                <button type="submit"
                  className="flex items-center gap-2 text-sm font-medium text-green-600 border border-green-200 hover:border-green-400 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reativar
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Não há entidades inativas.</p>
          <Link href="/dashboard/entidades" className="text-sm text-[#D41317] hover:underline mt-1 inline-block">
            Voltar às entidades
          </Link>
        </div>
      )}
    </div>
  )
}
