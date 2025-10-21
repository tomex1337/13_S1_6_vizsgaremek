"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import axios from "axios"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { UserIcon, ArrowLeftIcon } from "@heroicons/react/24/outline"

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

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [activityLevels, setActivityLevels] = useState<ActivityLevel[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    mode: "onChange",
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  // Fetch user profile and form data
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return

      try {
        setIsLoadingProfile(true)
        
        // Fetch activity levels and goals
        const [activityResponse, goalsResponse, profileResponse] = await Promise.all([
          axios.get('/api/activity-levels'),
          axios.get('/api/goals'),
          axios.get('/api/profile')
        ])
        
        setActivityLevels(activityResponse.data)
        setGoals(goalsResponse.data)
        
        if (profileResponse.data) {
          // Reset form with current profile data
          reset({
            age: profileResponse.data.age?.toString() || '',
            gender: profileResponse.data.gender || '',
            heightCm: profileResponse.data.heightCm?.toString() || '',
            weightKg: profileResponse.data.weightKg?.toString() || '',
            activityLevelId: profileResponse.data.activityLevelId?.toString() || '',
            goalId: profileResponse.data.goalId?.toString() || '',
          })
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setSubmitError('Failed to load profile data')
      } finally {
        setIsLoadingProfile(false)
      }
    }

    if (status === "authenticated") {
      fetchData()
    }
  }, [session, status, reset])

  const onSubmit = async (data: Record<string, string>) => {
    if (!session?.user?.id) {
      setSubmitError("You must be logged in to update your profile")
      return
    }

    try {
      setIsLoading(true)
      setSubmitError(null)
      setSubmitSuccess(null)

      // Validate data with Zod
      const validatedData = profileSchema.parse(data)

      // Make API request
      await axios.post('/api/profile', {
        userId: session.user.id,
        age: validatedData.age,
        gender: validatedData.gender,
        heightCm: validatedData.heightCm,
        weightKg: validatedData.weightKg,
        activityLevelId: validatedData.activityLevelId,
        goalId: validatedData.goalId,
      })

      setSubmitSuccess("Profile updated successfully!")
      
      // Redirect to user page after a short delay
      setTimeout(() => {
        router.push('/user')
      }, 1500)

    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.issues[0]
        setSubmitError(firstError.message)
      } else if (axios.isAxiosError(error)) {
        setSubmitError(error.response?.data?.error || 'Failed to update profile')
      } else {
        setSubmitError('An unexpected error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => router.push('/user')}
            className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>

          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
            <div className="flex items-center space-x-4 mb-2">
              <div className="p-3 bg-blue-100 rounded-lg">
                <UserIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
                <p className="text-gray-600 mt-1">Update your personal information and fitness goals</p>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information Section */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Age */}
                  <div>
                    <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                      Age *
                    </label>
                    <input
                      type="number"
                      id="age"
                      {...register("age")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 25"
                    />
                    {errors.age && (
                      <p className="mt-1 text-sm text-red-600">{errors.age.message as string}</p>
                    )}
                  </div>

                  {/* Gender */}
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                      Gender *
                    </label>
                    <select
                      id="gender"
                      {...register("gender")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.gender && (
                      <p className="mt-1 text-sm text-red-600">{errors.gender.message as string}</p>
                    )}
                  </div>

                  {/* Height */}
                  <div>
                    <label htmlFor="heightCm" className="block text-sm font-medium text-gray-700 mb-2">
                      Height (cm) *
                    </label>
                    <input
                      type="number"
                      id="heightCm"
                      {...register("heightCm")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 175"
                    />
                    {errors.heightCm && (
                      <p className="mt-1 text-sm text-red-600">{errors.heightCm.message as string}</p>
                    )}
                  </div>

                  {/* Weight */}
                  <div>
                    <label htmlFor="weightKg" className="block text-sm font-medium text-gray-700 mb-2">
                      Weight (kg) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      id="weightKg"
                      {...register("weightKg")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 70.5"
                    />
                    {errors.weightKg && (
                      <p className="mt-1 text-sm text-red-600">{errors.weightKg.message as string}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Fitness Information Section */}
              <div className="pt-6 border-t border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Fitness Information</h2>
                <div className="space-y-6">
                  {/* Activity Level */}
                  <div>
                    <label htmlFor="activityLevelId" className="block text-sm font-medium text-gray-700 mb-2">
                      Activity Level *
                    </label>
                    <select
                      id="activityLevelId"
                      {...register("activityLevelId")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select your activity level</option>
                      {activityLevels.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.name}
                        </option>
                      ))}
                    </select>
                    {errors.activityLevelId && (
                      <p className="mt-1 text-sm text-red-600">{errors.activityLevelId.message as string}</p>
                    )}
                    <p className="mt-2 text-sm text-gray-500">
                      Choose your typical daily activity level to help calculate your calorie needs
                    </p>
                  </div>

                  {/* Fitness Goal */}
                  <div>
                    <label htmlFor="goalId" className="block text-sm font-medium text-gray-700 mb-2">
                      Fitness Goal *
                    </label>
                    <select
                      id="goalId"
                      {...register("goalId")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select your fitness goal</option>
                      {goals.map((goal) => (
                        <option key={goal.id} value={goal.id}>
                          {goal.name}
                        </option>
                      ))}
                    </select>
                    {errors.goalId && (
                      <p className="mt-1 text-sm text-red-600">{errors.goalId.message as string}</p>
                    )}
                    <p className="mt-2 text-sm text-gray-500">
                      Your goal will help us customize your calorie and nutrient targets
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {submitError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{submitError}</p>
                </div>
              )}

              {/* Success Message */}
              {submitSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">{submitSuccess}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/user')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Additional Information */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> All fields marked with * are required. Your profile information helps us provide personalized calorie and nutrient recommendations based on your goals and activity level.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
