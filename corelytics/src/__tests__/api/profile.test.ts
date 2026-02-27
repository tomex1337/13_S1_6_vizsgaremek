/**
 * @jest-environment node
 */
/**
 * API tesztek - Profile (GET & POST /api/profile)
 * Profil végpont tesztelése
 */
import { GET, POST } from '@/app/api/profile/route'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'

// Prisma mockolása
jest.mock('@/lib/prisma', () => ({
  prisma: {
    userProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    dailyGoal: {
      upsert: jest.fn(),
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
const mockPrismaProfile = prisma.userProfile as jest.Mocked<typeof prisma.userProfile>
const mockPrismaDailyGoal = prisma.dailyGoal as jest.Mocked<typeof prisma.dailyGoal>

function createNextRequest(body?: Record<string, unknown>): NextRequest {
  const url = 'http://localhost:3000/api/profile'
  if (body) {
    return new NextRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }
  return new NextRequest(url, { method: 'GET' })
}

describe('GET /api/profile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('visszaadja a profilt bejelentkezett felhasználónak', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-id-123', email: 'test@test.com', name: 'Teszt' },
      expires: '2026-12-31',
    })
    ;(mockPrismaProfile.findUnique as jest.Mock).mockResolvedValue({
      user_id: 'user-id-123',
      gender: 'male',
      heightCm: 180,
      weightKg: 80,
      activityLevel: { id: 2, name: 'Ülő életmód' },
      goal: { id: 2, name: 'Súlytartás' },
    })

    const req = createNextRequest()
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.gender).toBe('male')
    expect(data.heightCm).toBe(180)
  })

  it('401-es hibát ad vissza, ha nincs bejelentkezve', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const req = createNextRequest()
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('404-es hibát ad vissza, ha nincs profil', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-id-123', email: 'test@test.com', name: 'Teszt' },
      expires: '2026-12-31',
    })
    ;(mockPrismaProfile.findUnique as jest.Mock).mockResolvedValue(null)

    const req = createNextRequest()
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Profil nem található')
  })

  it('lekérdezi a profilt az aktív szinttel és céllal együtt', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-id-123', email: 'test@test.com', name: 'Teszt' },
      expires: '2026-12-31',
    })
    ;(mockPrismaProfile.findUnique as jest.Mock).mockResolvedValue({
      user_id: 'user-id-123',
    })

    const req = createNextRequest()
    await GET(req)

    expect(mockPrismaProfile.findUnique).toHaveBeenCalledWith({
      where: { user_id: 'user-id-123' },
      include: { activityLevel: true, goal: true },
    })
  })

  it('500-as hibát ad vissza adatbázis hiba esetén', async () => {
    // Elnyomjuk a console.error-t, mert a route szándékosan logol hibát
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-id-123', email: 'test@test.com', name: 'Teszt' },
      expires: '2026-12-31',
    })
    ;(mockPrismaProfile.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'))

    const req = createNextRequest()
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Nem sikerült betölteni a profilt')

    consoleSpy.mockRestore()
  })
})

describe('POST /api/profile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('létrehoz egy új profilt', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-id-123', email: 'test@test.com', name: 'Teszt' },
      expires: '2026-12-31',
    })
    ;(mockPrismaProfile.findUnique as jest.Mock).mockResolvedValue(null)
    ;(mockPrismaProfile.create as jest.Mock).mockResolvedValue({
      user_id: 'user-id-123',
      gender: 'male',
      heightCm: 180,
    })

    const req = createNextRequest({
      userId: 'user-id-123',
      gender: 'male',
      heightCm: 180,
    })

    const response = await POST(req)
    expect(response.status).toBe(200)
    expect(mockPrismaProfile.create).toHaveBeenCalled()
  })

  it('frissíti a meglévő profilt', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-id-123', email: 'test@test.com', name: 'Teszt' },
      expires: '2026-12-31',
    })
    ;(mockPrismaProfile.findUnique as jest.Mock).mockResolvedValue({
      user_id: 'user-id-123',
      gender: 'male',
    })
    ;(mockPrismaProfile.update as jest.Mock).mockResolvedValue({
      user_id: 'user-id-123',
      gender: 'female',
    })

    const req = createNextRequest({
      userId: 'user-id-123',
      gender: 'female',
    })

    const response = await POST(req)
    expect(response.status).toBe(200)
    expect(mockPrismaProfile.update).toHaveBeenCalled()
  })

  it('401-es hibát ad vissza, ha nincs bejelentkezve', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const req = createNextRequest({
      userId: 'user-id-123',
      gender: 'male',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('403-as hibát ad vissza, ha a userId nem egyezik a session-nel', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-id-123', email: 'test@test.com', name: 'Teszt' },
      expires: '2026-12-31',
    })

    const req = createNextRequest({
      userId: 'masik-user-id',
      gender: 'male',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Forbidden')
  })

  it('400-as hibát ad vissza érvénytelen nemmel', async () => {
    // Elnyomjuk a console.error-t, mert a route szándékosan logol validációs hibát
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-id-123', email: 'test@test.com', name: 'Teszt' },
      expires: '2026-12-31',
    })

    const req = createNextRequest({
      userId: 'user-id-123',
      gender: 'invalid_gender',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validációs hiba')

    consoleSpy.mockRestore()
  })

  it('400-as hibát ad vissza érvénytelen magassággal (túl alacsony)', async () => {
    // Elnyomjuk a console.error-t, mert a route szándékosan logol validációs hibát
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-id-123', email: 'test@test.com', name: 'Teszt' },
      expires: '2026-12-31',
    })

    const req = createNextRequest({
      userId: 'user-id-123',
      heightCm: 10,
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validációs hiba')

    consoleSpy.mockRestore()
  })

  it('400-as hibát ad vissza érvénytelen súllyal (túl magas)', async () => {
    // Elnyomjuk a console.error-t, mert a route szándékosan logol validációs hibát
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-id-123', email: 'test@test.com', name: 'Teszt' },
      expires: '2026-12-31',
    })

    const req = createNextRequest({
      userId: 'user-id-123',
      weightKg: 600,
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validációs hiba')

    consoleSpy.mockRestore()
  })

  it('napi célokat számol teljes profil esetén', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-id-123', email: 'test@test.com', name: 'Teszt' },
      expires: '2026-12-31',
    })
    ;(mockPrismaProfile.findUnique as jest.Mock).mockResolvedValue(null)
    ;(mockPrismaProfile.create as jest.Mock).mockResolvedValue({
      user_id: 'user-id-123',
    })
    ;(mockPrismaDailyGoal.upsert as jest.Mock).mockResolvedValue({})

    const req = createNextRequest({
      userId: 'user-id-123',
      birthDate: '2000-01-15',
      gender: 'male',
      heightCm: 180,
      weightKg: 80,
      activityLevelId: 2,
      goalId: 2,
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.dailyGoals).toBeDefined()
    expect(data.dailyGoals.caloriesGoal).toBeGreaterThan(0)
    expect(data.dailyGoals.proteinGoal).toBeGreaterThan(0)
    expect(data.dailyGoals.fatGoal).toBeGreaterThan(0)
    expect(data.dailyGoals.carbsGoal).toBeGreaterThan(0)
    expect(data.message).toBe('Profil sikeresen kitöltve és napi célok kiszámítva!')
  })

  it('upsert-tel frissíti a napi célokat', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-id-123', email: 'test@test.com', name: 'Teszt' },
      expires: '2026-12-31',
    })
    ;(mockPrismaProfile.findUnique as jest.Mock).mockResolvedValue(null)
    ;(mockPrismaProfile.create as jest.Mock).mockResolvedValue({})
    ;(mockPrismaDailyGoal.upsert as jest.Mock).mockResolvedValue({})

    const req = createNextRequest({
      userId: 'user-id-123',
      birthDate: '2000-01-15',
      gender: 'male',
      heightCm: 180,
      weightKg: 80,
      activityLevelId: 2,
      goalId: 2,
    })

    await POST(req)

    expect(mockPrismaDailyGoal.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          user_id_date: expect.objectContaining({
            user_id: 'user-id-123',
          }),
        }),
      })
    )
  })
})
