/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'

// Mock Next.js globals
global.Request = Request;
global.Response = Response;

// Mock Prisma
const mockFindMany = jest.fn()
const mockFindUnique = jest.fn()
const mockCreate = jest.fn()

jest.mock('@/lib/prisma', () => ({
  prisma: {
    activityLevel: {
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      create: mockCreate,
    },
  },
}))

// Import after mocking
const { GET, POST } = require('@/app/api/activity-levels/route')

describe('/api/activity-levels', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return activity levels successfully', async () => {
      const mockActivityLevels = [
        { id: 1, name: 'Sedentary (little or no exercise)' },
        { id: 2, name: 'Lightly active (light exercise 1-3 days/week)' },
      ]

      mockFindMany.mockResolvedValue(mockActivityLevels)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockActivityLevels)
      expect(mockFindMany).toHaveBeenCalledWith({
        orderBy: { id: 'asc' },
        cacheStrategy: { ttl: 3600 },
      })
    })

    it('should handle database errors', async () => {
      mockFindMany.mockRejectedValue(new Error('Database error'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch activity levels')
    })

    it('should set correct cache headers', async () => {
      mockFindMany.mockResolvedValue([])

      const response = await GET()
      const cacheControl = response.headers.get('Cache-Control')

      expect(cacheControl).toBe('public, s-maxage=3600, stale-while-revalidate=86400')
    })
  })

  describe('POST', () => {
    it('should create new activity levels when they do not exist', async () => {
      const newLevel = { id: 1, name: 'Sedentary (little or no exercise)' }

      // Mock that no existing levels are found
      mockFindUnique.mockResolvedValue(null)
      // Mock successful creation
      mockCreate.mockResolvedValue(newLevel)

      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(5) // All 5 default levels should be created
      expect(mockFindUnique).toHaveBeenCalledTimes(5)
      expect(mockCreate).toHaveBeenCalledTimes(5)
    })

    it('should skip creating existing activity levels', async () => {
      const existingLevel = { id: 1, name: 'Sedentary (little or no exercise)' }

      // Mock that first level exists, others don't
      mockFindUnique
        .mockResolvedValueOnce(existingLevel) // First call returns existing
        .mockResolvedValue(null) // Other calls return null

      mockCreate.mockResolvedValue({
        id: 2,
        name: 'Lightly active (light exercise 1-3 days/week)'
      })

      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(4) // Only 4 new levels created (1 existed)
      expect(mockFindUnique).toHaveBeenCalledTimes(5)
      expect(mockCreate).toHaveBeenCalledTimes(4)
    })

    it('should return empty array when all levels exist', async () => {
      const existingLevel = { id: 1, name: 'Sedentary (little or no exercise)' }

      // Mock that all levels exist
      mockFindUnique.mockResolvedValue(existingLevel)

      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(0) // No new levels created
      expect(mockFindUnique).toHaveBeenCalledTimes(5)
      expect(mockCreate).not.toHaveBeenCalled()
    })

    it('should handle database errors during creation', async () => {
      mockFindUnique.mockRejectedValue(new Error('Database error'))

      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create activity levels')
    })

    it('should handle creation errors gracefully', async () => {
      mockFindUnique.mockResolvedValue(null)
      mockCreate.mockRejectedValue(new Error('Creation failed'))

      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create activity levels')
    })
  })
})
