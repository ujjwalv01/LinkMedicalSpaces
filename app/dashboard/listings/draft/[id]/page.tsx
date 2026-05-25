'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function DraftRedirectPage() {
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    const id = params.id
    if (id) {
      router.push(`/add-listing?draftId=${id}`)
    } else {
      router.push('/dashboard')
    }
  }, [params.id, router])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto" />
        <p className="text-slate-500 text-sm font-semibold">Resuming your listing draft...</p>
      </div>
    </div>
  )
}
