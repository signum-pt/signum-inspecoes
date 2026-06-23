import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Database } from 'lucide-react'
import type { TipoCampo } from '@/lib/types'
import { requireAdmin } from '@/lib/requireRole'

const tipoLabel: Record<TipoCampo, string> = {
  texto: 'Texto',
  numero: 'Número',
  sim_nao: 'Sim / Não',
  escolha_multipla: 'Escolha múltipla',
  data: 'Data',
  foto: 'Foto',
  observacao: 'Observação',
  separador: 'Separador',
}

const tipoCor: Record<TipoCampo, string> = {
  texto: 'bg-blue-50 text-blue-700',
  numero: 'bg-purple-50 text-purple-700',
  sim_nao: 'bg-green-50 text-green-700',
  escolha_multipla: 'bg-orange-50 text-orange-700',
  data: 'bg-pink-50 text-pink-700',
  foto: 'bg-yellow-50 text-yellow-700',
  observacao: 'bg-gray-100 text-gray-600',
  separador: 'bg-gray-800 text-white',
}

export default async function CamposPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: campos } = await supabase
    .from('campos')
    .select('*')
    .order('nome')

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campos globais</h1>
          <p className="text-gray-500 text-sm mt-1">
            Campos reutilizáveis em qualquer template · pesquisáveis em relatórios e dashboards
          </p>
        </div>
        <Link
          href="/dashboard/campos/novo"
          className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ backgroundColor: '#D41317' }}
        >
          <Plus className="w-4 h-4" />
          Novo campo
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {campos && campos.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Chave</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unidade</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {campos.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.nome}</td>
                  <td className="px-6 py-4">
                    <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">{c.chave}</code>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${tipoCor[c.tipo as TipoCampo] ?? 'bg-gray-100 text-gray-600'}`}>
                        {tipoLabel[c.tipo as TipoCampo] ?? c.tipo}
                      </span>
                      {c.sistema && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Sistema</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.unidade || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate">{c.descricao || '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/dashboard/campos/${c.id}`} className="text-sm font-medium hover:underline" style={{ color: '#D41317' }}>
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <Database className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Ainda não há campos na biblioteca.</p>
            <p className="text-xs mt-1 mb-4">Crie campos como "Resistência de terra", "Tensão de alimentação", etc.</p>
            <Link href="/dashboard/campos/novo" className="text-sm font-medium hover:underline" style={{ color: '#D41317' }}>
              Criar o primeiro campo
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
