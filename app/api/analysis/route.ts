import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { SpotifyClient } from '@/lib/spotify'
import { analyzePlaylists } from '@/lib/analysis'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const spotify = new SpotifyClient(session.accessToken as string)
    const playlists = await spotify.getUserPlaylists()
    const topSongsPlaylists = spotify.identifyTopSongsPlaylists(playlists)
    
    if (topSongsPlaylists.length === 0) {
      return NextResponse.json({ 
        error: 'No "Your Top Songs" playlists found' 
      }, { status: 404 })
    }

    const analysis = await analyzePlaylists(spotify, topSongsPlaylists)
    
    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Error analyzing playlists:', error)
    return NextResponse.json(
      { error: 'Failed to analyze playlists' },
      { status: 500 }
    )
  }
} 