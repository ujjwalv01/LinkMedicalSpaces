import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import ProfileClient from '../../owner/profile/ProfileClient'
import { redirect } from 'next/navigation'

export default async function SeekerProfilePage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  if (!userId) redirect('/signin')

  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) redirect('/signin')

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          My Profile
        </h1>
        <p className="text-slate-500 mt-1">Manage your personal information and contact details.</p>
      </div>

      <ProfileClient user={user} />
    </div>
  )
}
