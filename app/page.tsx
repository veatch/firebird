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
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600">
      <Header />
      
      <main className="container-mobile sm:container-tablet lg:container-desktop py-12">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white">
              Firebird Songs
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 max-w-2xl mx-auto">
              Discover your most popular songs across years and analyze your listening patterns
            </p>
          </div>
          
          <div className="space-y-6">
            <LoginButton />
            
            <div className="text-white/80 text-sm sm:text-base">
              <p>Connect with Spotify to get started</p>
            </div>
          </div>
          
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-white/90">
            <div className="text-center space-y-2">
              <div className="text-3xl">🎵</div>
              <h3 className="font-semibold">Find Your Hits</h3>
              <p className="text-sm">Discover which songs appear in multiple years</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl">📊</div>
              <h3 className="font-semibold">Smart Analysis</h3>
              <p className="text-sm">Advanced scoring based on frequency and ranking</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl">📱</div>
              <h3 className="font-semibold">Mobile First</h3>
              <p className="text-sm">Optimized for your phone and tablet</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 