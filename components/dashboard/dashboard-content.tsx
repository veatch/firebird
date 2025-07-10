'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { SongsByYearInput } from './songs-by-year-input'

export function DashboardContent() {
  const { data: session } = useSession()

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

      <SongsByYearInput />
    </div>
  )
} 