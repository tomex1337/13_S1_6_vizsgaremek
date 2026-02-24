import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hash } from "bcrypt"
import { v4 as uuidv4 } from 'uuid'
import { sendWelcomeEmail } from "@/lib/email"

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json()

    // Néhány alapvető validáció
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUserByEmail) {
      return NextResponse.json(
        { message: "Ezzel az email címmel már létezik felhasználó" },
        { status: 400 }
      )
    }

    // Felhasználónév ellenőrzése
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username: name },
    })

    if (existingUserByUsername) {
      return NextResponse.json(
        { message: "Ez a felhasználónév már foglalt" },
        { status: 400 }
      )
    }

    const hashedPassword = await hash(password, 10)
    const now = new Date()

    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email,
        username: name, // nevezze el a mezőt username-nek
        passwordHash: hashedPassword,
        createdAt: now,
        updatedAt: now,
      },
    })

    // Email küldése
    try {
      await sendWelcomeEmail(email, name)
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError)
      // Ne akadályozza meg a regisztrációt, ha az email küldés sikertelen
    }

    return NextResponse.json(
      { message: "Felhasználó sikeresen létrehozva", user: { id: user.id, email: user.email, username: user.username } },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    
    // Prisma egyedi megszorítási hibakezelés
    if (error instanceof Error && error.message.includes("Unique constraint failed")) {
      return NextResponse.json(
        { message: "A felhasználónév vagy email cím már létezik" },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { message: "Hiba a felhasználó létrehozása során" },
      { status: 500 }
    )
  }
}
