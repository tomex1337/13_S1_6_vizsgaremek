/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock data types based on Prisma schema
interface MockUserProfile {
  id: string
  userId: string
  age: number | null
  gender: string | null
  heightCm: number | null
  weightKg: number | null
  activityLevelId: number | null
  goalId: number | null
  createdAt: Date
  updatedAt: Date
  activityLevel?: {
    id: number
    name: string
    description: string
  } | null
  goal?: {
    id: number
    name: string
    description: string
  } | null
}

interface MockContext {
  session: {
    user: {
      id: string
      name?: string
      email?: string
    }
  }
  prisma: {
    userProfile: {
      findUnique: any
    }
  }
}

// Mock the user.profile procedure logic
async function userProfileProcedure(ctx: MockContext) {
  const userId = ctx.session.user.id
  
  const profile = await ctx.prisma.userProfile.findUnique({
    where: { userId },
    include: {
      activityLevel: true,
      goal: true,
    }
  })

  if (!profile) {
    return {
      exists: false,
      isComplete: false,
      profile: null
    }
  }

  // Check if profile is complete - all required fields should be filled
  const isComplete = !!(
    profile.age &&
    profile.gender &&
    profile.heightCm &&
    profile.weightKg &&
    profile.activityLevelId &&
    profile.goalId
  )

  return {
    exists: true,
    isComplete,
    profile
  }
}

describe('user.profile tRPC Procedure Tests', () => {
  let mockContext: MockContext

  beforeEach(() => {
    mockContext = {
      session: {
        user: {
          id: 'test-user-123',
          name: 'Test User',
          email: 'test@example.com'
        }
      },
      prisma: {
        userProfile: {
          findUnique: jest.fn()
        }
      }
    }
  })

  describe('Profile Existence', () => {
    it('should return exists: false when profile does not exist', async () => {
      mockContext.prisma.userProfile.findUnique.mockResolvedValue(null)

      const result = await userProfileProcedure(mockContext)

      expect(result).toEqual({
        exists: false,
        isComplete: false,
        profile: null
      })
      expect(mockContext.prisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'test-user-123' },
        include: {
          activityLevel: true,
          goal: true,
        }
      })
    })

    it('should return exists: true when profile exists', async () => {
      const mockProfile: MockUserProfile = {
        id: 'profile-123',
        userId: 'test-user-123',
        age: 30,
        gender: 'male',
        heightCm: 180,
        weightKg: 80,
        activityLevelId: 2,
        goalId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        activityLevel: {
          id: 2,
          name: 'Lightly Active',
          description: 'Exercise 1-3 days/week'
        },
        goal: {
          id: 1,
          name: 'Weight Loss',
          description: 'Lose weight gradually'
        }
      }

      mockContext.prisma.userProfile.findUnique.mockResolvedValue(mockProfile)

      const result = await userProfileProcedure(mockContext)

      expect(result.exists).toBe(true)
      expect(result.profile).toEqual(mockProfile)
    })
  })

  describe('Profile Completeness', () => {
    it('should return isComplete: true when all required fields are filled', async () => {
      const completeProfile: MockUserProfile = {
        id: 'profile-123',
        userId: 'test-user-123',
        age: 25,
        gender: 'female',
        heightCm: 165,
        weightKg: 60,
        activityLevelId: 3,
        goalId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        activityLevel: {
          id: 3,
          name: 'Moderately Active',
          description: 'Exercise 3-5 days/week'
        },
        goal: {
          id: 2,
          name: 'Maintain Weight',
          description: 'Maintain current weight'
        }
      }

      mockContext.prisma.userProfile.findUnique.mockResolvedValue(completeProfile)

      const result = await userProfileProcedure(mockContext)

      expect(result.exists).toBe(true)
      expect(result.isComplete).toBe(true)
      expect(result.profile).toEqual(completeProfile)
    })

    it('should return isComplete: false when age is missing', async () => {
      const incompleteProfile: MockUserProfile = {
        id: 'profile-123',
        userId: 'test-user-123',
        age: null,
        gender: 'male',
        heightCm: 180,
        weightKg: 80,
        activityLevelId: 2,
        goalId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockContext.prisma.userProfile.findUnique.mockResolvedValue(incompleteProfile)

      const result = await userProfileProcedure(mockContext)

      expect(result.exists).toBe(true)
      expect(result.isComplete).toBe(false)
    })

    it('should return isComplete: false when gender is missing', async () => {
      const incompleteProfile: MockUserProfile = {
        id: 'profile-123',
        userId: 'test-user-123',
        age: 30,
        gender: null,
        heightCm: 180,
        weightKg: 80,
        activityLevelId: 2,
        goalId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockContext.prisma.userProfile.findUnique.mockResolvedValue(incompleteProfile)

      const result = await userProfileProcedure(mockContext)

      expect(result.exists).toBe(true)
      expect(result.isComplete).toBe(false)
    })

    it('should return isComplete: false when heightCm is missing', async () => {
      const incompleteProfile: MockUserProfile = {
        id: 'profile-123',
        userId: 'test-user-123',
        age: 30,
        gender: 'male',
        heightCm: null,
        weightKg: 80,
        activityLevelId: 2,
        goalId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockContext.prisma.userProfile.findUnique.mockResolvedValue(incompleteProfile)

      const result = await userProfileProcedure(mockContext)

      expect(result.exists).toBe(true)
      expect(result.isComplete).toBe(false)
    })

    it('should return isComplete: false when weightKg is missing', async () => {
      const incompleteProfile: MockUserProfile = {
        id: 'profile-123',
        userId: 'test-user-123',
        age: 30,
        gender: 'male',
        heightCm: 180,
        weightKg: null,
        activityLevelId: 2,
        goalId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockContext.prisma.userProfile.findUnique.mockResolvedValue(incompleteProfile)

      const result = await userProfileProcedure(mockContext)

      expect(result.exists).toBe(true)
      expect(result.isComplete).toBe(false)
    })

    it('should return isComplete: false when activityLevelId is missing', async () => {
      const incompleteProfile: MockUserProfile = {
        id: 'profile-123',
        userId: 'test-user-123',
        age: 30,
        gender: 'male',
        heightCm: 180,
        weightKg: 80,
        activityLevelId: null,
        goalId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockContext.prisma.userProfile.findUnique.mockResolvedValue(incompleteProfile)

      const result = await userProfileProcedure(mockContext)

      expect(result.exists).toBe(true)
      expect(result.isComplete).toBe(false)
    })

    it('should return isComplete: false when goalId is missing', async () => {
      const incompleteProfile: MockUserProfile = {
        id: 'profile-123',
        userId: 'test-user-123',
        age: 30,
        gender: 'male',
        heightCm: 180,
        weightKg: 80,
        activityLevelId: 2,
        goalId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockContext.prisma.userProfile.findUnique.mockResolvedValue(incompleteProfile)

      const result = await userProfileProcedure(mockContext)

      expect(result.exists).toBe(true)
      expect(result.isComplete).toBe(false)
    })

    it('should return isComplete: false when multiple fields are missing', async () => {
      const incompleteProfile: MockUserProfile = {
        id: 'profile-123',
        userId: 'test-user-123',
        age: null,
        gender: null,
        heightCm: null,
        weightKg: null,
        activityLevelId: null,
        goalId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockContext.prisma.userProfile.findUnique.mockResolvedValue(incompleteProfile)

      const result = await userProfileProcedure(mockContext)

      expect(result.exists).toBe(true)
      expect(result.isComplete).toBe(false)
    })
  })

  describe('Profile with Relations', () => {
    it('should include activityLevel relation when present', async () => {
      const profileWithActivity: MockUserProfile = {
        id: 'profile-123',
        userId: 'test-user-123',
        age: 28,
        gender: 'other',
        heightCm: 170,
        weightKg: 70,
        activityLevelId: 4,
        goalId: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
        activityLevel: {
          id: 4,
          name: 'Very Active',
          description: 'Exercise 6-7 days/week'
        },
        goal: null
      }

      mockContext.prisma.userProfile.findUnique.mockResolvedValue(profileWithActivity)

      const result = await userProfileProcedure(mockContext)

      expect(result.exists).toBe(true)
      expect(result.profile?.activityLevel).toEqual({
        id: 4,
        name: 'Very Active',
        description: 'Exercise 6-7 days/week'
      })
    })

    it('should include goal relation when present', async () => {
      const profileWithGoal: MockUserProfile = {
        id: 'profile-123',
        userId: 'test-user-123',
        age: 35,
        gender: 'male',
        heightCm: 175,
        weightKg: 85,
        activityLevelId: 1,
        goalId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        activityLevel: null,
        goal: {
          id: 1,
          name: 'Weight Loss',
          description: 'Lose weight gradually'
        }
      }

      mockContext.prisma.userProfile.findUnique.mockResolvedValue(profileWithGoal)

      const result = await userProfileProcedure(mockContext)

      expect(result.exists).toBe(true)
      expect(result.profile?.goal).toEqual({
        id: 1,
        name: 'Weight Loss',
        description: 'Lose weight gradually'
      })
    })

    it('should include both activityLevel and goal relations', async () => {
      const fullProfile: MockUserProfile = {
        id: 'profile-123',
        userId: 'test-user-123',
        age: 40,
        gender: 'female',
        heightCm: 160,
        weightKg: 55,
        activityLevelId: 2,
        goalId: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
        activityLevel: {
          id: 2,
          name: 'Lightly Active',
          description: 'Exercise 1-3 days/week'
        },
        goal: {
          id: 3,
          name: 'Weight Gain',
          description: 'Gain weight gradually'
        }
      }

      mockContext.prisma.userProfile.findUnique.mockResolvedValue(fullProfile)

      const result = await userProfileProcedure(mockContext)

      expect(result.exists).toBe(true)
      expect(result.isComplete).toBe(true)
      expect(result.profile?.activityLevel).toBeDefined()
      expect(result.profile?.goal).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero age correctly (should be incomplete)', async () => {
      const profileWithZeroAge: MockUserProfile = {
        id: 'profile-123',
        userId: 'test-user-123',
        age: 0, // Zero is falsy, so should be incomplete
        gender: 'male',
        heightCm: 180,
        weightKg: 80,
        activityLevelId: 2,
        goalId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockContext.prisma.userProfile.findUnique.mockResolvedValue(profileWithZeroAge)

      const result = await userProfileProcedure(mockContext)

      expect(result.exists).toBe(true)
      expect(result.isComplete).toBe(false)
    })

    it('should handle valid minimum age (13)', async () => {
      const profileWithMinAge: MockUserProfile = {
        id: 'profile-123',
        userId: 'test-user-123',
        age: 13,
        gender: 'male',
        heightCm: 150,
        weightKg: 45,
        activityLevelId: 2,
        goalId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockContext.prisma.userProfile.findUnique.mockResolvedValue(profileWithMinAge)

      const result = await userProfileProcedure(mockContext)

      expect(result.exists).toBe(true)
      expect(result.isComplete).toBe(true)
    })

    it('should handle valid maximum age (120)', async () => {
      const profileWithMaxAge: MockUserProfile = {
        id: 'profile-123',
        userId: 'test-user-123',
        age: 120,
        gender: 'female',
        heightCm: 160,
        weightKg: 60,
        activityLevelId: 1,
        goalId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockContext.prisma.userProfile.findUnique.mockResolvedValue(profileWithMaxAge)

      const result = await userProfileProcedure(mockContext)

      expect(result.exists).toBe(true)
      expect(result.isComplete).toBe(true)
    })

    it('should handle different gender values', async () => {
      const genders = ['male', 'female', 'other']

      for (const gender of genders) {
        const profile: MockUserProfile = {
          id: 'profile-123',
          userId: 'test-user-123',
          age: 30,
          gender,
          heightCm: 170,
          weightKg: 70,
          activityLevelId: 2,
          goalId: 2,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        mockContext.prisma.userProfile.findUnique.mockResolvedValue(profile)

        const result = await userProfileProcedure(mockContext)

        expect(result.exists).toBe(true)
        expect(result.isComplete).toBe(true)
        expect(result.profile?.gender).toBe(gender)
      }
    })

    it('should use correct userId from session', async () => {
      mockContext.session.user.id = 'different-user-456'
      mockContext.prisma.userProfile.findUnique.mockResolvedValue(null)

      await userProfileProcedure(mockContext)

      expect(mockContext.prisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'different-user-456' },
        include: {
          activityLevel: true,
          goal: true,
        }
      })
    })
  })

  describe('Database Query Structure', () => {
    it('should call findUnique with correct where clause', async () => {
      mockContext.prisma.userProfile.findUnique.mockResolvedValue(null)

      await userProfileProcedure(mockContext)

      expect(mockContext.prisma.userProfile.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'test-user-123' }
        })
      )
    })

    it('should include activityLevel and goal relations', async () => {
      mockContext.prisma.userProfile.findUnique.mockResolvedValue(null)

      await userProfileProcedure(mockContext)

      expect(mockContext.prisma.userProfile.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            activityLevel: true,
            goal: true,
          }
        })
      )
    })

    it('should only call database once per request', async () => {
      mockContext.prisma.userProfile.findUnique.mockResolvedValue(null)

      await userProfileProcedure(mockContext)

      expect(mockContext.prisma.userProfile.findUnique).toHaveBeenCalledTimes(1)
    })
  })
})
