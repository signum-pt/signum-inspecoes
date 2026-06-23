import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Pencil } from 'lucide-react'
import type { TipoCampo } from '@/lib/types'

const tipoLabel: Record<TipoCampo, string> = {
  texto: 'Texto', numero: 'Número', sim_nao: 'Sim/Não',
  escolha_multipla: 'Múltipla', data: 'Data', foto: 'Foto', observacao: 'Observação',
  separador: 'Separador',
}
const tipoCor: Record<TipoCampo, string> = {
  texto: 'bg-blue-50 text-blue-700', numero: 'bg-purple-50 text-purple-700',
  sim_nao: 'bg-green-50 text-green-700', escolha_multipla: 'bg-orange-50 text-orange-700',
  data: 'bg-pink-50 text-pink-700', foto: 'bg-yellow-50 text-yellow-700',
  observacao: 'bg-gray-100 text-gray-600', separador: 'bg-gray-800 text-white',
}

export default async function TemplateDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const isAdmin = profile?.role === 'admin'

  const { data: template } = await supabase
    .from('templates')
    .select('*, entidades(nome, cor)')
    .eq('id', id)
    .single()

  if (!template) notFound()

  const { data: secoes } = await supabase
    .from('template_secoes')
    .select(`*, template_campos(*, campos(*))`)
    .eq('template_id', id)
    .order('ordem')

  const totalCampos = secoes?.reduce((acc, s) => acc + (s.template_campos?.length ?? 0), 0) ?? 0

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/entidades/${template.entidade_id}`} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5" style={{ color: '#D41317' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{template.nome}</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {template.entidades?.nome} · v{template.versao} · {secoes?.length ?? 0} secções · {totalCampos} campos
            </p>
          </div>
        </div>
        {isAdmin && (
          <Link
            href={`/dashboard/templates/${id}/editar`}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </Link>
        )}
      </div>

      {template.descricao && (
        <p className="text-sm text-gray-500 mb-6 bg-white border border-gray-200 rounded-xl px-5 py-4">{template.descricao}</p>
      )}

      <div className="space-y-4">
        {secoes && secoes.length > 0 ? secoes.map((secao: any) => (
          <div key={secao.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">{secao.titulo}</h2>
              <span className="text-xs text-gray-400">{secao.template_campos?.length ?? 0} campos</span>
            </div>
            <div className="divide-y divide-gray-50">
              {secao.template_campos?.length > 0 ? (
                [...secao.template_campos]
                  .sort((a: any, b: any) => a.ordem - b.ordem)
                  .map((tc: any) => (
                    <div key={tc.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-gray-900">{tc.campos?.nome}</span>
                          {tc.campos?.unidade && (
                            <span className="text-xs text-gray-400">({tc.campos.unidade})</span>
                          )}
                          {tc.obrigatorio && (
                            <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded">Obrigatório</span>
                          )}
                        </div>
                        {tc.campos?.descricao && (
                          <p className="text-xs text-gray-400 mt-0.5">{tc.campos.descricao}</p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${tipoCor[tc.campos?.tipo as TipoCampo] ?? 'bg-gray-100 text-gray-600'}`}>
                        {tipoLabel[tc.campos?.tipo as TipoCampo] ?? tc.campos?.tipo}
                      </span>
                    </div>
                  ))
              ) : (
                <p className="px-5 py-4 text-sm text-gray-400">Sem campos nesta secção.</p>
              )}
            </div>
          </div>
        )) : (
          <p className="text-sm text-gray-400 text-center py-12">Este template não tem secções definidas.</p>
        )}
      </div>
    </div>
  )
}
