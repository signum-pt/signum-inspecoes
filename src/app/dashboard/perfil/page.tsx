'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, User, Lock, Check, Eye, EyeOff, Link } from 'lucide-react'

export default function PerfilPage() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [carregando, setCarregando] = useState(true)

  const [nextbittEmpId, setNextbittEmpId] = useState('')
  const [guardandoNextbitt, setGuardandoNextbitt] = useState(false)
  const [guardadoNextbitt, setGuardadoNextbitt] = useState(false)
  const [erroNextbitt, setErroNextbitt] = useState('')

  const [guardandoNome, setGuardandoNome] = useState(false)
  const [guardadoNome, setGuardadoNome] = useState(false)
  const [erroNome, setErroNome] = useState('')

  const [passwordAtual, setPasswordAtual] = useState('')
  const [passwordNova, setPasswordNova] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [mostrarPasswords, setMostrarPasswords] = useState(false)
  const [guardandoPass, setGuardandoPass] = useState(false)
  const [guardadoPass, setGuardadoPass] = useState(false)
  const [erroPass, setErroPass] = useState('')

  const roleLabel: Record<string, string> = {
    admin: 'Administrador',
    tecnico: 'Técnico',
    escritorio: 'Escritório',
  }

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setEmail(user.email ?? '')
      supabase.from('profiles').select('nome, role, nextbitt_emp_id').eq('id', user.id).single().then(({ data }) => {
        if (data) { setNome(data.nome); setRole(data.role); setNextbittEmpId(data.nextbitt_emp_id ? String(data.nextbitt_emp_id) : '') }
        setCarregando(false)
      })
    })
  }, [])

  async function handleGuardarNome(e: React.FormEvent) {
    e.preventDefault()
    setErroNome('')
    setGuardandoNome(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('profiles').update({ nome }).eq('id', user!.id)
    setGuardandoNome(false)
    if (error) { setErroNome('Erro ao guardar.'); return }
    setGuardadoNome(true)
    setTimeout(() => setGuardadoNome(false), 3000)
  }

  async function handleGuardarNextbitt(e: React.FormEvent) {
    e.preventDefault()
    setErroNextbitt('')
    const empId = parseInt(nextbittEmpId)
    if (!nextbittEmpId || isNaN(empId)) { setErroNextbitt('Introduza um Nº Recurso válido.'); return }
    setGuardandoNextbitt(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('profiles').update({ nextbitt_emp_id: empId }).eq('id', user!.id)
    setGuardandoNextbitt(false)
    if (error) { setErroNextbitt('Erro ao guardar.'); return }
    setGuardadoNextbitt(true)
    setTimeout(() => setGuardadoNextbitt(false), 3000)
  }

  async function handleAlterarPassword(e: React.FormEvent) {
    e.preventDefault()
    setErroPass('')
    if (passwordNova.length < 6) { setErroPass('A nova palavra-passe deve ter pelo menos 6 caracteres.'); return }
    if (passwordNova !== passwordConfirm) { setErroPass('As palavras-passe não coincidem.'); return }
    setGuardandoPass(true)

    const supabase = createClient()

    // Verificar password actual fazendo re-login
    const { data: { user } } = await supabase.auth.getUser()
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email, password: passwordAtual,
    })
    if (loginError) {
      setErroPass('Palavra-passe atual incorreta.')
      setGuardandoPass(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: passwordNova })
    setGuardandoPass(false)
    if (error) { setErroPass('Erro ao alterar palavra-passe: ' + error.message); return }

    setPasswordAtual('')
    setPasswordNova('')
    setPasswordConfirm('')
    setGuardadoPass(true)
    setTimeout(() => setGuardadoPass(false), 3000)
  }

  if (carregando) return <div className="p-8 text-sm text-gray-400">A carregar...</div>

  return (
    <div className="p-8 max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">O meu perfil</h1>
        <p className="text-gray-500 text-sm mt-1">Gerir as suas informações e acesso</p>
      </div>

      {/* Info da conta */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: '#D41317' }}>
            {nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{nome}</p>
            <p className="text-xs text-gray-400">{email} · {roleLabel[role] ?? role}</p>
          </div>
        </div>

        <form onSubmit={handleGuardarNome} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="w-3.5 h-3.5 inline mr-1.5 text-gray-400" />
              Nome
            </label>
            <input
              type="text" value={nome} onChange={e => setNome(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
            <p className="text-xs text-gray-400 mt-1">O email não pode ser alterado aqui.</p>
          </div>

          {erroNome && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erroNome}</p>}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={guardandoNome}
              className="flex items-center gap-2 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              style={{ backgroundColor: '#D41317' }}>
              <Save className="w-4 h-4" />
              {guardandoNome ? 'A guardar...' : 'Guardar nome'}
            </button>
            {guardadoNome && <span className="text-sm text-green-600 flex items-center gap-1"><Check className="w-4 h-4" /> Guardado</span>}
          </div>
        </form>
      </div>

      {/* Integração Nextbitt */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <Link className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Integração Nextbitt</p>
            <p className="text-xs text-gray-400">Nº Recurso para preencher automaticamente o campo Recurso nas OTs</p>
          </div>
        </div>

        <form onSubmit={handleGuardarNextbitt} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nº Recurso Nextbitt</label>
            <input
              type="number" value={nextbittEmpId} onChange={e => setNextbittEmpId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317] focus:border-transparent"
              placeholder="Ex: 910830672"
            />
            <p className="text-xs text-gray-400 mt-1">Consulta o teu Nº Recurso no portal Nextbitt → Pesquisar Recurso.</p>
          </div>

          {erroNextbitt && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erroNextbitt}</p>}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={guardandoNextbitt}
              className="flex items-center gap-2 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              style={{ backgroundColor: '#D41317' }}>
              <Save className="w-4 h-4" />
              {guardandoNextbitt ? 'A guardar...' : 'Guardar'}
            </button>
            {guardadoNextbitt && <span className="text-sm text-green-600 flex items-center gap-1"><Check className="w-4 h-4" /> Guardado</span>}
          </div>
        </form>
      </div>

      {/* Alterar password */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
            <Lock className="w-5 h-5" style={{ color: '#D41317' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Palavra-passe</p>
            <p className="text-xs text-gray-400">Alterar a palavra-passe de acesso</p>
          </div>
        </div>

        <form onSubmit={handleAlterarPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Palavra-passe atual</label>
            <div className="relative">
              <input
                type={mostrarPasswords ? 'text' : 'password'}
                value={passwordAtual} onChange={e => setPasswordAtual(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317] focus:border-transparent pr-10"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setMostrarPasswords(!mostrarPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {mostrarPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nova palavra-passe</label>
            <input
              type={mostrarPasswords ? 'text' : 'password'}
              value={passwordNova} onChange={e => setPasswordNova(e.target.value)} required minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317] focus:border-transparent"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova palavra-passe</label>
            <input
              type={mostrarPasswords ? 'text' : 'password'}
              value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} required
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317] focus:border-transparent ${
                passwordConfirm && passwordNova !== passwordConfirm ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Repetir nova palavra-passe"
            />
            {passwordConfirm && passwordNova !== passwordConfirm && (
              <p className="text-xs text-red-500 mt-1">As palavras-passe não coincidem.</p>
            )}
          </div>

          {erroPass && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erroPass}</p>}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={guardandoPass || !passwordAtual || !passwordNova || passwordNova !== passwordConfirm}
              className="flex items-center gap-2 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              style={{ backgroundColor: '#D41317' }}>
              <Lock className="w-4 h-4" />
              {guardandoPass ? 'A alterar...' : 'Alterar palavra-passe'}
            </button>
            {guardadoPass && <span className="text-sm text-green-600 flex items-center gap-1"><Check className="w-4 h-4" /> Alterada com sucesso</span>}
          </div>
        </form>
      </div>
    </div>
  )
}
