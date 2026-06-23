import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Layers } from 'lucide-react'
import { requireAdmin } from '@/lib/requireRole'

export default async function SecoesGlobaisPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: secoes } = await supabase
    .from('secoes_globais')
    .select('*, secoes_globais_campos(id)')
    .order('ordem')

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Secções globais</h1>
          <p className="text-gray-500 text-sm mt-1">
            Secções predefinidas que podem ser importadas ao criar um template
          </p>
        </div>
        <Link
          href="/dashboard/secoes/nova"
          className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ backgroundColor: '#D41317' }}
        >
          <Plus className="w-4 h-4" />
          Nova secção
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {secoes && secoes.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Campos</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {secoes.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.nome}</td>
                  <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate">{s.descricao || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{s.secoes_globais_campos?.length ?? 0} campos</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/dashboard/secoes/${s.id}`} className="text-sm font-medium hover:underline" style={{ color: '#D41317' }}>
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Ainda não há secções globais.</p>
            <p className="text-xs mt-1 mb-4">Crie secções como "Posto de Transformação", "Quadros Elétricos", etc.</p>
            <Link href="/dashboard/secoes/nova" className="text-sm font-medium hover:underline" style={{ color: '#D41317' }}>
              Criar a primeira secção
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
