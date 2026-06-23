'use client'
import dynamic from 'next/dynamic'

const NovoTemplateForm = dynamic(() => import('./NovoTemplateForm'), { ssr: false })

export default function NovoTemplateFormClient() {
  return <NovoTemplateForm />
}
