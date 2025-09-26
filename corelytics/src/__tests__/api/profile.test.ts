/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'

// Mock Next.js globals
global.Request = Request;
global.Response = Response;

// Mock Next Auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

// Mock Prisma
const mockFindUnique = jest.fn()
const mockCreate = jest.fn()
const mockUpdate = jest.fn()

jest.mock('@/lib/prisma', () => ({
  prisma: {
    userProfile: {
      findUnique: mockFindUnique,
      create: mockCreate,
      update: mockUpdate,
    },
  },
}))

// Mock auth options
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

// Import after mocking
const { GET, POST } = require('@/app/api/profile/route')

describe('/api/profile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return profile for authenticated user', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' }
      }
      const mockProfile = {
        id: 1,
        userId: 'user-123',
        age: 25,
        gender: 'male',
        heightCm: 175,
        weightKg: 70,
        activityLevel: { id: 1, name: 'Moderately active' },
        goal: { id: 1, name: 'Lose weight' }
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockFindUnique.mockResolvedValue(mockProfile)

      const response = await GET(new NextRequest('http://localhost:3000/api/profile'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockProfile)
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        include: {
          activityLevel: true,
          goal: true,
        },
      })
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const response = await GET(new NextRequest('http://localhost:3000/api/profile'))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 404 when profile not found', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' }
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockFindUnique.mockResolvedValue(null)

      const response = await GET(new NextRequest('http://localhost:3000/api/profile'))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Profile not found')
    })

    it('should handle database errors', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' }
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockFindUnique.mockRejectedValue(new Error('Database error'))

      const response = await GET(new NextRequest('http://localhost:3000/api/profile'))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch profile')
    })
  })

  describe('POST', () => {
    const validProfileData = {
      userId: 'user-123',
      age: 25,
      gender: 'male',
      heightCm: 175,
      weightKg: 70,
      activityLevelId: 1,
      goalId: 1,
    }

    it('should create new profile for authenticated user', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' }
      }
      const mockCreatedProfile = { id: 1, ...validProfileData }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockFindUnique.mockResolvedValue(null) // No existing profile
      mockCreate.mockResolvedValue(mockCreatedProfile)

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'POST',
        body: JSON.stringify(validProfileData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockCreatedProfile)
      expect(mockCreate).toHaveBeenCalledWith({
        data: validProfileData
      })
    })

    it('should update existing profile', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' }
      }
      const existingProfile = { id: 1, ...validProfileData }
      const updatedProfile = { ...existingProfile, age: 26 }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockFindUnique.mockResolvedValue(existingProfile)
      mockUpdate.mockResolvedValue(updatedProfile)

      const updateData = { ...validProfileData, age: 26 }
      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'POST',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(updatedProfile)
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        data: {
          age: 26,
          gender: 'male',
          heightCm: 175,
          weightKg: 70,
          activityLevelId: 1,
          goalId: 1,
        }
      })
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'POST',
        body: JSON.stringify(validProfileData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 403 when trying to create profile for different user', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' }
      }

      mockGetServerSession.mockResolvedValue(mockSession)

      const invalidData = { ...validProfileData, userId: 'different-user' }
      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })

    it('should return 400 for invalid data', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' }
      }

      mockGetServerSession.mockResolvedValue(mockSession)

      const invalidData = {
        userId: 'user-123',
        age: 5, // Invalid age (too young)
        gender: 'invalid',
      }

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
      expect(data.details).toBeDefined()
    })

    it('should handle database errors during creation', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' }
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockFindUnique.mockResolvedValue(null)
      mockCreate.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'POST',
        body: JSON.stringify(validProfileData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create/update profile')
    })
  })
})
