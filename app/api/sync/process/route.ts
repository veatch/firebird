import { NextRequest, NextResponse } from 'next/server'
import { SpotifyClient } from '@/lib/spotify'

// This endpoint can be called by Vercel cron jobs or webhooks
export async function POST(request: NextRequest) {
  try {
    const { userId, accessToken } = await request.json()
    
    if (!userId || !accessToken) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Import Prisma client dynamically to avoid issues
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      // Update job status to processing
      await prisma.syncJob.updateMany({
        where: { userId },
        data: { 
          status: 'PROCESSING',
          progress: 0,
          updatedAt: new Date()
        }
      })

      const spotify = new SpotifyClient(accessToken)
      
      // Step 1: Fetch user playlists (10% progress)
      const playlists = await spotify.getUserPlaylists()
      await prisma.syncJob.updateMany({
        where: { userId },
        data: { progress: 10, updatedAt: new Date() }
      })

      // Step 2: Identify top songs playlists (20% progress)
      const topSongsPlaylists = spotify.identifyTopSongsPlaylists(playlists)
      await prisma.syncJob.updateMany({
        where: { userId },
        data: { progress: 20, updatedAt: new Date() }
      })

      if (topSongsPlaylists.length === 0) {
        await prisma.syncJob.updateMany({
          where: { userId },
          data: { 
            status: 'COMPLETED',
            progress: 100,
            completedAt: new Date(),
            updatedAt: new Date()
          }
        })
        return NextResponse.json({ message: 'No top songs playlists found' })
      }

      // Step 3: Process each playlist (30-90% progress)
      const progressPerPlaylist = 60 / topSongsPlaylists.length
      
      for (let i = 0; i < topSongsPlaylists.length; i++) {
        const playlist = topSongsPlaylists[i]
        const year = extractYearFromPlaylistName(playlist.name)
        
        if (!year) continue

        // Fetch tracks for this playlist
        const tracks = await spotify.getPlaylistTracks(playlist.id)
        
        // Store playlist data
        const playlistRecord = await prisma.playlist.upsert({
          where: { 
            userId_spotifyPlaylistId: {
              userId,
              spotifyPlaylistId: playlist.id
            }
          },
          update: {
            name: playlist.name,
            year,
            totalTracks: tracks.length,
            lastUpdated: new Date()
          },
          create: {
            userId,
            spotifyPlaylistId: playlist.id,
            name: playlist.name,
            year,
            totalTracks: tracks.length
          }
        })

        // Store track data
        for (let j = 0; j < tracks.length; j++) {
          const track = tracks[j]
          await prisma.playlistTrack.upsert({
            where: {
              playlistId_spotifyTrackId: {
                playlistId: playlistRecord.id,
                spotifyTrackId: track.id
              }
            },
            update: {
              trackName: track.name,
              artistName: track.artists[0]?.name || 'Unknown Artist',
              albumName: track.album.name,
              position: j + 1
            },
            create: {
              playlistId: playlistRecord.id,
              spotifyTrackId: track.id,
              trackName: track.name,
              artistName: track.artists[0]?.name || 'Unknown Artist',
              albumName: track.album.name,
              position: j + 1
            }
          })
        }

        // Update progress
        const currentProgress = 30 + (i + 1) * progressPerPlaylist
        await prisma.syncJob.updateMany({
          where: { userId },
          data: { 
            progress: Math.min(currentProgress, 90),
            updatedAt: new Date()
          }
        })

        // Rate limiting - wait between playlist requests
        if (i < topSongsPlaylists.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      // Step 4: Calculate song rankings (90-100% progress)
      await calculateSongRankings(prisma, userId)
      
      await prisma.syncJob.updateMany({
        where: { userId },
        data: { 
          status: 'COMPLETED',
          progress: 100,
          completedAt: new Date(),
          updatedAt: new Date()
        }
      })

      return NextResponse.json({ message: 'Sync completed successfully' })

    } finally {
      await prisma.$disconnect()
    }

  } catch (error) {
    console.error('Error processing sync:', error)
    
    // Try to update job status to failed
    try {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      
      const { userId } = await request.json()
      if (userId) {
        await prisma.syncJob.updateMany({
          where: { userId },
          data: { 
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'Unknown error',
            updatedAt: new Date()
          }
        })
      }
      
      await prisma.$disconnect()
    } catch (updateError) {
      console.error('Failed to update job status:', updateError)
    }

    return NextResponse.json(
      { error: 'Failed to process sync' },
      { status: 500 }
    )
  }
}

function extractYearFromPlaylistName(name: string): number | null {
  const yearMatch = name.match(/\b(20\d{2})\b/)
  return yearMatch ? parseInt(yearMatch[1]) : null
}

async function calculateSongRankings(prisma: any, userId: string) {
  // This would implement the song ranking calculation logic
  // Similar to what's in your design document
  // For now, just a placeholder
  console.log('Calculating song rankings for user:', userId)
} 