import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

// Convert BigInt values to Number for JSON serialization
function convertBigInts(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertBigInts)
  } else if (obj && typeof obj === 'object') {
    const res: any = {}
    for (const key in obj) {
      const value = obj[key]
      res[key] = typeof value === 'bigint' ? Number(value) : convertBigInts(value)
    }
    return res
  }
  return obj
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { spotifyId: session.user?.id as string }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Query songs that appear in multiple years
    const crossYearSongs = await prisma.$queryRaw`
      SELECT 
        sby.spotify_track_id,
        sby.track_name,
        sby.artist_name,
        sby.album_name,
        COUNT(DISTINCT sby.year) as years_appeared,
        ARRAY_AGG(DISTINCT sby.year ORDER BY sby.year) as years_list,
        AVG(sby.position) as average_position,
        MIN(sby.position) as best_position,
        MAX(sby.position) as worst_position,
        COUNT(*) as total_appearances
      FROM songs_by_year sby
      WHERE sby.user_id = ${user.id}
      GROUP BY sby.spotify_track_id, sby.track_name, sby.artist_name, sby.album_name
      HAVING COUNT(DISTINCT sby.year) > 1
      ORDER BY years_appeared DESC, average_position ASC
    `

    return NextResponse.json({ 
      songs: convertBigInts(crossYearSongs),
      total: Array.isArray(crossYearSongs) ? crossYearSongs.length : 0
    })

  } catch (error) {
    console.error('Error fetching cross-year songs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cross-year songs' }, 
      { status: 500 }
    )
  }
} 