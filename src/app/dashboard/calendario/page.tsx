import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import CalendarioNav from './CalendarioNav'
import CalendarioGrid from './CalendarioGrid'

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const hoje = new Date()
  const ano = parseInt(params.ano ?? '') || hoje.getFullYear()
  const mes = parseInt(params.mes ?? '') || hoje.getMonth() + 1

  const supabase = await createClient()

  const inicioMes = `${ano}-${String(mes).padStart(2, '0')}-01`
  const fimMes = new Date(ano, mes, 0).toISOString().split('T')[0]

  const { data: visitas } = await supabase
    .from('visitas')
    .select('id, data_visita, estado, lojas(nome), profiles(nome)')
    .gte('data_visita', inicioMes)
    .lte('data_visita', fimMes)
    .order('data_visita')

  // Agrupar por dia
  const visitasPorDia: Record<number, any[]> = {}
  for (const v of visitas ?? []) {
    const dia = new Date(v.data_visita + 'T12:00:00').getDate()
    if (!visitasPorDia[dia]) visitasPorDia[dia] = []
    visitasPorDia[dia]!.push(v)
  }

  // Construir grelha
  const primeiroDia = new Date(ano, mes - 1, 1).getDay()
  const offsetSeg = (primeiroDia + 6) % 7
  const diasNoMes = new Date(ano, mes, 0).getDate()
  const totalCelulas = Math.ceil((offsetSeg + diasNoMes) / 7) * 7

  const celulas: (number | null)[] = []
  for (let i = 0; i < totalCelulas; i++) {
    const dia = i - offsetSeg + 1
    celulas.push(dia >= 1 && dia <= diasNoMes ? dia : null)
  }

  const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
  const esMesAtual = hoje.getFullYear() === ano && hoje.getMonth() + 1 === mes

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendário</h1>
          <p className="text-gray-500 text-sm mt-1">
            {(visitas?.length ?? 0)} visita{(visitas?.length ?? 0) !== 1 ? 's' : ''} este mês
          </p>
        </div>
        <div className="flex items-center gap-4">
          <CalendarioNav ano={ano} mes={mes} />
          <Link
            href="/dashboard/visitas/nova"
            className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: '#D41317' }}
          >
            <Plus className="w-4 h-4" />
            Nova visita
          </Link>
        </div>
      </div>

      <CalendarioGrid
        key={`${ano}-${mes}`}
        ano={ano}
        mes={mes}
        celulas={celulas}
        visitasPorDia={visitasPorDia}
        hojeStr={hojeStr}
        esMesAtual={esMesAtual}
      />
    </div>
  )
}
