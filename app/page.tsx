import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { LoginButton } from '@/components/auth/login-button'
import { Header } from '@/components/layout/header'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500">
      <Header />
      
      <main className="container-mobile sm:container-tablet lg:container-desktop py-12">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white">
              Firebird Songs
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 max-w-2xl mx-auto">
              See the songs that kept coming back
            </p>
          </div>
          
          <div className="space-y-6">
            <LoginButton />
            
            <div className="text-white/80 text-sm sm:text-base">
              <p>Connect with Spotify to get started</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 