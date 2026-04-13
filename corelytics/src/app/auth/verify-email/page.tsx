"use client"

import { useEffect, useState } from "react"
import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import axios from "axios"
import Header from "@/components/header"
import Footer from "@/components/footer"

type VerificationStatus = "loading" | "success" | "error"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<VerificationStatus>("loading")
  const [message, setMessage] = useState("Email cím megerősítése folyamatban...")

  useEffect(() => {
    const token = searchParams.get("token")

    if (!token) {
      setStatus("error")
      setMessage("Hiányzó megerősítő token")
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await axios.post("/api/auth/verify-email", { token })
        setStatus("success")
        setMessage(response.data?.message || "Email cím sikeresen megerősítve")
      } catch (error) {
        if (axios.isAxiosError(error)) {
          setMessage(error.response?.data?.message || "Valami hiba történt")
        } else {
          setMessage("Valami hiba történt")
        }
        setStatus("error")
      }
    }

    void verifyEmail()
  }, [searchParams])

  return (
    <>
      <Header />
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6 rounded-lg bg-gray-100 p-10 shadow-lg dark:bg-gray-900">
          <h2 className="text-center text-3xl font-bold tracking-tight">Email megerősítés</h2>

          <div
            className={`rounded-md px-4 py-3 text-sm text-center ${
              status === "success"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : status === "error"
                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
            }`}
          >
            {message}
          </div>

          <Link
            href="/auth/signin"
            className="group relative flex w-full justify-center rounded-md bg-indigo-700 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-600 dark:bg-indigo-300 dark:text-gray-900 dark:hover:bg-indigo-400"
          >
            Tovább a bejelentkezéshez
          </Link>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  )
}
