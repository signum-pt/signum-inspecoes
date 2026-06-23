'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Building2 } from 'lucide-react'
import Link from 'next/link'

const CORES_PREDEFINIDAS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
]

export default function NovaEntidadeForm() {
  const router = useRouter()
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [cor, setCor] = useState('#3b82f6')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    const form = e.currentTarget
    const dados = {
      nome: (form.elements.namedItem('nome') as HTMLInputElement).value,
      notas: (form.elements.namedItem('notas') as HTMLTextAreaElement).value,
      cor,
    }

    const supabase = createClient()
    const { error } = await supabase.from('entidades').insert(dados)

    if (error) {
      setErro('Erro ao guardar. Tente novamente.')
      setCarregando(false)
      return
    }

    router.push('/dashboard/entidades')
    router.refresh()
  }

  return (
    <div className="p-8 max-w-lg">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/entidades" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova entidade</h1>
          <p className="text-gray-500 text-sm mt-0.5">Marca ou cadeia de lojas</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${cor}20` }}
          >
            <Building2 className="w-7 h-7" style={{ color: cor }} />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da entidade *</label>
            <input
              type="text"
              name="nome"
              required
              placeholder="ex: Intermarché"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317] focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cor de identificação</label>
          <div className="flex gap-2 flex-wrap">
            {CORES_PREDEFINIDAS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCor(c)}
                className={`w-8 h-8 rounded-lg transition-all ${cor === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas</label>
          <textarea
            name="notas"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317] focus:border-transparent resize-none"
            placeholder="Informações relevantes sobre esta entidade..."
          />
        </div>

        {erro && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={carregando}
            className="bg-[#D41317] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#A50E11] disabled:opacity-50 transition-colors"
          >
            {carregando ? 'A guardar...' : 'Guardar entidade'}
          </button>
          <Link href="/dashboard/entidades" className="px-5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
