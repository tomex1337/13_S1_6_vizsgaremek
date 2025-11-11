"use client"

import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import axios from "axios"
import Header from "@/components/header"
import Footer from "@/components/footer"

interface SignInFormInputs {
  email: string
  password: string
}

export default function SignIn() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormInputs>()

  const onSubmit = async (data: SignInFormInputs) => {
    const { email, password } = data
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      if (result?.error) {
        setError("Érvénytelen bejelentkezési adatok")
        return
      }
      
      // Check if user has completed their profile
      try {
        await axios.get('/api/profile')
        // Profile exists, go to home
        router.push("/")
      } catch (profileError) {
        if (axios.isAxiosError(profileError) && profileError.response?.status === 404) {
          // Profile doesn't exist, redirect to complete profile
          router.push("/auth/complete_profile")
        } else {
          // Some other error, still go to home but user can complete profile later
          router.push("/")
        }
      }
      
      router.refresh()
    } catch (_) {
      console.error(_);
      setError("Valami hiba történt")
    }
  }

  return (
    <>
    <Header />
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
            Jelentkezz be a fiókodba
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">
                Email cím
              </label>
              <input
                id="email"
                {...register("email", {
                  required: "Az email cím megadása kötelező",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Érvénytelen email cím",
                  },
                })}
                type="email"
                className="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Email cím"
              />
              {errors.email && (
                <span className="text-red-500 text-xs">
                  {errors.email.message}
                </span>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Jelszó
              </label>
              <input
                id="password"
                {...register("password", { required: "A jelszó megadása kötelező" })}
                type="password"
                className="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Jelszó"
              />
              {errors.password && (
                <span className="text-red-500 text-xs">
                  {errors.password.message}
                </span>
              )}
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-md bg-indigo-600 py-2 px-3 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Bejelentkezés
            </button>
          </div>
        </form>

        <div className="text-sm text-center space-y-2">
          <div>
            <Link
              href="/auth/forgot-password"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Elfelejtetted a jelszavad?
            </Link>
          </div>
          <div>
            Még nincs fiókod?{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Regisztrálj
            </Link>
          </div>
        </div>
      </div>
    </div>
    <Footer />
    </>
  )
}
