"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import axios from "axios"
import Header from "@/components/header"
import Footer from "@/components/footer"

// Extend the session type to include user id
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

// Form validation schema
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

interface ActivityLevel {
  id: number
  name: string
}

interface Goal {
  id: number
  name: string
}

export default function CompleteProfile() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [activityLevels, setActivityLevels] = useState<ActivityLevel[]>([])
  const [goals, setGoals] = useState<Goal[]>([])

  const {
    register,
    handleSubmit,
  } = useForm({
    mode: "onSubmit", // Only validate on submit to avoid initial validation errors
  })

  // Fetch activity levels and goals
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [activityResponse, goalsResponse] = await Promise.all([
          axios.get('/api/activity-levels'),
          axios.get('/api/goals')
        ])
        
        setActivityLevels(activityResponse.data)
        setGoals(goalsResponse.data)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  const onSubmit = async (data: Record<string, unknown>) => {
    if (!session?.user?.id) {
      setSubmitError("Session expired. Please sign in again.")
      return
    }

    setIsLoading(true)
    setSubmitError(null)
    
    try {
      // Validate the data locally before sending
      const validationResult = profileSchema.safeParse(data)
      
      if (!validationResult.success) {
        // Extract and format validation errors for user display
        const errorMessages = validationResult.error.issues.map((err: { message: string }) => err.message)
        setSubmitError(`Please fix the following errors: ${errorMessages.join(', ')}`)
        setIsLoading(false)
        return
      }
      
      await axios.post('/api/profile', {
        userId: session.user.id,
        ...validationResult.data,
      })

      // Navigate to home page - Prisma cache tags will handle cache invalidation
      router.push('/')
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || error.message
        setSubmitError(`Error creating profile: ${errorMessage}`)
      } else {
        setSubmitError("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!session) {
    return (
      <>
      <Header />
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Please sign in to complete your profile.</p>
        </div>
      </div>
      <Footer />
      </>
    )
  }

  return (
    <>
    <Header />
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Profile</h1>
          <p className="mt-2 text-gray-600">
            Help us personalize your fitness journey
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow rounded-lg px-6 py-8 space-y-6">
          {/* Age */}
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700">
              Age *
            </label>
            <input
              type="number"
              id="age"
              {...register("age")}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Enter your age"
            />
          </div>

          {/* Gender */}
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
              Gender *
            </label>
            <select
              id="gender"
              {...register("gender")}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Height */}
          <div>
            <label htmlFor="heightCm" className="block text-sm font-medium text-gray-700">
              Height (cm) *
            </label>
            <input
              type="number"
              id="heightCm"
              {...register("heightCm")}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Enter your height in cm"
            />
          </div>

          {/* Weight */}
          <div>
            <label htmlFor="weightKg" className="block text-sm font-medium text-gray-700">
              Weight (kg) *
            </label>
            <input
              type="number"
              step="0.1"
              id="weightKg"
              {...register("weightKg")}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Enter your weight in kg"
            />
          </div>

          {/* Activity Level */}
          <div>
            <label htmlFor="activityLevelId" className="block text-sm font-medium text-gray-700">
              Activity Level *
            </label>
            <select
              id="activityLevelId"
              {...register("activityLevelId")}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select activity level</option>
              {activityLevels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>

          {/* Goal */}
          <div>
            <label htmlFor="goalId" className="block text-sm font-medium text-gray-700">
              Fitness Goal *
            </label>
            <select
              id="goalId"
              {...register("goalId")}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select your goal</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.name}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
              {submitError}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating Profile..." : "Complete Profile"}
            </button>
          </div>

          {/* Skip Button */}
          <div>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Skip for now
            </button>
          </div>
        </form>
      </div>
    </div>
    <Footer />
    </>
  )
}
