import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { SpotifyClient } from '@/lib/spotify'
import { analyzePlaylists, analyzeSongsByYear } from '@/lib/analysis'

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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    
    // Check if this is a songs by year analysis request
    if (body.songsByYear && Array.isArray(body.songsByYear)) {
      const spotify = new SpotifyClient(session.accessToken as string)
      const analysis = await analyzeSongsByYear(spotify, body.songsByYear)
      return NextResponse.json({ analysis })
    }
    
    // Legacy playlist analysis (keeping for backward compatibility)
    const { playlistIds } = body
    if (!Array.isArray(playlistIds) || playlistIds.length === 0) {
      return NextResponse.json({ error: 'No playlist IDs provided' }, { status: 400 })
    }
    const spotify = new SpotifyClient(session.accessToken as string)
    // Fetch playlist metadata and tracks for each ID
    const playlists = await Promise.all(
      playlistIds.map((id: string) => spotify.getPlaylistMetadata(id))
    )
    // Analyze these playlists
    const analysis = await analyzePlaylists(spotify, playlists)
    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Error analyzing playlists (POST):', error)
    return NextResponse.json(
      { error: 'Failed to analyze playlists' },
      { status: 500 }
    )
  }
} 