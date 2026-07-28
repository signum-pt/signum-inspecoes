'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, RotateCcw } from 'lucide-react'

export default async function LojasInativasPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard/lojas')

  const { data: lojas } = await supabase
    .from('lojas')
    .select('*, entidades(nome)')
    .eq('ativo', false)
    .order('nome')

  async function reativarLoja(lojaId: string) {
    'use server'
    const sb = await createClient()
    await sb.from('lojas').update({ ativo: true }).eq('id', lojaId)
    redirect('/dashboard/lojas/inativas')
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/lojas" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lojas inativas</h1>
          <p className="text-gray-500 text-sm mt-1">
            {lojas?.length ?? 0} loja{lojas?.length !== 1 ? 's' : ''} desativada{lojas?.length !== 1 ? 's' : ''} — histórico de visitas mantido
          </p>
        </div>
      </div>

      {lojas && lojas.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {lojas.map((loja) => (
            <div key={loja.id} className="flex items-center justify-between px-5 py-4 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-gray-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-700 truncate">{loja.nome}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {loja.entidades?.nome}
                    {loja.cidade ? ` · ${loja.cidade}` : ''}
                  </p>
                </div>
              </div>
              <form action={reativarLoja.bind(null, loja.id)} className="flex-shrink-0">
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
          <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Não há lojas inativas.</p>
          <Link href="/dashboard/lojas" className="text-sm text-[#D41317] hover:underline mt-1 inline-block">
            Voltar às lojas
          </Link>
        </div>
      )}
    </div>
  )
}
