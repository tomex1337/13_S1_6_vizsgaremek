import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const goals = await prisma.goal.findMany({
      orderBy: { id: 'asc' },
      cacheStrategy: { ttl: 3600 }, // Cache 1 órára
    })
    
    const response = NextResponse.json(goals)
    
    // 1 Órás cachelés
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    
    return response
  } catch (error) {
    console.error('Error fetching goals:', error)
    return NextResponse.json(
      { error: 'Nem sikerült betölteni a célokat' },
      { status: 500 }
    )
  }
}
