import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hash } from "bcrypt"
import { v4 as uuidv4 } from 'uuid'
import { sendWelcomeEmail } from "@/lib/email"

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json()

    // Check if user with this email already exists
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUserByEmail) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Check if user with this username already exists
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username: name },
    })

    if (existingUserByUsername) {
      return NextResponse.json(
        { message: "Username already taken" },
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
    
    // Handle specific Prisma errors
    if (error instanceof Error && error.message.includes("Unique constraint failed")) {
      return NextResponse.json(
        { message: "Username or email already exists" },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { message: "Error creating user" },
      { status: 500 }
    )
  }
}
