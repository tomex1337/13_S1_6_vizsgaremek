"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import axios from "axios"
import Header from "@/components/header"
import Footer from "@/components/footer"

interface ForgotPasswordInputs {
  email: string
}

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInputs>()

  const onSubmit = async (data: ForgotPasswordInputs) => {
    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      await axios.post("/api/auth/forgot-password", {
        email: data.email,
      })

      setMessage("If an account with that email exists, we sent a reset link.")
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || "Valami hiba történt")
      } else {
        setError("Valami hiba történt")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
    <Header />
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
            Elfelejtetted a jelszavad?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Add meg az email címed és küldünk egy linket a jelszó visszaállításához.
          </p>
        </div>
        
        {!message ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
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
                className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Email cím"
              />
              {errors.email && (
                <span className="text-red-500 text-xs mt-1 block">
                  {errors.email.message}
                </span>
              )}
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full justify-center rounded-md bg-indigo-600 py-2 px-3 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Küldés..." : "Visszaállító link küldése"}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-700 text-sm text-center">{message}</p>
          </div>
        )}

        <div className="text-sm text-center space-y-2">
          <div>
            <Link
              href="/auth/signin"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Vissza a bejelentkezéshez
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
