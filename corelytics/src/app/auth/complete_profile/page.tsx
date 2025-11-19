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
  birthDate: z.string()
    .refine((val) => val !== "", { message: "A születési dátum megadása kötelező" })
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, { message: "Érvényes születési dátumot adj meg" })
    .refine((val) => {
      const date = new Date(val);
      const age = Math.floor((new Date().getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      return age >= 13;
    }, { message: "Legalább 13 évesnek kell lenned" })
    .refine((val) => {
      const date = new Date(val);
      const age = Math.floor((new Date().getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      return age <= 120;
    }, { message: "Érvénytelen születési dátum" })
    .transform((val) => new Date(val)),
  
  gender: z.string()
    .refine((val) => val !== "", { message: "A nem megadása kötelező" })
    .refine((val) => ["male", "female", "other"].includes(val), {
      message: "Kérlek válassz érvényes nemet"
    }),
  
  heightCm: z.string()
    .refine((val) => val !== "", { message: "A magasság megadása kötelező" })
    .refine((val) => !isNaN(Number(val)), { message: "A magasságnak érvényes számnak kell lennie" })
    .transform((val) => Number(val))
    .refine((val) => val >= 50, { message: "A magasságnak legalább 50 cm-nek kell lennie" })
    .refine((val) => val <= 300, { message: "A magasságnak kevesebb mint 300 cm-nek kell lennie" }),
  
  weightKg: z.string()
    .refine((val) => val !== "", { message: "A súly megadása kötelező" })
    .refine((val) => !isNaN(Number(val)), { message: "A súlynak érvényes számnak kell lennie" })
    .transform((val) => Number(val))
    .refine((val) => val >= 20, { message: "A súlynak legalább 20 kg-nak kell lennie" })
    .refine((val) => val <= 500, { message: "A súlynak kevesebb mint 500 kg-nak kell lennie" }),
  
  activityLevelId: z.string()
    .refine((val) => val !== "", { message: "Az aktivitási szint megadása kötelező" })
    .refine((val) => !isNaN(Number(val)), { message: "Kérlek válassz érvényes aktivitási szintet" })
    .transform((val) => Number(val)),
  
  goalId: z.string()
    .refine((val) => val !== "", { message: "A fitness cél megadása kötelező" })
    .refine((val) => !isNaN(Number(val)), { message: "Kérlek válassz érvényes fitness célt" })
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
      setSubmitError("A munkamenet lejárt. Kérlek jelentkezz be újra.")
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
        setSubmitError(`Kérlek javítsd a következő hibákat: ${errorMessages.join(', ')}`)
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
        setSubmitError(`Hiba a profil létrehozása során: ${errorMessage}`)
      } else {
        setSubmitError("Váratlan hiba történt. Kérlek próbáld újra.")
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
          <p className="text-lg">Kérlek jelentkezz be a profil kiegészítéséhez.</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Profil kiegészítése</h1>
          <p className="mt-2 text-gray-600">
            Segíts nekünk személyre szabni a fitness utadat
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow rounded-lg px-6 py-8 space-y-6">
          {/* Birth Date */}
          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
              Születési dátum *
            </label>
            <input
              type="date"
              id="birthDate"
              {...register("birthDate")}
              required
              max={new Date().toISOString().split('T')[0]}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {/* Gender */}
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
              Nem *
            </label>
            <select
              id="gender"
              {...register("gender")}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Válassz nemet</option>
              <option value="male">Férfi</option>
              <option value="female">Nő</option>
              <option value="other">Egyéb</option>
            </select>
          </div>

          {/* Height */}
          <div>
            <label htmlFor="heightCm" className="block text-sm font-medium text-gray-700">
              Magasság (cm) *
            </label>
            <input
              type="number"
              id="heightCm"
              {...register("heightCm")}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Add meg a magasságod cm-ben"
            />
          </div>

          {/* Weight */}
          <div>
            <label htmlFor="weightKg" className="block text-sm font-medium text-gray-700">
              Súly (kg) *
            </label>
            <input
              type="number"
              step="0.1"
              id="weightKg"
              {...register("weightKg")}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Add meg a súlyod kg-ban"
            />
          </div>

          {/* Activity Level */}
          <div>
            <label htmlFor="activityLevelId" className="block text-sm font-medium text-gray-700">
              Aktivitási szint *
            </label>
            <select
              id="activityLevelId"
              {...register("activityLevelId")}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Válassz aktivitási szintet</option>
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
              Fitness cél *
            </label>
            <select
              id="goalId"
              {...register("goalId")}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Válaszd ki a célodat</option>
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
              {isLoading ? "Profil létrehozása..." : "Profil kiegészítése"}
            </button>
          </div>

          {/* Skip Button */}
          <div>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Kihagyás egyelőre
            </button>
          </div>
        </form>
      </div>
    </div>
    <Footer />
    </>
  )
}
