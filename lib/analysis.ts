import { SpotifyClient, Playlist, Track } from './spotify'

export interface SongAppearance {
  trackId: string
  trackName: string
  artistName: string
  year: number
  rank: number
  albumImage?: string
}

export interface SongAnalysis {
  trackId: string
  trackName: string
  artistName: string
  popularityScore: number
  yearsAppeared: number[]
  averageRank: number
  totalAppearances: number
  albumImage?: string
}

export async function analyzePlaylists(
  spotify: SpotifyClient,
  playlists: Playlist[]
): Promise<SongAnalysis[]> {
  const songAppearances: SongAppearance[] = []
  
  // Extract year from playlist name and fetch tracks
  for (const playlist of playlists) {
    const year = extractYearFromPlaylistName(playlist.name)
    if (!year) continue
    
    const tracks = await spotify.getPlaylistTracks(playlist.id)
    
    tracks.forEach((track, index) => {
      songAppearances.push({
        trackId: track.id,
        trackName: track.name,
        artistName: track.artists[0]?.name || 'Unknown Artist',
        year,
        rank: index + 1,
        albumImage: track.album.images[0]?.url
      })
    })
  }
  
  // Group by track and calculate scores
  const trackGroups = groupByTrack(songAppearances)
  const analysis: SongAnalysis[] = []
  
  for (const [trackId, appearances] of Array.from(trackGroups.entries())) {
    const analysisItem = calculateSongAnalysis(trackId, appearances)
    analysis.push(analysisItem)
  }
  
  // Sort by popularity score (descending)
  return analysis.sort((a, b) => b.popularityScore - a.popularityScore)
}

export async function analyzeSongsByYear(
  spotify: SpotifyClient,
  songsByYear: { year: number; songUrls: string }[]
): Promise<SongAnalysis[]> {
  const songAppearances: SongAppearance[] = []
  
  for (const { year, songUrls } of songsByYear) {
    const tracks = await spotify.getTracksFromUrls(songUrls)
    
    tracks.forEach((track, index) => {
      songAppearances.push({
        trackId: track.id,
        trackName: track.name,
        artistName: track.artists[0]?.name || 'Unknown Artist',
        year,
        rank: index + 1,
        albumImage: track.album.images[0]?.url
      })
    })
  }
  
  // Group by track and calculate scores
  const trackGroups = groupByTrack(songAppearances)
  const analysis: SongAnalysis[] = []
  
  for (const [trackId, appearances] of Array.from(trackGroups.entries())) {
    const analysisItem = calculateSongAnalysis(trackId, appearances)
    analysis.push(analysisItem)
  }
  
  // Sort by popularity score (descending)
  return analysis.sort((a, b) => b.popularityScore - a.popularityScore)
}

function extractYearFromPlaylistName(name: string): number | null {
  const yearMatch = name.match(/\d{4}/)
  return yearMatch ? parseInt(yearMatch[0]) : null
}

function groupByTrack(appearances: SongAppearance[]): Map<string, SongAppearance[]> {
  const groups = new Map<string, SongAppearance[]>()
  
  for (const appearance of appearances) {
    if (!groups.has(appearance.trackId)) {
      groups.set(appearance.trackId, [])
    }
    groups.get(appearance.trackId)!.push(appearance)
  }
  
  return groups
}

function calculateSongAnalysis(
  trackId: string,
  appearances: SongAppearance[]
): SongAnalysis {
  const yearsAppeared = appearances.map(a => a.year).sort()
  const averageRank = appearances.reduce((sum, a) => sum + a.rank, 0) / appearances.length
  
  // Popularity score calculation
  // Weight 1: Number of years appeared (higher = better)
  // Weight 2: Sum of (max_rank - rank_in_year) (higher = better)
  const maxRank = Math.max(...appearances.map(a => a.rank))
  const rankScore = appearances.reduce((sum, a) => sum + (maxRank - a.rank), 0)
  
  const weight1 = 100 // Weight for years appeared
  const weight2 = 1   // Weight for rank score
  
  const popularityScore = (appearances.length * weight1) + (rankScore * weight2)
  
  return {
    trackId,
    trackName: appearances[0].trackName,
    artistName: appearances[0].artistName,
    popularityScore,
    yearsAppeared,
    averageRank,
    totalAppearances: appearances.length,
    albumImage: appearances[0].albumImage
  }
} 