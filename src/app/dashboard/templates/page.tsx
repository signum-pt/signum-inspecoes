import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'

export default async function TemplatesPage() {
  const supabase = await createClient()

  const { data: templates } = await supabase
    .from('templates')
    .select('*')
    .order('nome')

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates de relatório</h1>
          <p className="text-gray-500 text-sm mt-1">Gerir os tipos de relatório disponíveis</p>
        </div>
        <Link
          href="/dashboard/templates/novo"
          className="flex items-center gap-2 bg-[#D41317] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#A50E11] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo template
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates && templates.length > 0 ? (
          templates.map((t) => (
            <Link
              key={t.id}
              href={`/dashboard/templates/${t.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-red-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-[#D41317]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{t.nome}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0">v{t.versao}</span>
                  </div>
                  {t.descricao && (
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{t.descricao}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1.5">
                    {Array.isArray(t.secoes) ? t.secoes.length : 0} secções ·{' '}
                    {Array.isArray(t.secoes)
                      ? t.secoes.reduce((acc: number, s: any) => acc + (s.questoes?.length ?? 0), 0)
                      : 0}{' '}
                    questões
                  </p>
                </div>
              </div>
              {!t.ativo && (
                <span className="mt-3 inline-block text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  Inativo
                </span>
              )}
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-16 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Ainda não há templates criados.</p>
            <Link href="/dashboard/templates/novo" className="text-sm text-[#D41317] hover:underline mt-1 inline-block">
              Criar o primeiro template
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

