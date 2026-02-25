import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Felhasználó saját fiókjának deaktiválása
export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nincs bejelentkezve' },
        { status: 401 }
      )
    }

    // Felhasználó inaktívvá tétele
    await prisma.user.update({
      where: { id: session.user.id },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Account deactivation error:', error)
    return NextResponse.json(
      { error: 'Nem sikerült deaktiválni a fiókot' },
      { status: 500 }
    )
  }
}
