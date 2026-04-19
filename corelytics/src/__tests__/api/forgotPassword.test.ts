/**
 * @jest-environment node
 */
/**
 * API tesztek - Forgot Password (POST /api/auth/forgot-password)
 * Elfelejtett jelszó végpont tesztelése
 */
import { POST } from '@/app/api/auth/forgot-password/route'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'

// Prisma mockolása
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

// Email küldés mockolása
jest.mock('@/lib/email', () => ({
  sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
}))

const mockPrismaUser = prisma.user as jest.Mocked<typeof prisma.user>
const mockSendEmail = sendPasswordResetEmail as jest.MockedFunction<typeof sendPasswordResetEmail>

function createRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost:3000/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sikeres választ ad létező felhasználó esetén', async () => {
    ;(mockPrismaUser.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-id-123',
      email: 'test@test.com',
    })
    ;(mockPrismaUser.update as jest.Mock).mockResolvedValue({})

    const req = createRequest({ email: 'test@test.com' })
    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toContain('If an account with that email exists')
  })

  it('reset tokent ment az adatbázisba', async () => {
    ;(mockPrismaUser.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-id-123',
      email: 'test@test.com',
    })
    ;(mockPrismaUser.update as jest.Mock).mockResolvedValue({})

    const req = createRequest({ email: 'test@test.com' })
    await POST(req)

    expect(mockPrismaUser.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'test@test.com' },
        data: expect.objectContaining({
          resetToken: expect.any(String),
          resetTokenExpiry: expect.any(Date),
        }),
      })
    )
  })

  it('meghívja az email küldő funkciót', async () => {
    ;(mockPrismaUser.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-id-123',
      email: 'test@test.com',
    })
    ;(mockPrismaUser.update as jest.Mock).mockResolvedValue({})

    const req = createRequest({ email: 'test@test.com' })
    await POST(req)

    expect(mockSendEmail).toHaveBeenCalledWith('test@test.com', expect.any(String))
  })

  it('ugyanazt a választ adja nem létező email esetén (biztonság)', async () => {
    ;(mockPrismaUser.findUnique as jest.Mock).mockResolvedValue(null)

    const req = createRequest({ email: 'noexist@test.com' })
    const response = await POST(req)
    const data = await response.json()

    // Biztonsági okokból ugyanazt a választ adja
    expect(response.status).toBe(200)
    expect(data.message).toContain('If an account with that email exists')
  })

  it('nem küld emailt nem létező felhasználónak', async () => {
    ;(mockPrismaUser.findUnique as jest.Mock).mockResolvedValue(null)

    const req = createRequest({ email: 'noexist@test.com' })
    await POST(req)

    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('hibát ad vissza hiányzó email esetén', async () => {
    const req = createRequest({})
    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe('Email is required')
  })

  it('nem száll el, ha az email küldés meghiúsul', async () => {
    // Elnyomjuk a console.error-t, mert a route szándékosan logol hibát
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    ;(mockPrismaUser.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-id-123',
      email: 'test@test.com',
    })
    ;(mockPrismaUser.update as jest.Mock).mockResolvedValue({})
    mockSendEmail.mockRejectedValue(new Error('Email service down'))

    const req = createRequest({ email: 'test@test.com' })
    const response = await POST(req)

    // A kérés nem hiúsul meg, még ha az email küldés igen
    expect(response.status).toBe(200)

    consoleSpy.mockRestore()
  })

  it('500-as hibát ad vissza adatbázis hiba esetén', async () => {
    // Elnyomjuk a console.error-t, mert a route szándékosan logol hibát
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    ;(mockPrismaUser.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'))

    const req = createRequest({ email: 'test@test.com' })
    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.message).toBe('Something went wrong')

    consoleSpy.mockRestore()
  })
})
