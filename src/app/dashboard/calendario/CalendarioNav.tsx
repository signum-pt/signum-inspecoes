'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

interface Props {
  ano: number
  mes: number
}

export default function CalendarioNav({ ano, mes }: Props) {
  const router = useRouter()

  function navegar(delta: number) {
    let novoMes = mes + delta
    let novoAno = ano
    if (novoMes < 1) { novoMes = 12; novoAno-- }
    if (novoMes > 12) { novoMes = 1; novoAno++ }
    router.push(`/dashboard/calendario?ano=${novoAno}&mes=${novoMes}`)
  }

  function hoje() {
    const now = new Date()
    router.push(`/dashboard/calendario?ano=${now.getFullYear()}&mes=${now.getMonth() + 1}`)
  }

  return (
    <div className="flex items-center gap-3">
      <button onClick={() => navegar(-1)}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <h2 className="text-lg font-semibold text-gray-900 w-44 text-center">
        {MESES[mes - 1]} {ano}
      </h2>
      <button onClick={() => navegar(1)}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
        <ChevronRight className="w-5 h-5" />
      </button>
      <button onClick={hoje}
        className="ml-2 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600">
        Hoje
      </button>
    </div>
  )
}
