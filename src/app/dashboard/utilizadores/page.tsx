import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/requireRole'

const roleLabel: Record<string, string> = {
  admin: 'Administrador',
  tecnico: 'Técnico',
  escritorio: 'Escritório',
}

export default async function UtilizadoresPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: utilizadores } = await supabase
    .from('profiles')
    .select('*')
    .order('nome')

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Utilizadores</h1>
        <p className="text-gray-500 text-sm mt-1">
          Para criar novos utilizadores, crie-os no painel do Supabase (Authentication &gt; Users)
          e o perfil será criado automaticamente.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Função</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {utilizadores?.map((u) => (
              <tr key={u.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.nome}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{roleLabel[u.role] ?? u.role}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${u.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {u.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

