'use client'

import { Archive } from 'lucide-react'

export default function DesativarEntidadeButton({ formAction }: { formAction: string | ((formData: FormData) => void | Promise<void>) }) {
  return (
    <form action={formAction}>
      <button
        type="submit"
        onClick={e => { if (!confirm('Desativar esta entidade? As lojas ficam ocultas mas o histórico é mantido.')) e.preventDefault() }}
        className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
      >
        <Archive className="w-3.5 h-3.5" />
        Desativar entidade
      </button>
    </form>
  )
}
