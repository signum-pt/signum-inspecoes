import { Suspense } from 'react'
import NovaLojaForm from './NovaLojaForm'

export default function NovaLojaPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-400">A carregar...</div>}>
      <NovaLojaForm />
    </Suspense>
  )
}
