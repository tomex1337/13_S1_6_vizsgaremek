import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const goals = await prisma.goal.findMany({
      orderBy: { id: 'asc' },
      cacheStrategy: { ttl: 3600 }, // Cache for 1 hour
    })
    
    const response = NextResponse.json(goals)
    
    // Cache for 1 hour (3600 seconds) since goals rarely change
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    
    return response
  } catch (error) {
    console.error('Error fetching goals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    )
  }
}
