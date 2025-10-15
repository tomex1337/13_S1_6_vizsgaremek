import { z } from 'zod'

// Validation schemas for food logging
const logFoodSchema = z.object({
  foodItemId: z.string(),
  mealTypeId: z.number(),
  quantity: z.number().positive(),
  logDate: z.string().optional()
})

const updateLogQuantitySchema = z.object({
  logId: z.string(),
  quantity: z.number().positive()
})

const deleteLogSchema = z.object({
  logId: z.string().min(1)
})

const searchFoodSchema = z.object({
  query: z.string().min(1),
  limit: z.number().optional().default(20)
})

const getDailyLogsSchema = z.object({
  date: z.string().optional()
})

describe('Food Log Validation Tests', () => {
  describe('logFoodSchema', () => {
    it('should validate correct food log data', () => {
      const validData = {
        foodItemId: '123e4567-e89b-12d3-a456-426614174000',
        mealTypeId: 1,
        quantity: 2.5,
        logDate: '2025-10-15'
      }

      const result = logFoodSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should validate food log without optional logDate', () => {
      const validData = {
        foodItemId: '123e4567-e89b-12d3-a456-426614174000',
        mealTypeId: 2,
        quantity: 1
      }

      const result = logFoodSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject missing foodItemId', () => {
      const invalidData = {
        mealTypeId: 1,
        quantity: 2
      }

      const result = logFoodSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing mealTypeId', () => {
      const invalidData = {
        foodItemId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 2
      }

      const result = logFoodSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing quantity', () => {
      const invalidData = {
        foodItemId: '123e4567-e89b-12d3-a456-426614174000',
        mealTypeId: 1
      }

      const result = logFoodSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject zero quantity', () => {
      const invalidData = {
        foodItemId: '123e4567-e89b-12d3-a456-426614174000',
        mealTypeId: 1,
        quantity: 0
      }

      const result = logFoodSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject negative quantity', () => {
      const invalidData = {
        foodItemId: '123e4567-e89b-12d3-a456-426614174000',
        mealTypeId: 1,
        quantity: -5
      }

      const result = logFoodSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept decimal quantities', () => {
      const validData = {
        foodItemId: '123e4567-e89b-12d3-a456-426614174000',
        mealTypeId: 1,
        quantity: 0.5
      }

      const result = logFoodSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept large quantities', () => {
      const validData = {
        foodItemId: '123e4567-e89b-12d3-a456-426614174000',
        mealTypeId: 1,
        quantity: 999.99
      }

      const result = logFoodSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('updateLogQuantitySchema', () => {
    it('should validate correct update quantity data', () => {
      const validData = {
        logId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 3
      }

      const result = updateLogQuantitySchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should reject missing logId', () => {
      const invalidData = {
        quantity: 2
      }

      const result = updateLogQuantitySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing quantity', () => {
      const invalidData = {
        logId: '123e4567-e89b-12d3-a456-426614174000'
      }

      const result = updateLogQuantitySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject zero or negative quantity', () => {
      const invalidData = {
        logId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 0
      }

      const result = updateLogQuantitySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept decimal quantities', () => {
      const validData = {
        logId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 1.5
      }

      const result = updateLogQuantitySchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('deleteLogSchema', () => {
    it('should validate correct delete log data', () => {
      const validData = {
        logId: '123e4567-e89b-12d3-a456-426614174000'
      }

      const result = deleteLogSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should reject missing logId', () => {
      const invalidData = {}

      const result = deleteLogSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty logId', () => {
      const invalidData = {
        logId: ''
      }

      const result = deleteLogSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('searchFoodSchema', () => {
    it('should validate correct search data', () => {
      const validData = {
        query: 'chicken',
        limit: 10
      }

      const result = searchFoodSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should use default limit when not provided', () => {
      const validData = {
        query: 'apple'
      }

      const result = searchFoodSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(20)
      }
    })

    it('should reject empty query', () => {
      const invalidData = {
        query: ''
      }

      const result = searchFoodSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing query', () => {
      const invalidData = {}

      const result = searchFoodSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept single character query', () => {
      const validData = {
        query: 'a'
      }

      const result = searchFoodSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept long query strings', () => {
      const validData = {
        query: 'organic whole grain multigrain bread with seeds'
      }

      const result = searchFoodSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('getDailyLogsSchema', () => {
    it('should validate with date provided', () => {
      const validData = {
        date: '2025-10-15'
      }

      const result = getDailyLogsSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should validate without date (optional)', () => {
      const validData = {}

      const result = getDailyLogsSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept various date formats as strings', () => {
      const validData = {
        date: '2025-01-01T00:00:00.000Z'
      }

      const result = getDailyLogsSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })
})

