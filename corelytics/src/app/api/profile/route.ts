import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const profileSchema = z.object({
  userId: z.string(),
  age: z.number().min(13).max(120).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  heightCm: z.number().min(50).max(300).optional(),
  weightKg: z.number().min(20).max(500).optional(),
  activityLevelId: z.number().optional(),
  goalId: z.number().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = profileSchema.parse(body)

    // Ensure user can only create/update their own profile
    if (validatedData.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check if profile already exists
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId: validatedData.userId }
    })

    let profile
    if (existingProfile) {
      // Update existing profile
      profile = await prisma.userProfile.update({
        where: { userId: validatedData.userId },
        data: {
          age: validatedData.age,
          gender: validatedData.gender,
          heightCm: validatedData.heightCm,
          weightKg: validatedData.weightKg,
          activityLevelId: validatedData.activityLevelId,
          goalId: validatedData.goalId,
        }
      })
    } else {
      // Create new profile
      profile = await prisma.userProfile.create({
        data: {
          userId: validatedData.userId,
          age: validatedData.age,
          gender: validatedData.gender,
          heightCm: validatedData.heightCm,
          weightKg: validatedData.weightKg,
          activityLevelId: validatedData.activityLevelId,
          goalId: validatedData.goalId,
        }
      })
    }

    // Invalidate the cache tag for this user's profile
    await prisma.$accelerate.invalidate({
      tags: [`user-profile:${validatedData.userId}`]
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error creating/updating profile:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create/update profile' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        activityLevel: true,
        goal: true,
      },
      cacheStrategy: { 
        ttl: 300, // Cache for 5 minutes
        tags: [`user-profile:${session.user.id}`]
      },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const response = NextResponse.json(profile)
    
    // Cache for 5 minutes (300 seconds) since user profiles can change
    // but not as frequently as real-time data
    response.headers.set('Cache-Control', 'private, s-maxage=300, stale-while-revalidate=600')
    
    return response
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
