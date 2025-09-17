import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const activityLevels = await prisma.activityLevel.findMany({
      orderBy: { id: 'asc' },
      cacheStrategy: { ttl: 3600 }, // Cache for 1 hour
    })
    
    const response = NextResponse.json(activityLevels)
    
    // Cache for 1 hour (3600 seconds) since activity levels rarely change
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    
    return response
  } catch (error) {
    console.error('Error fetching activity levels:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity levels' },
      { status: 500 }
    )
  }
}

// Create default activity levels if they don't exist
export async function POST() {
  try {
    const defaultLevels = [
      { name: 'Sedentary (little or no exercise)' },
      { name: 'Lightly active (light exercise 1-3 days/week)' },
      { name: 'Moderately active (moderate exercise 3-5 days/week)' },
      { name: 'Very active (hard exercise 6-7 days/week)' },
      { name: 'Extremely active (very hard exercise, physical job)' }
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
      { error: 'Failed to create activity levels' },
      { status: 500 }
    )
  }
}
