import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Signum — Inspeções Elétricas',
  description: 'Gestão de inspeções e relatórios técnicos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className="h-full" suppressHydrationWarning>
      <body className={`${geist.className} h-full bg-gray-50 text-gray-900`}>{children}</body>
    </html>
  )
}
