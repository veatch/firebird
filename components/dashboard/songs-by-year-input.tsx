'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Plus, Trash2, Save } from 'lucide-react'

interface YearInput {
  id: string
  year: number
  songUrls: string
}

export function SongsByYearInput() {
  const [yearInputs, setYearInputs] = useState<YearInput[]>([
    { id: '1', year: new Date().getFullYear(), songUrls: '' }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const addYearInput = () => {
    const newId = (yearInputs.length + 1).toString()
    setYearInputs([
      ...yearInputs,
      { id: newId, year: new Date().getFullYear(), songUrls: '' }
    ])
  }

  const removeYearInput = (id: string) => {
    if (yearInputs.length > 1) {
      setYearInputs(yearInputs.filter(input => input.id !== id))
    }
  }

  const updateYearInput = (id: string, field: keyof YearInput, value: string | number) => {
    setYearInputs(yearInputs.map(input => 
      input.id === id ? { ...input, [field]: value } : input
    ))
  }

  const saveSongs = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    // Filter out empty inputs
    const validInputs = yearInputs.filter(input => input.songUrls.trim())
    
    if (validInputs.length === 0) {
      setError('Please paste song URLs for at least one year.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          songsByYear: validInputs.map(input => ({
            year: input.year,
            songUrls: input.songUrls
          }))
        }),
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save songs')
      }
      
      setSuccess(data.message || `Successfully saved ${data.savedCount} songs!`)
      
      // Clear the form after successful save
      setYearInputs([{ id: '1', year: new Date().getFullYear(), songUrls: '' }])
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Save Your Songs by Year</h2>
          <p className="text-muted-foreground">
            Enter a year and paste Spotify song URLs below. Add multiple years to save your favorite songs across different years.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Song Inputs by Year</span>
            <Button
              variant="outline"
              size="sm"
              onClick={addYearInput}
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Year
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {yearInputs.map((input, index) => (
            <div key={input.id} className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <label htmlFor={`year-${input.id}`} className="text-sm font-medium">
                  Year {index + 1}
                </label>
                {yearInputs.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeYearInput(input.id)}
                    disabled={loading}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`year-${input.id}`} className="text-sm font-medium">Year</label>
                  <input
                    id={`year-${input.id}`}
                    type="number"
                    value={input.year}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateYearInput(input.id, 'year', parseInt(e.target.value) || new Date().getFullYear())}
                    disabled={loading}
                    min="1900"
                    max="2100"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor={`urls-${input.id}`} className="text-sm font-medium">Spotify Song URLs</label>
                <textarea
                  id={`urls-${input.id}`}
                  placeholder="Paste Spotify song URLs here, one per line or separated by spaces..."
                  value={input.songUrls}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateYearInput(input.id, 'songUrls', e.target.value)}
                  disabled={loading}
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Example: https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh
                </p>
              </div>
            </div>
          ))}
          
          <Button 
            onClick={saveSongs} 
            disabled={loading} 
            className="w-full"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Songs
          </Button>
          
          {error && <div className="text-destructive text-sm text-center">{error}</div>}
          {success && <div className="text-green-600 text-sm text-center">{success}</div>}
        </CardContent>
      </Card>
    </div>
  )
} 