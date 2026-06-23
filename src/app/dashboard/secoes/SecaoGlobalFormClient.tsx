'use client'
import dynamic from 'next/dynamic'
import type { Campo } from '@/lib/types'

const SecaoGlobalForm = dynamic(() => import('./SecaoGlobalForm'), { ssr: false })

export default function SecaoGlobalFormClient(props: { campos: Campo[]; secao?: any }) {
  return <SecaoGlobalForm {...props} />
}
