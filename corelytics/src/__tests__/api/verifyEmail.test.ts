/**
 * @jest-environment node
 */
import { POST } from '@/app/api/auth/verify-email/route'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/email'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('@/lib/email', () => ({
  sendWelcomeEmail: jest.fn(() => Promise.resolve()),
}))

const mockPrismaUser = prisma.user as jest.Mocked<typeof prisma.user>
const mockSendWelcomeEmail = sendWelcomeEmail as jest.MockedFunction<typeof sendWelcomeEmail>

function createRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost:3000/api/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/verify-email', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sikeresen megerősíti az email címet', async () => {
    ;(mockPrismaUser.findFirst as jest.Mock).mockResolvedValue({
      id: 'user-id-1',
      email: 'test@test.com',
      username: 'Teszt',
    })
    ;(mockPrismaUser.update as jest.Mock).mockResolvedValue({ id: 'user-id-1' })

    const req = createRequest({ token: 'valid-token' })
    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Email cím sikeresen megerősítve')
    expect(mockPrismaUser.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-id-1' },
        data: expect.objectContaining({
          emailVerifiedAt: expect.any(Date),
          emailVerificationToken: null,
          emailVerificationTokenExpiry: null,
        }),
      })
    )
    expect(mockSendWelcomeEmail).toHaveBeenCalledWith('test@test.com', 'Teszt')
  })

  it('hibát ad vissza token nélkül', async () => {
    const req = createRequest({})
    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe('A megerősítő token megadása kötelező')
  })

  it('hibát ad vissza érvénytelen tokenre', async () => {
    ;(mockPrismaUser.findFirst as jest.Mock).mockResolvedValue(null)

    const req = createRequest({ token: 'invalid-token' })
    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe('Érvénytelen vagy lejárt megerősítő link')
  })
})
