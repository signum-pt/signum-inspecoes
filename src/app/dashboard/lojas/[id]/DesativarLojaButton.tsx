'use client'

export default function DesativarLojaButton({ formAction }: { formAction: (formData: FormData) => void | Promise<void> }) {
  return (
    <form action={formAction}>
      <button
        type="submit"
        onClick={e => { if (!confirm('Desativar esta loja? Deixará de aparecer na lista mas o histórico de visitas é mantido.')) e.preventDefault() }}
        className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
      >
        Desativar loja
      </button>
    </form>
  )
}
