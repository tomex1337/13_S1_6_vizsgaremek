import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hash } from "bcrypt"
import { v4 as uuidv4 } from 'uuid'
import { randomBytes } from "crypto"
import { sendEmailVerificationEmail } from "@/lib/email"

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json()
    const verificationToken = randomBytes(32).toString('hex')
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Néhány alapvető validáció
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    })

    // Ha a felhasználó létezik, de inaktív, újraaktiváljuk
    if (existingUserByEmail && !existingUserByEmail.isActive) {
      const hashedPassword = await hash(password, 10)
      const now = new Date()

      const reactivatedUser = await prisma.user.update({
        where: { id: existingUserByEmail.id },
        data: {
          passwordHash: hashedPassword,
          username: name,
          isActive: true,
          emailVerifiedAt: null,
          emailVerificationToken: verificationToken,
          emailVerificationTokenExpiry: verificationTokenExpiry,
          updatedAt: now,
        },
      })

      // Verifikációs email küldése
      try {
        await sendEmailVerificationEmail(email, verificationToken)
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError)
      }

      return NextResponse.json(
        { message: "Fiók sikeresen újraaktiválva. Ellenőrizd az emailedet a megerősítéshez.", user: { id: reactivatedUser.id, email: reactivatedUser.email, username: reactivatedUser.username } },
        { status: 201 }
      )
    }

    if (existingUserByEmail) {
      return NextResponse.json(
        { message: "Ezzel az email címmel már létezik felhasználó" },
        { status: 400 }
      )
    }

    // Felhasználónév ellenőrzése - csak aktív felhasználóknál
    const existingUserByUsername = await prisma.user.findFirst({
      where: { username: name, isActive: true },
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
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpiry: verificationTokenExpiry,
        createdAt: now,
        updatedAt: now,
      },
    })

    // Verifikációs email küldése
    try {
      await sendEmailVerificationEmail(email, verificationToken)
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError)
      // Ne akadályozza meg a regisztrációt, ha az email küldés sikertelen
    }

    return NextResponse.json(
      { message: "Felhasználó sikeresen létrehozva. Ellenőrizd az emailedet a megerősítéshez.", user: { id: user.id, email: user.email, username: user.username } },
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
