/**
 * @jest-environment node
 */
/**
 * API tesztek - Register (POST /api/auth/register)
 * Regisztrációs végpont tesztelése
 */
import { POST } from '@/app/api/auth/register/route'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcrypt'

// Prisma mockolása
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

// bcrypt mockolása
jest.mock('bcrypt', () => ({
  hash: jest.fn(() => Promise.resolve('hashed_password_123')),
}))

// uuid mockolása
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}))

// email mockolása
jest.mock('@/lib/email', () => ({
  sendWelcomeEmail: jest.fn(() => Promise.resolve()),
}))

const mockPrismaUser = prisma.user as jest.Mocked<typeof prisma.user>

// Segédfüggvény a Request objektum létrehozásához
function createRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sikeresen létrehoz egy új felhasználót', async () => {
    ;(mockPrismaUser.findUnique as jest.Mock).mockResolvedValue(null)
    ;(mockPrismaUser.findFirst as jest.Mock).mockResolvedValue(null)
    ;(mockPrismaUser.create as jest.Mock).mockResolvedValue({
      id: 'test-uuid-1234',
      email: 'test@test.com',
      username: 'Teszt User',
    })

    const req = createRequest({
      email: 'test@test.com',
      password: 'jelszo123',
      name: 'Teszt User',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.message).toBe('Felhasználó sikeresen létrehozva')
    expect(data.user.email).toBe('test@test.com')
    expect(data.user.username).toBe('Teszt User')
  })

  it('hibát ad vissza, ha az email már foglalt', async () => {
    ;(mockPrismaUser.findUnique as jest.Mock).mockResolvedValue({
      id: 'existing-user',
      email: 'test@test.com',
      isActive: true,
    })

    const req = createRequest({
      email: 'test@test.com',
      password: 'jelszo123',
      name: 'Teszt User',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe('Ezzel az email címmel már létezik felhasználó')
  })

  it('hibát ad vissza, ha a felhasználónév már foglalt', async () => {
    ;(mockPrismaUser.findUnique as jest.Mock).mockResolvedValue(null)
    ;(mockPrismaUser.findFirst as jest.Mock).mockResolvedValue({
      id: 'existing-user',
      username: 'Teszt User',
      isActive: true,
    })

    const req = createRequest({
      email: 'new@test.com',
      password: 'jelszo123',
      name: 'Teszt User',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe('Ez a felhasználónév már foglalt')
  })

  it('újraaktiválja az inaktív felhasználót', async () => {
    ;(mockPrismaUser.findUnique as jest.Mock).mockResolvedValue({
      id: 'inactive-user-id',
      email: 'inactive@test.com',
      isActive: false,
    })
    ;(mockPrismaUser.update as jest.Mock).mockResolvedValue({
      id: 'inactive-user-id',
      email: 'inactive@test.com',
      username: 'Reaktivált User',
    })

    const req = createRequest({
      email: 'inactive@test.com',
      password: 'uj_jelszo',
      name: 'Reaktivált User',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.message).toBe('Fiók sikeresen újraaktiválva')
    expect(mockPrismaUser.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'inactive-user-id' },
        data: expect.objectContaining({ isActive: true }),
      })
    )
  })

  it('a jelszó hashelt formában kerül tárolásra', async () => {
    ;(mockPrismaUser.findUnique as jest.Mock).mockResolvedValue(null)
    ;(mockPrismaUser.findFirst as jest.Mock).mockResolvedValue(null)
    ;(mockPrismaUser.create as jest.Mock).mockResolvedValue({
      id: 'test-uuid-1234',
      email: 'test@test.com',
      username: 'Teszt',
    })

    const req = createRequest({
      email: 'test@test.com',
      password: 'titkos_jelszo',
      name: 'Teszt',
    })

    await POST(req)

    expect(hash).toHaveBeenCalledWith('titkos_jelszo', 10)
    expect(mockPrismaUser.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          passwordHash: 'hashed_password_123',
        }),
      })
    )
  })

  it('UUID-t generál az új felhasználónak', async () => {
    ;(mockPrismaUser.findUnique as jest.Mock).mockResolvedValue(null)
    ;(mockPrismaUser.findFirst as jest.Mock).mockResolvedValue(null)
    ;(mockPrismaUser.create as jest.Mock).mockResolvedValue({
      id: 'test-uuid-1234',
      email: 'test@test.com',
      username: 'Teszt',
    })

    const req = createRequest({
      email: 'test@test.com',
      password: 'jelszo',
      name: 'Teszt',
    })

    await POST(req)

    expect(mockPrismaUser.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id: 'test-uuid-1234',
        }),
      })
    )
  })

  it('500-as hibát ad vissza adatbázis hiba esetén', async () => {
    // Elnyomjuk a console.error-t, mert a route szándékosan logol hibát
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    ;(mockPrismaUser.findUnique as jest.Mock).mockRejectedValue(new Error('DB connection failed'))

    const req = createRequest({
      email: 'test@test.com',
      password: 'jelszo',
      name: 'Teszt',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.message).toBe('Hiba a felhasználó létrehozása során')

    consoleSpy.mockRestore()
  })
})
