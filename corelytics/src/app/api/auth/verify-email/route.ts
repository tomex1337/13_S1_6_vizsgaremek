import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendWelcomeEmail } from "@/lib/email"

export async function POST(req: Request) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json(
        { message: "A megerősítő token megadása kötelező" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationTokenExpiry: {
          gt: new Date(),
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: "Érvénytelen vagy lejárt megerősítő link" },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationTokenExpiry: null,
        updatedAt: new Date(),
      },
    })

    try {
      await sendWelcomeEmail(user.email, user.username)
    } catch (emailError) {
      console.error("Failed to send welcome email after verification:", emailError)
    }

    return NextResponse.json(
      { message: "Email cím sikeresen megerősítve" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json(
      { message: "Valami hiba történt" },
      { status: 500 }
    )
  }
}
