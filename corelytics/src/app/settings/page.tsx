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
    }, { message: "Érvénytelen születési dátum" }),
  
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
          // Convert birthDate to YYYY-MM-DD format for date input
          let birthDateValue = '';
          if (profileResponse.data.birthDate) {
            const date = new Date(profileResponse.data.birthDate);
            birthDateValue = date.toISOString().split('T')[0];
          }
          
          // Reset form with current profile data
          reset({
            birthDate: birthDateValue,
            gender: profileResponse.data.gender || '',
            heightCm: profileResponse.data.heightCm?.toString() || '',
            weightKg: profileResponse.data.weightKg?.toString() || '',
            activityLevelId: profileResponse.data.activityLevel_id?.toString() || '',
            goalId: profileResponse.data.goal_id?.toString() || '',
          })
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setSubmitError('Nem sikerült betölteni a profil adatokat')
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
      setSubmitError("Be kell jelentkezned a profil frissítéséhez")
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
        birthDate: validatedData.birthDate,
        gender: validatedData.gender,
        heightCm: validatedData.heightCm,
        weightKg: validatedData.weightKg,
        activityLevelId: validatedData.activityLevelId,
        goalId: validatedData.goalId,
      })

      setSubmitSuccess("Profil sikeresen frissítve!")
      
      // Redirect to user page after a short delay
      setTimeout(() => {
        router.push('/user')
      }, 1500)

    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.issues[0]
        setSubmitError(firstError.message)
      } else if (axios.isAxiosError(error)) {
        setSubmitError(error.response?.data?.error || 'Nem sikerült frissíteni a profilt')
      } else {
        setSubmitError('Váratlan hiba történt')
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
            Vissza a vezérlőpultra
          </button>

          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
            <div className="flex items-center space-x-4 mb-2">
              <div className="p-3 bg-blue-100 rounded-lg">
                <UserIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Profil beállítások</h1>
                <p className="text-gray-600 mt-1">Frissítsd személyes adataidat és fitness céljaidat</p>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information Section */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Személyes adatok</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Birth Date */}
                  <div>
                    <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Születési dátum *
                    </label>
                    <input
                      type="date"
                      id="birthDate"
                      {...register("birthDate")}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.birthDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.birthDate.message as string}</p>
                    )}
                  </div>

                  {/* Gender */}
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                      Nem *
                    </label>
                    <select
                      id="gender"
                      {...register("gender")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Válassz nemet</option>
                      <option value="male">Férfi</option>
                      <option value="female">Nő</option>
                      <option value="other">Egyéb</option>
                    </select>
                    {errors.gender && (
                      <p className="mt-1 text-sm text-red-600">{errors.gender.message as string}</p>
                    )}
                  </div>

                  {/* Height */}
                  <div>
                    <label htmlFor="heightCm" className="block text-sm font-medium text-gray-700 mb-2">
                      Magasság (cm) *
                    </label>
                    <input
                      type="number"
                      id="heightCm"
                      {...register("heightCm")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="pl. 175"
                    />
                    {errors.heightCm && (
                      <p className="mt-1 text-sm text-red-600">{errors.heightCm.message as string}</p>
                    )}
                  </div>

                  {/* Weight */}
                  <div>
                    <label htmlFor="weightKg" className="block text-sm font-medium text-gray-700 mb-2">
                      Súly (kg) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      id="weightKg"
                      {...register("weightKg")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="pl. 70.5"
                    />
                    {errors.weightKg && (
                      <p className="mt-1 text-sm text-red-600">{errors.weightKg.message as string}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Fitness Information Section */}
              <div className="pt-6 border-t border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Fitness információk</h2>
                <div className="space-y-6">
                  {/* Activity Level */}
                  <div>
                    <label htmlFor="activityLevelId" className="block text-sm font-medium text-gray-700 mb-2">
                      Aktivitási szint *
                    </label>
                    <select
                      id="activityLevelId"
                      {...register("activityLevelId")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Válaszd ki az aktivitási szintedet</option>
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
                      Válaszd ki a tipikus napi aktivitási szintedet a kalóriaszükséglet számításához
                    </p>
                  </div>

                  {/* Fitness Goal */}
                  <div>
                    <label htmlFor="goalId" className="block text-sm font-medium text-gray-700 mb-2">
                      Fitness cél *
                    </label>
                    <select
                      id="goalId"
                      {...register("goalId")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Válaszd ki a fitness célodat</option>
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
                      A célod segít nekünk személyre szabni a kalória- és tápanyagcélokat
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
                  {isLoading ? 'Mentés...' : 'Változtatások mentése'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/user')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Mégse
                </button>
              </div>
            </form>
          </div>

          {/* Additional Information */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Megjegyzés:</strong> Az összes *-gal jelölt mező kötelező. A profil információid segítenek nekünk személyre szabott kalória- és tápanyag-ajánlásokat nyújtani a céljaid és aktivitási szinted alapján.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
