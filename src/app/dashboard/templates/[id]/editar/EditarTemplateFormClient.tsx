'use client'
import dynamic from 'next/dynamic'
import type { Campo } from '@/lib/types'

const EditarTemplateForm = dynamic(() => import('./EditarTemplateForm'), { ssr: false })

export default function EditarTemplateFormClient(props: { template: any; secoesIniciais: any[]; todosCampos: Campo[] }) {
  return <EditarTemplateForm {...props} />
}
