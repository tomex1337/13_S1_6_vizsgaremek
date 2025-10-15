import { z } from 'zod'

// Validation schema for creating custom food
const createCustomFoodSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  servingSizeGrams: z.number().positive().optional(),
  calories: z.number().nonnegative().optional(),
  protein: z.number().nonnegative().optional(),
  fat: z.number().nonnegative().optional(),
  carbs: z.number().nonnegative().optional(),
  fiber: z.number().nonnegative().optional(),
  sugar: z.number().nonnegative().optional(),
  sodium: z.number().nonnegative().optional()
})

describe('Food Create Validation Tests', () => {
  describe('createCustomFoodSchema', () => {
    it('should validate complete food data with all fields', () => {
      const validData = {
        name: 'Custom Protein Bar',
        brand: 'HomeMade',
        servingSizeGrams: 50,
        calories: 200,
        protein: 20,
        fat: 8,
        carbs: 15,
        fiber: 5,
        sugar: 3,
        sodium: 150
      }

      const result = createCustomFoodSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should validate food with only required name field', () => {
      const validData = {
        name: 'Simple Food'
      }

      const result = createCustomFoodSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should validate food with name and some optional fields', () => {
      const validData = {
        name: 'Chicken Breast',
        calories: 165,
        protein: 31,
        fat: 3.6,
        carbs: 0
      }

      const result = createCustomFoodSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      const invalidData = {
        name: '',
        calories: 100
      }

      const result = createCustomFoodSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing name', () => {
      const invalidData = {
        calories: 100,
        protein: 10
      }

      const result = createCustomFoodSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject negative calories', () => {
      const invalidData = {
        name: 'Test Food',
        calories: -100
      }

      const result = createCustomFoodSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept zero calories', () => {
      const validData = {
        name: 'Water',
        calories: 0
      }

      const result = createCustomFoodSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject negative protein', () => {
      const invalidData = {
        name: 'Test Food',
        protein: -5
      }

      const result = createCustomFoodSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept zero protein', () => {
      const validData = {
        name: 'Pure Sugar',
        protein: 0
      }

      const result = createCustomFoodSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject negative fat', () => {
      const invalidData = {
        name: 'Test Food',
        fat: -10
      }

      const result = createCustomFoodSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject negative carbs', () => {
      const invalidData = {
        name: 'Test Food',
        carbs: -20
      }

      const result = createCustomFoodSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject negative fiber', () => {
      const invalidData = {
        name: 'Test Food',
        fiber: -3
      }

      const result = createCustomFoodSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject negative sugar', () => {
      const invalidData = {
        name: 'Test Food',
        sugar: -5
      }

      const result = createCustomFoodSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject negative sodium', () => {
      const invalidData = {
        name: 'Test Food',
        sodium: -100
      }

      const result = createCustomFoodSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject zero or negative serving size', () => {
      const invalidData = {
        name: 'Test Food',
        servingSizeGrams: 0
      }

      const result = createCustomFoodSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept positive serving size', () => {
      const validData = {
        name: 'Test Food',
        servingSizeGrams: 100
      }

      const result = createCustomFoodSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept decimal values for macros', () => {
      const validData = {
        name: 'Almond',
        calories: 7.5,
        protein: 0.25,
        fat: 0.65,
        carbs: 0.25,
        fiber: 0.15
      }

      const result = createCustomFoodSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept very large values', () => {
      const validData = {
        name: 'Bulk Food',
        servingSizeGrams: 1000,
        calories: 5000,
        protein: 200,
        fat: 150,
        carbs: 600
      }

      const result = createCustomFoodSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept long food names', () => {
      const validData = {
        name: 'Organic Free-Range Grass-Fed Beef Ribeye Steak with Herbs and Spices'
      }

      const result = createCustomFoodSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept long brand names', () => {
      const validData = {
        name: 'Protein Bar',
        brand: 'Super Healthy Organic Natural Food Company Brand'
      }

      const result = createCustomFoodSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate realistic complete meal example', () => {
      const validData = {
        name: 'Homemade Chicken Salad',
        servingSizeGrams: 250,
        calories: 320,
        protein: 28,
        fat: 12,
        carbs: 25,
        fiber: 6,
        sugar: 8,
        sodium: 420
      }

      const result = createCustomFoodSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate zero-calorie items', () => {
      const validData = {
        name: 'Diet Soda',
        brand: 'Generic',
        servingSizeGrams: 355,
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0
      }

      const result = createCustomFoodSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate high-protein foods', () => {
      const validData = {
        name: 'Whey Protein Powder',
        brand: 'FitPro',
        servingSizeGrams: 30,
        calories: 120,
        protein: 25,
        fat: 1,
        carbs: 3,
        sugar: 1
      }

      const result = createCustomFoodSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate high-fat foods', () => {
      const validData = {
        name: 'Extra Virgin Olive Oil',
        servingSizeGrams: 15,
        calories: 120,
        protein: 0,
        fat: 14,
        carbs: 0
      }

      const result = createCustomFoodSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate high-carb foods', () => {
      const validData = {
        name: 'White Rice Cooked',
        servingSizeGrams: 150,
        calories: 195,
        protein: 4,
        fat: 0.4,
        carbs: 43,
        fiber: 0.6
      }

      const result = createCustomFoodSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should handle foods with high sodium', () => {
      const validData = {
        name: 'Soy Sauce',
        servingSizeGrams: 15,
        calories: 10,
        protein: 1,
        fat: 0,
        carbs: 1,
        sodium: 1005
      }

      const result = createCustomFoodSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should handle foods with high fiber', () => {
      const validData = {
        name: 'Chia Seeds',
        servingSizeGrams: 28,
        calories: 138,
        protein: 5,
        fat: 9,
        carbs: 12,
        fiber: 10
      }

      const result = createCustomFoodSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid data types for numeric fields', () => {
      const invalidData = {
        name: 'Test Food',
        calories: 'one hundred' as unknown as number
      }

      const result = createCustomFoodSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Nutritional Validation Logic', () => {
    it('should allow foods where macro calories exceed total calories (user error)', () => {
      // Note: This test shows current behavior - the schema doesn't validate macro math
      // In a real app, you might want additional validation
      const validData = {
        name: 'Test Food',
        calories: 100,
        protein: 50, // 200 cal
        fat: 10,     // 90 cal  
        carbs: 20    // 80 cal
        // Total from macros: 370 cal, but calories is only 100
      }

      const result = createCustomFoodSchema.safeParse(validData)
      expect(result.success).toBe(true)
      // This passes because the schema doesn't cross-validate
    })

    it('should allow missing some macros even if calories are specified', () => {
      const validData = {
        name: 'Mystery Food',
        calories: 200,
        protein: 10
        // Missing fat and carbs
      }

      const result = createCustomFoodSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })
})
