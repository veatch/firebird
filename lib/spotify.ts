import { SpotifyApi } from '@spotify/web-api-ts-sdk'

export interface Playlist {
  id: string
  name: string
  description: string
  images: Array<{ url: string; height: number; width: number }>
  tracks: {
    total: number
  }
}

export interface Track {
  id: string
  name: string
  artists: Array<{ id: string; name: string }>
  album: {
    id: string
    name: string
    images: Array<{ url: string; height: number; width: number }>
  }
}

export class SpotifyClient {
  private api: SpotifyApi

  constructor(accessToken: string) {
    this.api = SpotifyApi.withAccessToken('spotify', {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: ''
    })
  }

  async getUserPlaylists(): Promise<Playlist[]> {
    const response = await this.api.currentUser.playlists.playlists()
    return response.items.map(playlist => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description || '',
      images: playlist.images || [],
      tracks: {
        total: playlist.tracks?.total || 0
      }
    }))
  }

  identifyTopSongsPlaylists(playlists: Playlist[]): Playlist[] {
    const patterns = [
      /your top songs \d{4}/i,
      /top songs of \d{4}/i,
      /\d{4} top tracks/i,
      /wrapped \d{4}/i
    ]
    
    return playlists.filter(playlist => 
      patterns.some(pattern => pattern.test(playlist.name))
    )
  }

  async getPlaylistTracks(playlistId: string): Promise<Track[]> {
    const response = await this.api.playlists.getPlaylistItems(playlistId)
    return response.items.map(item => {
      const track = item.track as any
      return {
        id: track?.id || '',
        name: track?.name || '',
        artists: track?.artists?.map((artist: any) => ({
          id: artist.id,
          name: artist.name
        })) || [],
        album: {
          id: track?.album?.id || '',
          name: track?.album?.name || '',
          images: track?.album?.images || []
        }
      }
    }).filter(track => track.id)
  }
} 