'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Save, Building2, Upload, Check, Plug } from 'lucide-react'

const CAMPOS_CONFIG = [
  { chave: 'empresa_nome',     label: 'Nome da empresa',  placeholder: 'Signum' },
  { chave: 'empresa_morada',   label: 'Morada',           placeholder: 'Rua da Misericórdia 25 - 3460-557 Tondela' },
  { chave: 'empresa_telefone', label: 'Telefone',         placeholder: '232 096 437' },
  { chave: 'empresa_email',    label: 'Email',            placeholder: 'geral@signum.pt' },
  { chave: 'empresa_website',  label: 'Website',          placeholder: 'www.signum.pt' },
]

const LOGOS_CONFIG = [
  { chave: 'logo_signum',        label: 'Logo Signum',      fallback: '/logos/signum.png' },
  { chave: 'logo_iso14001',      label: 'ISO 14001',        fallback: '/logos/iso14001.png' },
  { chave: 'logo_iso9001',       label: 'ISO 9001',         fallback: '/logos/iso9001.png' },
  { chave: 'logo_pme_excelencia', label: 'PME Excelência',  fallback: '/logos/pme-excelencia.png' },
  { chave: 'logo_pme_lider',     label: 'PME Líder',        fallback: '/logos/pme-lider.png' },
]

export default function ConfiguracoesForm() {
  const router = useRouter()
  const [valores, setValores] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const [nextbittAtivo, setNextbittAtivo] = useState(false)
  const [guardandoToggle, setGuardandoToggle] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('configuracoes').select('chave, valor').then(({ data }) => {
      const map: Record<string, string> = {}
      data?.forEach((r: any) => { map[r.chave] = r.valor })
      setValores(map)
      setNextbittAtivo(map['nextbitt_ativo'] === 'true')
      setCarregando(false)
    })
  }, [])

  async function handleToggleNextbitt(valor: boolean) {
    setGuardandoToggle(true)
    setNextbittAtivo(valor)
    const supabase = createClient()
    await supabase.from('configuracoes').upsert(
      { chave: 'nextbitt_ativo', valor: valor ? 'true' : 'false' },
      { onConflict: 'chave' }
    )
    setGuardandoToggle(false)
    router.refresh()
  }

  async function handleGuardar() {
    setGuardando(true)
    const supabase = createClient()
    for (const [chave, valor] of Object.entries(valores)) {
      await supabase.from('configuracoes').upsert({ chave, valor }, { onConflict: 'chave' })
    }
    setGuardando(false)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 3000)
  }

  async function handleUploadLogo(chave: string, file: File) {
    setUploadingLogo(chave)
    const supabase = createClient()

    const ext = file.name.split('.').pop()
    const nomeStorage = `${chave}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(nomeStorage, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      alert('Erro ao fazer upload: ' + uploadError.message)
      setUploadingLogo(null)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(nomeStorage)

    await supabase.from('configuracoes').upsert({ chave, valor: publicUrl }, { onConflict: 'chave' })
    setValores(prev => ({ ...prev, [chave]: publicUrl }))
    setUploadingLogo(null)
  }

  function getLogoSrc(item: typeof LOGOS_CONFIG[0]) {
    return valores[item.chave] || item.fallback
  }

  if (carregando) return <div className="p-8 text-sm text-gray-400">A carregar...</div>

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 text-sm mt-1">Dados da empresa e logos que aparecem nos relatórios PDF</p>
      </div>

      {/* Dados da empresa */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 mb-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5" style={{ color: '#D41317' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Informação da empresa</p>
            <p className="text-xs text-gray-400">Aparece no rodapé de todos os relatórios</p>
          </div>
        </div>

        {CAMPOS_CONFIG.map(({ chave, label, placeholder }) => (
          <div key={chave}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              type="text"
              value={valores[chave] ?? ''}
              onChange={e => setValores(prev => ({ ...prev, [chave]: e.target.value }))}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317] focus:border-transparent"
            />
          </div>
        ))}

        <div className="pt-2 flex items-center gap-3">
          <button onClick={handleGuardar} disabled={guardando}
            className="flex items-center gap-2 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            style={{ backgroundColor: '#D41317' }}>
            <Save className="w-4 h-4" />
            {guardando ? 'A guardar...' : 'Guardar'}
          </button>
          {guardado && <span className="text-sm text-green-600 flex items-center gap-1"><Check className="w-4 h-4" /> Guardado</span>}
        </div>
      </div>

      {/* Integração Nextbitt */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-5">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <Plug className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Integração Nextbitt</p>
            <p className="text-xs text-gray-400">Ativa ou desativa todas as funcionalidades de exportação para o Nextbitt</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Exportação para Nextbitt</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {nextbittAtivo
                ? 'Ativo — botões e separadores Nextbitt visíveis'
                : 'Inativo — botões e separadores Nextbitt ocultados'}
            </p>
          </div>
          <button
            onClick={() => handleToggleNextbitt(!nextbittAtivo)}
            disabled={guardandoToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
              nextbittAtivo ? 'bg-blue-500' : 'bg-gray-200'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              nextbittAtivo ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Logos */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="pb-4 border-b border-gray-100 mb-5">
          <p className="text-sm font-semibold text-gray-900">Logos</p>
          <p className="text-xs text-gray-400 mt-0.5">Clique em cada logo para substituir. Formatos aceites: PNG, JPG, SVG</p>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {LOGOS_CONFIG.map((item) => (
            <div key={item.chave} className="flex flex-col items-center gap-2">
              <button
                onClick={() => inputRefs.current[item.chave]?.click()}
                disabled={uploadingLogo === item.chave}
                className="relative w-16 h-16 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center hover:border-[#D41317] hover:bg-red-50 transition-all group overflow-hidden"
                title={`Alterar ${item.label}`}
              >
                <img
                  src={getLogoSrc(item)}
                  alt={item.label}
                  className="w-12 h-12 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.2' }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                  {uploadingLogo === item.chave
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Upload className="w-4 h-4 text-white" />
                  }
                </div>
              </button>
              <span className="text-xs text-gray-400 text-center leading-tight">{item.label}</span>
              <input
                ref={el => { inputRefs.current[item.chave] = el }}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) handleUploadLogo(item.chave, file)
                  e.target.value = ''
                }}
              />
            </div>
          ))}
        </div>

        {Object.values(valores).some(v => v?.startsWith('http')) && (
          <p className="text-xs text-green-600 mt-4 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Logos personalizados activos
          </p>
        )}
      </div>
    </div>
  )
}
