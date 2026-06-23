import { createClient } from '@/lib/supabase/server'
import EquipaVista, { EquipaNav } from './EquipaVista'
import { CORES_TECNICOS, type TecnicoDistrito } from './MapaTecnicos'
import { requireRoles } from '@/lib/requireRole'

export default async function EquipaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  await requireRoles(['admin', 'escritorio'])
  const params = await searchParams
  const data = params.data ?? new Date().toISOString().split('T')[0]

  const supabase = await createClient()

  // Todos os técnicos ativos
  const { data: todosTecnicos } = await supabase
    .from('profiles')
    .select('id, nome, role')
    .eq('ativo', true)
    .in('role', ['tecnico', 'admin'])
    .order('nome')

  // Visitas do dia selecionado
  const { data: visitasDia } = await supabase
    .from('visitas')
    .select('id, estado, tecnico_id, lojas(nome, distrito), profiles(nome)')
    .eq('data_visita', data)
    .order('estado')

  // Construir dados por técnico
  const tecnicoMap: Record<string, TecnicoDistrito> = {}

  for (const v of visitasDia ?? []) {
    if (!v.tecnico_id) continue
    const tecNome = (v.profiles as any)?.nome ?? 'Desconhecido'
    const lojaNome = (v.lojas as any)?.nome ?? '—'
    const distrito = (v.lojas as any)?.distrito ?? null

    if (!tecnicoMap[v.tecnico_id]) {
      const idx = Object.keys(tecnicoMap).length
      tecnicoMap[v.tecnico_id] = {
        tecnico_id: v.tecnico_id,
        tecnico_nome: tecNome,
        cor: CORES_TECNICOS[idx % CORES_TECNICOS.length],
        distritos: [],
        visitas: [],
      }
    }

    tecnicoMap[v.tecnico_id].visitas.push({
      loja_nome: lojaNome,
      distrito,
      estado: v.estado,
    })

    if (distrito && !tecnicoMap[v.tecnico_id].distritos.includes(distrito)) {
      tecnicoMap[v.tecnico_id].distritos.push(distrito)
    }
  }

  const tecnicosComVisitas = Object.values(tecnicoMap)
  const idsComVisitas = new Set(tecnicosComVisitas.map(t => t.tecnico_id))

  const tecnicosSemVisitas = (todosTecnicos ?? [])
    .filter(t => !idsComVisitas.has(t.id))
    .map(t => ({ id: t.id, nome: t.nome }))

  const totalVisitas = tecnicosComVisitas.reduce((acc, t) => acc + t.visitas.length, 0)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipa</h1>
          <p className="text-gray-500 text-sm mt-1">
            {tecnicosComVisitas.length} técnico{tecnicosComVisitas.length !== 1 ? 's' : ''} em campo
            {totalVisitas > 0 && ` · ${totalVisitas} visita${totalVisitas !== 1 ? 's' : ''}`}
          </p>
        </div>
        <EquipaNav data={data} />
      </div>

      <EquipaVista
        data={data}
        tecnicos={tecnicosComVisitas}
        tecnicosSemVisitas={tecnicosSemVisitas}
      />
    </div>
  )
}
