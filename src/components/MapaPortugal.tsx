'use client'

import { useEffect, useState } from 'react'

export interface DistritoContagem {
  distrito: string
  total: number
  visitas: number
}

const TOPO_URL = 'https://cdn.jsdelivr.net/npm/datamaps@0.5.10/src/js/data/prt.topo.json'

export const ID_TO_NOME: Record<string, string> = {
  'PT.AV': 'Aveiro',
  'PT.BE': 'Beja',
  'PT.BR': 'Braga',
  'PT.BA': 'Bragança',
  'PT.CB': 'Castelo Branco',
  'PT.CO': 'Coimbra',
  'PT.EV': 'Évora',
  'PT.FA': 'Faro',
  'PT.GU': 'Guarda',
  'PT.LE': 'Leiria',
  'PT.LI': 'Lisboa',
  'PT.PA': 'Portalegre',
  'PT.PO': 'Porto',
  'PT.SA': 'Santarém',
  'PT.SE': 'Setúbal',
  'PT.VC': 'Viana do Castelo',
  'PT.VR': 'Vila Real',
  'PT.VI': 'Viseu',
}

const MAINLAND_IDS = new Set(Object.keys(ID_TO_NOME))

function getCor(total: number): string {
  if (total === 0) return '#f1f5f9'
  if (total <= 2) return '#fecaca'
  if (total <= 5) return '#f87171'
  if (total <= 10) return '#ef4444'
  return '#D41317'
}

interface DistrictPath {
  id: string
  nome: string
  path: string
}

interface Props {
  dados: DistritoContagem[]
  selectedId?: string | null
  onDistritoClick?: (id: string, nome: string) => void
}

export default function MapaPortugal({ dados, selectedId, onDistritoClick }: Props) {
  const [paths, setPaths] = useState<DistrictPath[]>([])
  const [hovered, setHovered] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const mapaIndex: Record<string, DistritoContagem> = {}
  for (const d of dados) mapaIndex[d.distrito] = d

  useEffect(() => {
    async function loadMap() {
      const [{ geoMercator, geoPath, geoCentroid }, { feature }, topo] = await Promise.all([
        import('d3-geo'),
        import('topojson-client'),
        fetch(TOPO_URL).then(r => r.json()),
      ])

      const all = (feature(topo as any, (topo as any).objects.prt) as any).features
      const mainland = all.filter((f: any) => MAINLAND_IDS.has(f.id))

      const collection = { type: 'FeatureCollection' as const, features: mainland }
      const projection = geoMercator().fitSize([200, 340], collection)
      const pathGen = geoPath(projection)

      const computed: DistrictPath[] = mainland.map((f: any) => ({
        id: f.id,
        nome: ID_TO_NOME[f.id] ?? f.id,
        path: pathGen(f) ?? '',
      }))

      setPaths(computed)
    }

    loadMap().catch(console.error)
  }, [])

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const hoveredNome = hovered ? ID_TO_NOME[hovered] : null
  const hoveredData = hoveredNome ? mapaIndex[hoveredNome] : null

  return (
    <div className="relative select-none">
      {paths.length === 0 ? (
        <div className="w-full aspect-[200/340] rounded-lg bg-gray-50 animate-pulse" />
      ) : (
        <svg
          viewBox="0 0 200 340"
          className="w-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHovered(null)}
        >
          {paths.map((d) => {
            const total = mapaIndex[d.nome]?.total ?? 0
            const isHovered = hovered === d.id
            const isSelected = selectedId === d.id
            return (
              <path
                key={d.id}
                d={d.path}
                fill={getCor(total)}
                stroke={isSelected ? '#1e40af' : 'white'}
                strokeWidth={isSelected ? 1.8 : isHovered ? 1.2 : 0.6}
                strokeLinejoin="round"
                style={{
                  cursor: 'pointer',
                  transition: 'fill 0.15s, opacity 0.15s',
                  opacity: (hovered || selectedId) && !isHovered && !isSelected ? 0.55 : 1,
                  filter: isHovered && !isSelected ? 'brightness(0.85)' : 'none',
                }}
                onMouseEnter={() => setHovered(d.id)}
                onClick={() => onDistritoClick?.(d.id, d.nome)}
              />
            )
          })}
        </svg>
      )}

      {hovered && hoveredNome && (
        <div
          className="absolute pointer-events-none z-10 bg-gray-900 text-white text-xs rounded-lg px-3 py-2"
          style={{
            left: tooltipPos.x + 10,
            top: tooltipPos.y - 44,
            transform: tooltipPos.x > 140 ? 'translateX(-100%)' : undefined,
            whiteSpace: 'nowrap',
          }}
        >
          <p className="font-semibold">{hoveredNome}</p>
          <p className="text-gray-300 mt-0.5">
            {hoveredData?.total ?? 0} loja{(hoveredData?.total ?? 0) !== 1 ? 's' : ''}
            {(hoveredData?.visitas ?? 0) > 0 && (
              <> · {hoveredData!.visitas} visita{hoveredData!.visitas !== 1 ? 's' : ''}</>
            )}
          </p>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {[
          { cor: '#f1f5f9', label: '0' },
          { cor: '#fecaca', label: '1–2' },
          { cor: '#f87171', label: '3–5' },
          { cor: '#ef4444', label: '6–10' },
          { cor: '#D41317', label: '11+' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-sm border border-gray-200 flex-shrink-0"
              style={{ backgroundColor: item.cor }}
            />
            <span className="text-xs text-gray-400">{item.label}</span>
          </div>
        ))}
        <span className="text-xs text-gray-300 ml-1">lojas</span>
      </div>
    </div>
  )
}
