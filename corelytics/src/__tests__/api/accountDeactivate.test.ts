/**
 * @jest-environment node
 */
/**
 * API tesztek - Account Deactivate (POST /api/account/deactivate)
 * Fiók deaktiválási végpont tesztelése
 */
import { POST } from '@/app/api/account/deactivate/route'
import { prisma } from '@/lib/prisma'
import { getServerSession, Session } from 'next-auth'

// Prisma mockolása
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      update: jest.fn(),
    },
  },
}))

// NextAuth mockolása
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

// AuthOptions mockolása
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockPrismaUser = prisma.user as jest.Mocked<typeof prisma.user>

describe('POST /api/account/deactivate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sikeresen deaktiválja a felhasználói fiókot', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-id-123', email: 'test@test.com', name: 'Teszt' },
      expires: '2026-12-31',
    })
    ;(mockPrismaUser.update as jest.Mock).mockResolvedValue({ id: 'user-id-123', isActive: false })

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('az isActive mezőt false-ra állítja', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-id-123', email: 'test@test.com', name: 'Teszt' },
      expires: '2026-12-31',
    })
    ;(mockPrismaUser.update as jest.Mock).mockResolvedValue({})

    await POST()

    expect(mockPrismaUser.update).toHaveBeenCalledWith({
      where: { id: 'user-id-123' },
      data: { isActive: false },
    })
  })

  it('401-es hibát ad vissza, ha nincs bejelentkezve', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Nincs bejelentkezve')
  })

  it('401-es hibát ad vissza, ha a session nem tartalmaz user id-t', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@test.com', name: 'Teszt' },
      expires: '2026-12-31',
    } as unknown as Session)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Nincs bejelentkezve')
  })

  it('500-as hibát ad vissza adatbázis hiba esetén', async () => {
    // Elnyomjuk a console.error-t, mert a route szándékosan logol hibát
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-id-123', email: 'test@test.com', name: 'Teszt' },
      expires: '2026-12-31',
    })
    ;(mockPrismaUser.update as jest.Mock).mockRejectedValue(new Error('DB error'))

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Nem sikerült deaktiválni a fiókot')

    consoleSpy.mockRestore()
  })
})
