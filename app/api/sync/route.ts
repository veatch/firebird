import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create or update sync job
    const syncJob = await prisma.syncJob.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        status: 'PENDING',
        startedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        status: 'PENDING',
        startedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    // Trigger immediate sync (for small datasets) or queue for background processing
    const shouldSyncImmediately = true // You can add logic here based on user's playlist count
    
    if (shouldSyncImmediately) {
      // For immediate sync, we'll process in the same request
      // In production, you might want to use a queue system
      return NextResponse.json({ 
        jobId: syncJob.id, 
        status: 'PROCESSING',
        message: 'Starting playlist sync...'
      })
    } else {
      // Queue for background processing
      return NextResponse.json({ 
        jobId: syncJob.id, 
        status: 'QUEUED',
        message: 'Playlist sync queued for background processing'
      })
    }
  } catch (error) {
    console.error('Error initiating sync:', error)
    return NextResponse.json(
      { error: 'Failed to initiate sync' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const syncJob = await prisma.syncJob.findUnique({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
    })

    if (!syncJob) {
      return NextResponse.json({ status: 'NOT_STARTED' })
    }

    return NextResponse.json({
      jobId: syncJob.id,
      status: syncJob.status,
      progress: syncJob.progress,
      startedAt: syncJob.startedAt,
      completedAt: syncJob.completedAt,
      error: syncJob.error,
    })
  } catch (error) {
    console.error('Error fetching sync status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sync status' },
      { status: 500 }
    )
  }
} 