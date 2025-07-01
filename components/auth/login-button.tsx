'use client'

import { signIn, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Music } from 'lucide-react'

export function LoginButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <Button disabled className="w-full sm:w-auto">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
        Loading...
      </Button>
    )
  }

  if (session) {
    return null
  }

  return (
    <Button
      onClick={() => signIn('spotify')}
      className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-8 rounded-full text-lg shadow-lg transform transition-all hover:scale-105"
    >
      <Music className="mr-2 h-5 w-5" />
      Connect with Spotify
    </Button>
  )
} 