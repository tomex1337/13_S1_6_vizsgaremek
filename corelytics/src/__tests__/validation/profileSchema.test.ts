import { z } from 'zod'

// Test the profile validation schema
const profileSchema = z.object({
  age: z.string()
    .refine((val) => val !== "", { message: "Age is required" })
    .refine((val) => !isNaN(Number(val)), { message: "Age must be a valid number" })
    .transform((val) => Number(val))
    .refine((val) => val >= 13, { message: "Age must be at least 13" })
    .refine((val) => val <= 120, { message: "Age must be less than 120" }),
  
  gender: z.string()
    .refine((val) => val !== "", { message: "Gender is required" })
    .refine((val) => ["male", "female", "other"].includes(val), {
      message: "Please select a valid gender"
    }),
  
  heightCm: z.string()
    .refine((val) => val !== "", { message: "Height is required" })
    .refine((val) => !isNaN(Number(val)), { message: "Height must be a valid number" })
    .transform((val) => Number(val))
    .refine((val) => val >= 50, { message: "Height must be at least 50cm" })
    .refine((val) => val <= 300, { message: "Height must be less than 300cm" }),
  
  weightKg: z.string()
    .refine((val) => val !== "", { message: "Weight is required" })
    .refine((val) => !isNaN(Number(val)), { message: "Weight must be a valid number" })
    .transform((val) => Number(val))
    .refine((val) => val >= 20, { message: "Weight must be at least 20kg" })
    .refine((val) => val <= 500, { message: "Weight must be less than 500kg" }),
  
  activityLevelId: z.string()
    .refine((val) => val !== "", { message: "Activity level is required" })
    .refine((val) => !isNaN(Number(val)), { message: "Please select a valid activity level" })
    .transform((val) => Number(val)),
  
  goalId: z.string()
    .refine((val) => val !== "", { message: "Fitness goal is required" })
    .refine((val) => !isNaN(Number(val)), { message: "Please select a valid fitness goal" })
    .transform((val) => Number(val)),
})

describe('Profile Validation Schema', () => {
  describe('Age validation', () => {
    it('should accept valid age', () => {
      const validData = {
        age: '25',
        gender: 'male',
        heightCm: '175',
        weightKg: '70',
        activityLevelId: '1',
        goalId: '1',
      }

      const result = profileSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.age).toBe(25)
      }
    })

    it('should reject empty age', () => {
      const invalidData = {
        age: '',
        gender: 'male',
        heightCm: '175',
        weightKg: '70',
        activityLevelId: '1',
        goalId: '1',
      }

      const result = profileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Age is required')
      }
    })

    it('should reject age below 13', () => {
      const invalidData = {
        age: '12',
        gender: 'male',
        heightCm: '175',
        weightKg: '70',
        activityLevelId: '1',
        goalId: '1',
      }

      const result = profileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Age must be at least 13')
      }
    })

    it('should reject age above 120', () => {
      const invalidData = {
        age: '121',
        gender: 'male',
        heightCm: '175',
        weightKg: '70',
        activityLevelId: '1',
        goalId: '1',
      }

      const result = profileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Age must be less than 120')
      }
    })

    it('should reject non-numeric age', () => {
      const invalidData = {
        age: 'twenty',
        gender: 'male',
        heightCm: '175',
        weightKg: '70',
        activityLevelId: '1',
        goalId: '1',
      }

      const result = profileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Age must be a valid number')
      }
    })
  })

  describe('Gender validation', () => {
    it('should accept valid genders', () => {
      const validGenders = ['male', 'female', 'other']
      
      validGenders.forEach(gender => {
        const data = {
          age: '25',
          gender,
          heightCm: '175',
          weightKg: '70',
          activityLevelId: '1',
          goalId: '1',
        }

        const result = profileSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid gender', () => {
      const invalidData = {
        age: '25',
        gender: 'invalid',
        heightCm: '175',
        weightKg: '70',
        activityLevelId: '1',
        goalId: '1',
      }

      const result = profileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please select a valid gender')
      }
    })

    it('should reject empty gender', () => {
      const invalidData = {
        age: '25',
        gender: '',
        heightCm: '175',
        weightKg: '70',
        activityLevelId: '1',
        goalId: '1',
      }

      const result = profileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Gender is required')
      }
    })
  })

  describe('Height validation', () => {
    it('should accept valid height', () => {
      const validData = {
        age: '25',
        gender: 'male',
        heightCm: '175',
        weightKg: '70',
        activityLevelId: '1',
        goalId: '1',
      }

      const result = profileSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.heightCm).toBe(175)
      }
    })

    it('should reject height below 50cm', () => {
      const invalidData = {
        age: '25',
        gender: 'male',
        heightCm: '49',
        weightKg: '70',
        activityLevelId: '1',
        goalId: '1',
      }

      const result = profileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Height must be at least 50cm')
      }
    })

    it('should reject height above 300cm', () => {
      const invalidData = {
        age: '25',
        gender: 'male',
        heightCm: '301',
        weightKg: '70',
        activityLevelId: '1',
        goalId: '1',
      }

      const result = profileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Height must be less than 300cm')
      }
    })
  })

  describe('Weight validation', () => {
    it('should accept valid weight', () => {
      const validData = {
        age: '25',
        gender: 'male',
        heightCm: '175',
        weightKg: '70.5',
        activityLevelId: '1',
        goalId: '1',
      }

      const result = profileSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.weightKg).toBe(70.5)
      }
    })

    it('should reject weight below 20kg', () => {
      const invalidData = {
        age: '25',
        gender: 'male',
        heightCm: '175',
        weightKg: '19',
        activityLevelId: '1',
        goalId: '1',
      }

      const result = profileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Weight must be at least 20kg')
      }
    })

    it('should reject weight above 500kg', () => {
      const invalidData = {
        age: '25',
        gender: 'male',
        heightCm: '175',
        weightKg: '501',
        activityLevelId: '1',
        goalId: '1',
      }

      const result = profileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Weight must be less than 500kg')
      }
    })
  })

  describe('Activity Level validation', () => {
    it('should accept valid activity level ID', () => {
      const validData = {
        age: '25',
        gender: 'male',
        heightCm: '175',
        weightKg: '70',
        activityLevelId: '3',
        goalId: '1',
      }

      const result = profileSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.activityLevelId).toBe(3)
      }
    })

    it('should reject empty activity level', () => {
      const invalidData = {
        age: '25',
        gender: 'male',
        heightCm: '175',
        weightKg: '70',
        activityLevelId: '',
        goalId: '1',
      }

      const result = profileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Activity level is required')
      }
    })

    it('should reject non-numeric activity level', () => {
      const invalidData = {
        age: '25',
        gender: 'male',
        heightCm: '175',
        weightKg: '70',
        activityLevelId: 'high',
        goalId: '1',
      }

      const result = profileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please select a valid activity level')
      }
    })
  })

  describe('Goal validation', () => {
    it('should accept valid goal ID', () => {
      const validData = {
        age: '25',
        gender: 'male',
        heightCm: '175',
        weightKg: '70',
        activityLevelId: '1',
        goalId: '2',
      }

      const result = profileSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.goalId).toBe(2)
      }
    })

    it('should reject empty goal', () => {
      const invalidData = {
        age: '25',
        gender: 'male',
        heightCm: '175',
        weightKg: '70',
        activityLevelId: '1',
        goalId: '',
      }

      const result = profileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Fitness goal is required')
      }
    })

    it('should reject non-numeric goal', () => {
      const invalidData = {
        age: '25',
        gender: 'male',
        heightCm: '175',
        weightKg: '70',
        activityLevelId: '1',
        goalId: 'lose_weight',
      }

      const result = profileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please select a valid fitness goal')
      }
    })
  })
})
