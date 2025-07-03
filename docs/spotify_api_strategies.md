# Spotify API Querying & Data Storage Strategies

## Overview

After user login, there are several approaches for querying Spotify API and storing "Your Top Songs" playlist data. The choice depends on your requirements for user experience, scalability, and Vercel's serverless constraints.

## Option 1: Synchronous Web Process (Current Implementation)

### How It Works
- User triggers analysis via API endpoint
- Server fetches playlists and tracks in real-time
- Results returned immediately to user

### Pros
- ✅ Simple implementation
- ✅ Real-time results
- ✅ No additional infrastructure
- ✅ Works well for users with few playlists

### Cons
- ❌ Limited by Vercel's 10-second timeout (hobby plan)
- ❌ Can hit Spotify API rate limits (100 requests/minute)
- ❌ Poor UX for users with many playlists
- ❌ No progress indication
- ❌ Risk of timeouts on large datasets

### Best For
- MVP/prototype phase
- Users with 1-3 "Your Top Songs" playlists
- Simple use cases

## Option 2: Asynchronous Background Jobs (Recommended)

### Architecture
1. **User initiates sync** → Creates job record in database
2. **Background processor** → Fetches data and stores results
3. **Progress tracking** → User can check status via API
4. **Results display** → Show cached data when complete

### Implementation Options

#### A. Vercel Cron Jobs + Database State Management

**Setup:**
```bash
# vercel.json
{
  "crons": [
    {
      "path": "/api/cron/process-sync-jobs",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Pros:**
- ✅ No external dependencies
- ✅ Built into Vercel
- ✅ Cost-effective
- ✅ Good for batch processing

**Cons:**
- ❌ Limited to 5-minute intervals
- ❌ No real-time processing
- ❌ Vercel Pro required ($20/month)

#### B. Webhook-Based Processing

**Setup:**
```typescript
// app/api/sync/route.ts
export async function POST(request: NextRequest) {
  // Create sync job
  const job = await prisma.syncJob.create({...})
  
  // Trigger immediate processing
  await fetch('/api/sync/process', {
    method: 'POST',
    body: JSON.stringify({ userId, accessToken })
  })
  
  return NextResponse.json({ jobId: job.id })
}
```

**Pros:**
- ✅ Real-time processing
- ✅ Immediate user feedback
- ✅ Works on Vercel hobby plan
- ✅ No external dependencies

**Cons:**
- ❌ Still limited by function timeout
- ❌ Risk of cold starts
- ❌ No retry mechanism built-in

#### C. External Queue System (Production)

**Options:**
- **Upstash QStash**: Serverless message queue
- **Cloudflare Queues**: Global edge queue
- **Redis + Bull**: Traditional queue system

**Example with Upstash QStash:**
```typescript
import { Client } from '@upstash/qstash'

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!
})

export async function POST(request: NextRequest) {
  const job = await prisma.syncJob.create({...})
  
  // Queue the job
  await qstash.publishJSON({
    url: `${process.env.NEXTAUTH_URL}/api/sync/process`,
    body: { userId, accessToken }
  })
  
  return NextResponse.json({ jobId: job.id })
}
```

**Pros:**
- ✅ Reliable processing
- ✅ Automatic retries
- ✅ Scalable
- ✅ Real-time or batched

**Cons:**
- ❌ Additional cost ($5-20/month)
- ❌ External dependency
- ❌ More complex setup

## Option 3: Hybrid Approach (Best for Vercel)

### Strategy
1. **Small datasets** → Process synchronously
2. **Large datasets** → Queue for background processing
3. **Progress tracking** → Database state management

### Implementation

```typescript
// app/api/sync/route.ts
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const spotify = new SpotifyClient(session.accessToken)
  
  // Quick check of playlist count
  const playlists = await spotify.getUserPlaylists()
  const topSongsPlaylists = spotify.identifyTopSongsPlaylists(playlists)
  
  // Decision logic
  const totalTracks = topSongsPlaylists.reduce((sum, p) => sum + p.tracks.total, 0)
  const shouldProcessAsync = totalTracks > 100 || topSongsPlaylists.length > 3
  
  if (shouldProcessAsync) {
    // Queue for background processing
    return await queueBackgroundJob(session.user.id, session.accessToken)
  } else {
    // Process immediately
    return await processSynchronously(spotify, topSongsPlaylists)
  }
}
```

## Database Schema for Background Jobs

```prisma
model SyncJob {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  status      String   // PENDING, PROCESSING, COMPLETED, FAILED
  progress    Int      @default(0) // 0-100
  error       String?  // Error message if failed
  startedAt   DateTime @default(now()) @map("started_at")
  completedAt DateTime? @map("completed_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("sync_jobs")
}
```

## Rate Limiting Strategy

### Spotify API Limits
- **Rate limit**: 100 requests/minute per user
- **Playlist tracks**: ~50 tracks per request (pagination)
- **User playlists**: ~50 playlists per request

### Implementation
```typescript
class RateLimitedSpotifyClient {
  private requestCount = 0
  private lastReset = Date.now()
  
  async makeRequest(fn: () => Promise<any>) {
    // Check rate limit
    if (this.requestCount >= 95) { // Leave buffer
      const waitTime = 60000 - (Date.now() - this.lastReset)
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime))
        this.requestCount = 0
        this.lastReset = Date.now()
      }
    }
    
    this.requestCount++
    return await fn()
  }
}
```

## Caching Strategy

### Database Caching
- **Playlist metadata**: Cache for 24 hours
- **Track data**: Cache for 7 days
- **Analysis results**: Cache until next sync

### Implementation
```typescript
// Check if data is fresh
const isDataFresh = (lastUpdated: Date) => {
  const hoursSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60)
  return hoursSinceUpdate < 24
}

// Return cached data if fresh
if (isDataFresh(playlist.lastUpdated)) {
  return cachedAnalysis
}
```

## Progress Tracking

### Frontend Implementation
```typescript
function useSyncProgress() {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('idle')
  
  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch('/api/sync/status')
      const data = await response.json()
      
      setProgress(data.progress)
      setStatus(data.status)
      
      if (data.status === 'COMPLETED' || data.status === 'FAILED') {
        clearInterval(interval)
      }
    }, 2000)
    
    return () => clearInterval(interval)
  }, [])
  
  return { progress, status }
}
```

## Recommended Approach for Vercel

### Phase 1: MVP (Current)
- Use synchronous processing
- Works for 80% of users
- Simple implementation

### Phase 2: Enhanced (Recommended)
- Implement hybrid approach
- Add background job processing
- Progress tracking
- Better error handling

### Phase 3: Production
- External queue system (QStash/Cloudflare)
- Advanced caching
- Analytics and monitoring

## Cost Analysis

### Vercel Hobby Plan ($0/month)
- ✅ Synchronous processing
- ✅ Basic background jobs
- ❌ Limited to 10-second timeouts
- ❌ No cron jobs

### Vercel Pro Plan ($20/month)
- ✅ Cron jobs
- ✅ Longer function timeouts
- ✅ Better performance
- ✅ Advanced analytics

### Additional Services
- **Upstash QStash**: $5/month
- **Supabase**: $25/month (production)
- **Total**: ~$50/month for production

## Implementation Timeline

### Week 1: Database Schema
- Add SyncJob model
- Create migrations
- Update Prisma client

### Week 2: Background Processing
- Implement job queue system
- Add progress tracking
- Error handling

### Week 3: Frontend Integration
- Progress indicators
- Status polling
- Better UX

### Week 4: Optimization
- Caching strategy
- Rate limiting
- Performance monitoring

## Conclusion

For your use case, I recommend starting with the **hybrid approach**:

1. **Immediate processing** for users with ≤3 playlists
2. **Background processing** for larger datasets
3. **Progress tracking** for better UX
4. **Database caching** to reduce API calls

This approach provides the best balance of user experience, cost-effectiveness, and scalability while working within Vercel's constraints. 