'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setErro('Email ou palavra-passe incorretos.')
      setCarregando(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f8f8f8' }}>
      {/* Painel esquerdo — vermelho */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12" style={{ backgroundColor: '#D41317' }}>
        <div className="max-w-sm text-center">
          {/* Logo S */}
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
            <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none">
              <path
                d="M17 5H7a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h8a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H6"
                stroke="white" strokeWidth="2.2" strokeLinecap="round"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Signum</h1>
          <p className="text-white/80 text-lg mb-1">Energia + segurança</p>
          <p className="text-white/50 text-sm">www.signum.pt</p>

          <div className="mt-12 space-y-3 text-left">
            {[
              'Gestão de inspeções elétricas',
              'Relatórios digitais por entidade',
              'Acesso em qualquer dispositivo',
            ].map((txt) => (
              <div key={txt} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-white/80 text-sm">{txt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#D41317' }}>
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                <path d="M17 5H7a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h8a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H6" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="font-bold" style={{ color: '#D41317' }}>Signum</p>
              <p className="text-xs text-gray-400">Energia + segurança</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Bem-vindo</h2>
          <p className="text-gray-500 text-sm mb-8">Inicie sessão para continuar</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-shadow"
                style={{ '--tw-ring-color': '#D41317' } as React.CSSProperties}
                placeholder="email@signum.pt"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Palavra-passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {erro && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{erro}</p>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full text-white py-2.5 px-4 rounded-lg text-sm font-semibold disabled:opacity-50 transition-opacity mt-2"
              style={{ backgroundColor: '#D41317' }}
            >
              {carregando ? 'A entrar...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            Acesso restrito. Contacte o administrador para obter credenciais.
          </p>
        </div>
      </div>
    </div>
  )
}
