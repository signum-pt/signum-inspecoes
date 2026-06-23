'use client'

import { useEffect, useState } from 'react'

const TOPO_URL = 'https://cdn.jsdelivr.net/npm/datamaps@0.5.10/src/js/data/prt.topo.json'

const ID_TO_NOME: Record<string, string> = {
  'PT.AV': 'Aveiro', 'PT.BE': 'Beja', 'PT.BR': 'Braga', 'PT.BA': 'Bragança',
  'PT.CB': 'Castelo Branco', 'PT.CO': 'Coimbra', 'PT.EV': 'Évora', 'PT.FA': 'Faro',
  'PT.GU': 'Guarda', 'PT.LE': 'Leiria', 'PT.LI': 'Lisboa', 'PT.PA': 'Portalegre',
  'PT.PO': 'Porto', 'PT.SA': 'Santarém', 'PT.SE': 'Setúbal', 'PT.VC': 'Viana do Castelo',
  'PT.VR': 'Vila Real', 'PT.VI': 'Viseu',
}
const MAINLAND_IDS = new Set(Object.keys(ID_TO_NOME))

// Paleta de cores para técnicos
export const CORES_TECNICOS = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b',
  '#ec4899', '#06b6d4', '#f97316', '#6366f1',
]

export interface TecnicoDistrito {
  tecnico_id: string
  tecnico_nome: string
  cor: string
  distritos: string[]
  visitas: { loja_nome: string; distrito: string | null; estado: string }[]
}

interface DistrictPath { id: string; nome: string; path: string }

interface Props {
  tecnicos: TecnicoDistrito[]
  onDistritoHover?: (distrito: string | null) => void
}

export default function MapaTecnicos({ tecnicos, onDistritoHover }: Props) {
  const [paths, setPaths] = useState<DistrictPath[]>([])
  const [hovered, setHovered] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  // Mapa: distrito → técnicos lá presentes
  const distritoPorTecnico: Record<string, TecnicoDistrito[]> = {}
  for (const t of tecnicos) {
    for (const d of t.distritos) {
      if (!distritoPorTecnico[d]) distritoPorTecnico[d] = []
      distritoPorTecnico[d].push(t)
    }
  }

  useEffect(() => {
    async function loadMap() {
      const [{ geoMercator, geoPath }, { feature }, topo] = await Promise.all([
        import('d3-geo'),
        import('topojson-client'),
        fetch(TOPO_URL).then(r => r.json()),
      ])
      const all = (feature(topo as any, (topo as any).objects.prt) as any).features
      const mainland = all.filter((f: any) => MAINLAND_IDS.has(f.id))
      const collection = { type: 'FeatureCollection' as const, features: mainland }
      const projection = geoMercator().fitSize([200, 340], collection)
      const pathGen = geoPath(projection)
      setPaths(mainland.map((f: any) => ({
        id: f.id, nome: ID_TO_NOME[f.id] ?? f.id, path: pathGen(f) ?? '',
      })))
    }
    loadMap().catch(console.error)
  }, [])

  function getFill(nome: string): string {
    const ts = distritoPorTecnico[nome]
    if (!ts || ts.length === 0) return '#f1f5f9'
    if (ts.length === 1) return ts[0].cor + 'cc' // slight transparency
    return '#D41317cc' // vários técnicos = vermelho
  }

  function getStroke(nome: string): string {
    const ts = distritoPorTecnico[nome]
    if (!ts || ts.length === 0) return 'white'
    if (ts.length === 1) return ts[0].cor
    return '#D41317'
  }

  const hoveredNome = hovered ? ID_TO_NOME[hovered] : null
  const hoveredTecnicos = hoveredNome ? (distritoPorTecnico[hoveredNome] ?? []) : []

  return (
    <div className="relative select-none">
      {paths.length === 0 ? (
        <div className="w-full aspect-[200/340] rounded-lg bg-gray-50 animate-pulse" />
      ) : (
        <svg
          viewBox="0 0 200 340"
          className="w-full"
          onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect()
            setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
          }}
          onMouseLeave={() => { setHovered(null); onDistritoHover?.(null) }}
        >
          {paths.map(d => {
            const nome = d.nome
            const isHovered = hovered === d.id
            const temTecnicos = (distritoPorTecnico[nome]?.length ?? 0) > 0
            return (
              <path
                key={d.id}
                d={d.path}
                fill={getFill(nome)}
                stroke={isHovered ? getStroke(nome) : 'white'}
                strokeWidth={isHovered ? 1.8 : temTecnicos ? 1.2 : 0.6}
                strokeLinejoin="round"
                style={{
                  cursor: temTecnicos ? 'pointer' : 'default',
                  transition: 'fill 0.15s, opacity 0.15s',
                  opacity: hovered && !isHovered ? 0.7 : 1,
                  filter: isHovered && temTecnicos ? 'brightness(0.88)' : 'none',
                }}
                onMouseEnter={() => { setHovered(d.id); onDistritoHover?.(nome) }}
              />
            )
          })}
        </svg>
      )}

      {hovered && hoveredNome && hoveredTecnicos.length > 0 && (
        <div
          className="absolute pointer-events-none z-10 bg-gray-900 text-white text-xs rounded-lg px-3 py-2"
          style={{
            left: tooltipPos.x + 10,
            top: tooltipPos.y - 44,
            transform: tooltipPos.x > 140 ? 'translateX(-100%)' : undefined,
            whiteSpace: 'nowrap',
          }}
        >
          <p className="font-semibold mb-1">{hoveredNome}</p>
          {hoveredTecnicos.map(t => (
            <p key={t.tecnico_id} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.cor }} />
              {t.tecnico_nome}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
