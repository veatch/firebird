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

    // Get threshold from query parameters
    const { searchParams } = new URL(request.url)
    const threshold = parseInt(searchParams.get('threshold') || '50')
    const maxThreshold = Math.max(1, Math.min(100, threshold)) // Clamp between 1 and 100

    // Parse minYear and maxYear from query params
    const minYearParam = searchParams.get('minYear')
    const maxYearParam = searchParams.get('maxYear')
    const minYear = minYearParam ? parseInt(minYearParam) : null
    const maxYear = maxYearParam ? parseInt(maxYearParam) : null

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { spotifyId: session.user?.id as string }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Build dynamic WHERE clause and parameters
    let whereClauses = [
      `sby.user_id = $1`,
      `sby.position <= $2`
    ]
    let params: any[] = [user.id, maxThreshold]
    let paramIndex = 3
    if (minYear !== null) {
      whereClauses.push(`sby.year >= $${paramIndex}`)
      params.push(minYear)
      paramIndex++
    }
    if (maxYear !== null) {
      whereClauses.push(`sby.year <= $${paramIndex}`)
      params.push(maxYear)
      paramIndex++
    }
    const whereSql = whereClauses.join(' AND ')
    const query = `
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
      WHERE ${whereSql}
      GROUP BY sby.spotify_track_id, sby.track_name, sby.artist_name, sby.album_name
      HAVING COUNT(DISTINCT sby.year) > 1
      ORDER BY years_appeared DESC, average_position ASC
    `
    const crossYearSongs = await prisma.$queryRawUnsafe(query, ...params)

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