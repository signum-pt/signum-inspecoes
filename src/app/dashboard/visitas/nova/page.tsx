import { Suspense } from 'react'
import NovaVisitaForm from './NovaVisitaForm'

export default function NovaVisitaPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-400">A carregar...</div>}>
      <NovaVisitaForm />
    </Suspense>
  )
}
