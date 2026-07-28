import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Building2, Archive } from 'lucide-react'

export default async function EntidadesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  const [{ data: entidades }, { count: inativas }] = await Promise.all([
    supabase.from('entidades').select(`*, lojas(count), templates(count)`).eq('ativo', true).order('nome'),
    supabase.from('entidades').select('*', { count: 'exact', head: true }).eq('ativo', false),
  ])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lojas</h1>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-3">
            Selecione uma marca para ver as suas lojas
            {isAdmin && (inativas ?? 0) > 0 && (
              <Link href="/dashboard/entidades/inativas"
                className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors">
                <Archive className="w-3.5 h-3.5" />
                {inativas} inativa{inativas !== 1 ? 's' : ''}
              </Link>
            )}
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/dashboard/entidades/nova"
            className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: '#D41317' }}
          >
            <Plus className="w-4 h-4" />
            Nova entidade
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entidades && entidades.length > 0 ? (
          entidades.map((entidade: any) => (
            <Link
              key={entidade.id}
              href={`/dashboard/entidades/${entidade.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-red-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${entidade.cor}20` }}
                >
                  <Building2 className="w-5 h-5" style={{ color: entidade.cor }} />
                </div>
                <p className="text-sm font-semibold text-gray-900">{entidade.nome}</p>
              </div>
              <div className="flex gap-4 text-xs text-gray-400">
                <span>{entidade.lojas?.[0]?.count ?? 0} lojas</span>
                <span>{entidade.templates?.[0]?.count ?? 0} templates</span>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-16 text-gray-400">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Ainda não há entidades criadas.</p>
            {isAdmin && (
              <Link href="/dashboard/entidades/nova" className="text-sm hover:underline mt-1 inline-block" style={{ color: '#D41317' }}>
                Criar a primeira entidade
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
