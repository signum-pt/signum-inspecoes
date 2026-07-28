import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: config }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('configuracoes').select('chave, valor').eq('chave', 'nextbitt_ativo').single(),
  ])

  const nextbittAtivo = config?.valor === 'true'

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar profile={profile} nextbittAtivo={nextbittAtivo} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

