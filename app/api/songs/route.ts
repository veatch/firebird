import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { SpotifyClient } from '@/lib/spotify'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { songsByYear } = body

    if (!songsByYear || !Array.isArray(songsByYear)) {
      return NextResponse.json({ error: 'Invalid songs data' }, { status: 400 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { spotifyId: session.user?.id as string }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const spotify = new SpotifyClient(session.accessToken as string)
    const savedSongs = []

    // Process each year's songs
    for (const { year, songUrls } of songsByYear) {
      if (!songUrls.trim()) continue

      // Split songUrls by newlines and spaces to get individual URLs
      const individualUrls = songUrls
        .split(/[\n\s]+/) // Split by newlines and/or spaces
        .map((url: string) => url.trim()) // Trim whitespace from each URL
        .filter((url: string) => url.length > 0) // Remove empty strings
      if (individualUrls.length === 0) continue

      // Fetch track information from Spotify
      const tracks = await spotify.getTracksFromUrls(individualUrls)
      
      // Save each track to database
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i]
        
        try {
          const savedSong = await prisma.songByYear.upsert({
            where: {
              userId_year_spotifyTrackId: {
                userId: user.id,
                year: year,
                spotifyTrackId: track.id
              }
            },
            update: {
              trackName: track.name,
              artistName: track.artists[0]?.name || 'Unknown Artist',
              albumName: track.album.name,
              albumImageUrl: track.album.images[0]?.url,
              position: i + 1,
              addedAt: new Date()
            },
            create: {
              userId: user.id,
              year: year,
              spotifyTrackId: track.id,
              trackName: track.name,
              artistName: track.artists[0]?.name || 'Unknown Artist',
              albumName: track.album.name,
              albumImageUrl: track.album.images[0]?.url,
              position: i + 1
            }
          })
          
          savedSongs.push(savedSong)
        } catch (error) {
          console.error(`Failed to save track ${track.id}:`, error)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully saved ${savedSongs.length} songs`,
      savedCount: savedSongs.length
    })

  } catch (error) {
    console.error('Error saving songs:', error)
    return NextResponse.json(
      { error: 'Failed to save songs' },
      { status: 500 }
    )
  }
} 