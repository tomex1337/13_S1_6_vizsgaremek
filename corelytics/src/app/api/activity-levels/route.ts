import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const activityLevels = await prisma.activityLevel.findMany({
      orderBy: { id: 'asc' },
      cacheStrategy: { ttl: 3600 }, // Cache 1 óráig
    })
    
    const response = NextResponse.json(activityLevels)
    
    //1 órás cache mivel az aktivitási szintek ritkán változnak
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    
    return response
  } catch (error) {
    console.error('Error fetching activity levels:', error)
    return NextResponse.json(
      { error: 'Nem sikerült betölteni az aktivitási szinteket' },
      { status: 500 }
    )
  }
}

// Aktivitási szintek létrehozása alapértelmezett értékekkel
export async function POST() {
  try {
    const defaultLevels = [
      { name: 'Ülő életmód (kevés vagy semmilyen testmozgás)' },
      { name: 'Enyhén aktív (könnyű edzés 1-3 nap/hét)' },
      { name: 'Közepesen aktív (közepes edzés 3-5 nap/hét)' },
      { name: 'Nagyon aktív (intenzív edzés 6-7 nap/hét)' },
      { name: 'Rendkívül aktív (nagyon intenzív edzés, fizikai munka)' }
    ]

    const createdLevels = []
    for (const level of defaultLevels) {
      const existingLevel = await prisma.activityLevel.findUnique({
        where: { name: level.name }
      })
      
      if (!existingLevel) {
        const created = await prisma.activityLevel.create({
          data: level
        })
        createdLevels.push(created)
      }
    }

    return NextResponse.json(createdLevels)
  } catch (error) {
    console.error('Error creating activity levels:', error)
    return NextResponse.json(
      { error: 'Nem sikerült létrehozni az aktivitási szinteket' },
      { status: 500 }
    )
  }
}
