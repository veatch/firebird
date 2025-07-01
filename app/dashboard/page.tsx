import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { Header } from '@/components/layout/header'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-mobile sm:container-tablet lg:container-desktop py-8">
        <DashboardContent />
      </main>
    </div>
  )
} 