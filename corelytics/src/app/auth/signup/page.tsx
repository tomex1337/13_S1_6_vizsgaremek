"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import axios from "axios"
import { useForm } from "react-hook-form"
import Header from "@/components/header"
import Footer from "@/components/footer"

interface SignUpFormInputs {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export default function SignUp() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormInputs>()

  const onSubmit = async (data: SignUpFormInputs) => {
    setIsLoading(true)
    setError(null)

    const { email, password, confirmPassword, name } = data

    if (password !== confirmPassword) {
      setError("A jelszavak nem egyeznek")
      setIsLoading(false)
      return
    }

    try {
      await axios.post("/api/auth/register", {
        email,
        password,
        name,
      })
      router.push("/auth/signin")
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
            Hozd létre a fiókodat
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="name" className="sr-only">
                Név
              </label>
              <input
                id="name"
                {...register("name", { required: "A név megadása kötelező" })}
                type="text"
                className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Teljes név"
              />
              {errors.name && (
                <span className="text-red-500 text-xs">{errors.name.message}</span>
              )}
            </div>
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
                <span className="text-red-500 text-xs">{errors.email.message}</span>
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
                className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Jelszó"
              />
              {errors.password && (
                <span className="text-red-500 text-xs">{errors.password.message}</span>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Jelszó megerősítése
              </label>
              <input
                id="confirmPassword"
                {...register("confirmPassword", { required: "Kérlek erősítsd meg a jelszavad" })}
                type="password"
                className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Jelszó megerősítése"
              />
              {errors.confirmPassword && (
                <span className="text-red-500 text-xs">{errors.confirmPassword.message}</span>
              )}
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md bg-indigo-600 py-2 px-3 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Fiók létrehozása..." : "Regisztráció"}
            </button>
          </div>
        </form>

        <div className="text-sm text-center">
          Már van fiókod?{" "}
          <Link
            href="/auth/signin"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Jelentkezz be
          </Link>
        </div>
      </div>
    </div>
    <Footer />
    </>
  )
}
