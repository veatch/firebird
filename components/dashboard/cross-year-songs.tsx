'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Music, Calendar } from 'lucide-react'

interface CrossYearSong {
  spotify_track_id: string
  track_name: string
  artist_name: string
  album_name: string
  years_appeared: number
  years_list: number[]
  average_position: number
  best_position: number
  worst_position: number
  total_appearances: number
}

interface CrossYearSongsResponse {
  songs: CrossYearSong[]
  total: number
  error?: string
}

export function CrossYearSongs() {
  const [songs, setSongs] = useState<CrossYearSong[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCrossYearSongs()
  }, [])

  const fetchCrossYearSongs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/songs/cross-year')
      const data: CrossYearSongsResponse = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch cross-year songs')
      }
      
      setSongs(data.songs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading your cross-year songs...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-destructive">
            <p>Error: {error}</p>
            <button 
              onClick={fetchCrossYearSongs}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (songs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No cross-year songs found</p>
            <p className="text-sm">
              Songs that appear in multiple years will show up here. 
              Try adding songs from different years first.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Songs Across Multiple Years</h2>
          <p className="text-muted-foreground">
            These songs appeared in your top songs across multiple years, showing your consistent favorites.
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {songs.length} songs found
        </Badge>
      </div>

      <div className="grid gap-4">
        {songs.map((song, index) => (
          <Card key={song.spotify_track_id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {song.years_appeared} year{song.years_appeared > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <h3 className="text-lg font-semibold truncate" title={song.track_name}>
                    {song.track_name}
                  </h3>
                  
                  <p className="text-muted-foreground truncate" title={song.artist_name}>
                    {song.artist_name}
                  </p>
                  
                  <p className="text-sm text-muted-foreground truncate" title={song.album_name}>
                    {song.album_name}
                  </p>
                </div>
                
                <div className="flex flex-col items-end gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{song.years_list.join(', ')}</span>
                  </div>
                  
                  <div className="text-xs space-y-1">
                    <div>Best: #{song.best_position}</div>
                    <div>Worst: #{song.worst_position}</div>
                    <div>Avg: #{Math.round(song.average_position)}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 