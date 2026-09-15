'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'

export default function NovoNegocioButton() {
  return (
    <Link
      href="/dashboard/negocios/novo"
      className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
      style={{ backgroundColor: '#D41317' }}
    >
      <Plus className="w-4 h-4" />
      Novo negócio
    </Link>
  )
}
