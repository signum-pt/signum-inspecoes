import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, MapPin, Archive } from 'lucide-react'

export default async function LojasPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const isAdmin = profile?.role === 'admin'

  const [{ data: lojas }, { count: inativas }] = await Promise.all([
    supabase.from('lojas').select('*').eq('ativo', true).order('nome'),
    supabase.from('lojas').select('*', { count: 'exact', head: true }).eq('ativo', false),
  ])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lojas</h1>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-3">
            {lojas?.length ?? 0} lojas ativas
            {isAdmin && (inativas ?? 0) > 0 && (
              <Link href="/dashboard/lojas/inativas"
                className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors">
                <Archive className="w-3.5 h-3.5" />
                {inativas} inativa{inativas !== 1 ? 's' : ''}
              </Link>
            )}
          </p>
        </div>
        <Link
          href="/dashboard/lojas/nova"
          className="flex items-center gap-2 bg-[#D41317] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#A50E11] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova loja
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lojas && lojas.length > 0 ? (
          lojas.map((loja) => (
            <Link
              key={loja.id}
              href={`/dashboard/lojas/${loja.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-red-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-[#D41317]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{loja.nome}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {loja.cidade ? `${loja.cidade}` : 'Sem localização'}
                    {loja.codigo_postal ? ` · ${loja.codigo_postal}` : ''}
                  </p>
                  {loja.morada && (
                    <p className="text-xs text-gray-400 truncate">{loja.morada}</p>
                  )}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-16 text-gray-400">
            <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Ainda não há lojas registadas.</p>
            <Link href="/dashboard/lojas/nova" className="text-sm text-[#D41317] hover:underline mt-1 inline-block">
              Adicionar a primeira loja
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

