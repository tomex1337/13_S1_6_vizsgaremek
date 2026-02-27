/**
 * @jest-environment node
 */
/**
 * API tesztek - Reset Password (POST /api/auth/reset-password)
 * Jelszó visszaállítási végpont tesztelése
 */
import { POST } from '@/app/api/auth/reset-password/route'
import { prisma } from '@/lib/prisma'

// Prisma mockolása
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))

// bcrypt mockolása
jest.mock('bcrypt', () => ({
  hash: jest.fn(() => Promise.resolve('new_hashed_password')),
}))

const mockPrismaUser = prisma.user as jest.Mocked<typeof prisma.user>

function createRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost:3000/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sikeresen visszaállítja a jelszót érvényes tokennel', async () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    ;(mockPrismaUser.findFirst as jest.Mock).mockResolvedValue({
      id: 'user-id-123',
      resetToken: 'valid-token',
      resetTokenExpiry: futureDate,
    })
    ;(mockPrismaUser.update as jest.Mock).mockResolvedValue({
      id: 'user-id-123',
    })

    const req = createRequest({
      token: 'valid-token',
      password: 'uj_jelszo_123',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Jelszó sikeresen visszaállítva')
  })

  it('törli a reset tokent a sikeres visszaállítás után', async () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    ;(mockPrismaUser.findFirst as jest.Mock).mockResolvedValue({
      id: 'user-id-123',
      resetToken: 'valid-token',
      resetTokenExpiry: futureDate,
    })
    ;(mockPrismaUser.update as jest.Mock).mockResolvedValue({
      id: 'user-id-123',
    })

    const req = createRequest({
      token: 'valid-token',
      password: 'uj_jelszo',
    })

    await POST(req)

    expect(mockPrismaUser.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          resetToken: null,
          resetTokenExpiry: null,
        }),
      })
    )
  })

  it('hibát ad vissza érvénytelen tokennel', async () => {
    ;(mockPrismaUser.findFirst as jest.Mock).mockResolvedValue(null)

    const req = createRequest({
      token: 'invalid-token',
      password: 'uj_jelszo',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe('Érvénytelen vagy lejárt visszaállító token')
  })

  it('hibát ad vissza hiányzó token esetén', async () => {
    const req = createRequest({
      password: 'uj_jelszo',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe('Token és jelszó megadása kötelező')
  })

  it('hibát ad vissza hiányzó jelszó esetén', async () => {
    const req = createRequest({
      token: 'valid-token',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe('Token és jelszó megadása kötelező')
  })

  it('hibát ad vissza üres body esetén', async () => {
    const req = createRequest({})

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe('Token és jelszó megadása kötelező')
  })

  it('a válasz tartalmazza a no-cache fejlécet', async () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    ;(mockPrismaUser.findFirst as jest.Mock).mockResolvedValue({
      id: 'user-id-123',
      resetToken: 'valid-token',
      resetTokenExpiry: futureDate,
    })
    ;(mockPrismaUser.update as jest.Mock).mockResolvedValue({
      id: 'user-id-123',
    })

    const req = createRequest({
      token: 'valid-token',
      password: 'uj_jelszo',
    })

    const response = await POST(req)

    expect(response.headers.get('Cache-Control')).toContain('no-store')
  })

  it('500-as hibát ad vissza adatbázis hiba esetén', async () => {
    // Elnyomjuk a console.error-t, mert a route szándékosan logol hibát
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    ;(mockPrismaUser.findFirst as jest.Mock).mockRejectedValue(new Error('DB error'))

    const req = createRequest({
      token: 'valid-token',
      password: 'uj_jelszo',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.message).toBe('Valami hiba történt')

    consoleSpy.mockRestore()
  })
})
