"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import axios from "axios"
import Header from "@/components/header"
import Footer from "@/components/footer"

interface ResetPasswordInputs {
  password: string
  confirmPassword: string
}

export default function ResetPassword() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordInputs>()

  const password = watch("password")

  const onSubmit = async (data: ResetPasswordInputs) => {
    setIsLoading(true)
    setError(null)

    if (data.password !== data.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      await axios.post("/api/auth/reset-password", {
        token,
        password: data.password,
      })

      setSuccess(true)
      setTimeout(() => {
        router.push("/auth/signin")
      }, 3000)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || "Something went wrong")
      } else {
        setError("Something went wrong")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <>
      <Header />
      <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Invalid Reset Link</h2>
          <p className="mt-2 text-gray-600">This password reset link is invalid.</p>
          <Link
            href="/auth/forgot-password"
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-500"
          >
            Request a new reset link
          </Link>
        </div>
      </div>
      <Footer />
      </>
    )
  }

  if (success) {
    return (
      <>
      <Header />
      <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-md text-center">
          <div className="p-6 bg-green-50 border border-green-200 rounded-md">
            <h2 className="text-2xl font-bold text-green-800 mb-2">Password Reset Successfully!</h2>
            <p className="text-green-700">Your password has been updated. You&apos;ll be redirected to sign in shortly.</p>
          </div>
          <Link
            href="/auth/signin"
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-500"
          >
            Go to sign in now
          </Link>
        </div>
      </div>
      <Footer />
      </>
    )
  }

  return (
    <>
    <Header />
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-gray-100 dark:bg-gray-900 p-10 rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
            Jelszó visszaállítás
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Add meg az új jelszavadat az alábbi űrlapon.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="sr-only">
                Új Jelszó
              </label>
              <input
                id="password"
                {...register("password", {
                  required: "A jelszó megadása kötelező",
                  minLength: {
                    value: 8,
                    message: "A jelszónak legalább 8 karakter hosszúnak kell lennie",
                  },
                })}
                type="password"
                className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Új jelszó"
              />
              {errors.password && (
                <span className="text-red-500 text-xs mt-1 block">
                  {errors.password.message}
                </span>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Új jelszó megerősítése
              </label>
              <input
                id="confirmPassword"
                {...register("confirmPassword", {
                  required: "A jelszó megerősítése kötelező",
                  validate: (value) =>
                    value === password || "Jelszavak nem egyeznek",
                })}
                type="password"
                className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Új jelszó megerősítése"
              />
              {errors.confirmPassword && (
                <span className="text-red-500 text-xs mt-1 block">
                  {errors.confirmPassword.message}
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
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md bg-indigo-600 py-2 px-3 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Visszállítás..." : "Jelszó visszaállítása"}
            </button>
          </div>
        </form>

        <div className="text-sm text-center">
          <Link
            href="/auth/signin"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Vissza a bejelentkezéshez
            </Link>
        </div>
      </div>
    </div>
    <Footer />
    </>
  )
}