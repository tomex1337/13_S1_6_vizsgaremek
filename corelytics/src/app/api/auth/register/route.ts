import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hash } from "bcrypt"
import { v4 as uuidv4 } from 'uuid'
import { sendWelcomeEmail } from "@/lib/email"

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json()

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      )
    }

    const hashedPassword = await hash(password, 10)
    const now = new Date()

    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email,
        username: name, // Using name as username
        passwordHash: hashedPassword,
        createdAt: now,
        updatedAt: now,
      },
    })

    // Send welcome email
    try {
      await sendWelcomeEmail(email, name)
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError)
      // Don't fail the registration if email sending fails
    }

    return NextResponse.json(
      { message: "User created successfully", user: { id: user.id, email: user.email, username: user.username } },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { message: "Error creating user" },
      { status: 500 }
    )
  }
}
