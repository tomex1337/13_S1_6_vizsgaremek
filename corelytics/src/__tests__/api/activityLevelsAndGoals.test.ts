/**
 * @jest-environment node
 */
/**
 * API tesztek - Activity Levels & Goals (GET /api/activity-levels, GET /api/goals)
 * Aktivitási szintek és célok végpont tesztelése
 */
import { prisma } from '@/lib/prisma'

// Prisma mockolása
jest.mock('@/lib/prisma', () => ({
  prisma: {
    activityLevel: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    goal: {
      findMany: jest.fn(),
    },
  },
}))

const mockActivityLevel = prisma.activityLevel as jest.Mocked<typeof prisma.activityLevel>
const mockGoal = prisma.goal as jest.Mocked<typeof prisma.goal>

describe('GET /api/activity-levels', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('visszaadja az aktivitási szinteket', async () => {
    const mockLevels = [
      { id: 1, name: 'Nagyon aktív' },
      { id: 2, name: 'Ülő életmód' },
      { id: 3, name: 'Közepesen aktív' },
      { id: 4, name: 'Enyhén aktív' },
    ]
    ;(mockActivityLevel.findMany as jest.Mock).mockResolvedValue(mockLevels)

    // Importálás a mock után
    const { GET } = await import('@/app/api/activity-levels/route')
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(4)
    expect(data[0].name).toBe('Nagyon aktív')
  })

  it('id alapján rendezve adja vissza az adatokat', async () => {
    ;(mockActivityLevel.findMany as jest.Mock).mockResolvedValue([])

    const { GET } = await import('@/app/api/activity-levels/route')
    await GET()

    expect(mockActivityLevel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { id: 'asc' },
      })
    )
  })

  it('Cache-Control fejlécet állít be', async () => {
    ;(mockActivityLevel.findMany as jest.Mock).mockResolvedValue([])

    const { GET } = await import('@/app/api/activity-levels/route')
    const response = await GET()

    expect(response.headers.get('Cache-Control')).toContain('s-maxage=3600')
  })

  it('500-as hibát ad vissza adatbázis hiba esetén', async () => {
    ;(mockActivityLevel.findMany as jest.Mock).mockRejectedValue(new Error('DB error'))

    const { GET } = await import('@/app/api/activity-levels/route')
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Nem sikerült betölteni az aktivitási szinteket')
  })
})

describe('POST /api/activity-levels', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('létrehozza az alapértelmezett aktivitási szinteket', async () => {
    ;(mockActivityLevel.findUnique as jest.Mock).mockResolvedValue(null)
    ;(mockActivityLevel.create as jest.Mock).mockImplementation((args: { data: { name: string } }) =>
      Promise.resolve({ id: 1, name: args.data.name })
    )

    const { POST } = await import('@/app/api/activity-levels/route')
    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.length).toBeGreaterThan(0)
  })

  it('nem hozza létre újra a már létező szinteket', async () => {
    ;(mockActivityLevel.findUnique as jest.Mock).mockResolvedValue({ id: 1, name: 'Már létezik' })

    const { POST } = await import('@/app/api/activity-levels/route')
    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(mockActivityLevel.create).not.toHaveBeenCalled()
    expect(data).toHaveLength(0)
  })
})

describe('GET /api/goals', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('visszaadja a célokat', async () => {
    const mockGoals = [
      { id: 1, name: 'Tömegnövelés' },
      { id: 2, name: 'Súlytartás' },
      { id: 3, name: 'Fogyás' },
    ]
    ;(mockGoal.findMany as jest.Mock).mockResolvedValue(mockGoals)

    const { GET } = await import('@/app/api/goals/route')
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(3)
    expect(data[0].name).toBe('Tömegnövelés')
    expect(data[2].name).toBe('Fogyás')
  })

  it('id alapján rendezve adja vissza', async () => {
    ;(mockGoal.findMany as jest.Mock).mockResolvedValue([])

    const { GET } = await import('@/app/api/goals/route')
    await GET()

    expect(mockGoal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { id: 'asc' },
      })
    )
  })

  it('Cache-Control fejlécet állít be', async () => {
    ;(mockGoal.findMany as jest.Mock).mockResolvedValue([])

    const { GET } = await import('@/app/api/goals/route')
    const response = await GET()

    expect(response.headers.get('Cache-Control')).toContain('s-maxage=3600')
  })

  it('500-as hibát ad vissza adatbázis hiba esetén', async () => {
    ;(mockGoal.findMany as jest.Mock).mockRejectedValue(new Error('DB error'))

    const { GET } = await import('@/app/api/goals/route')
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Nem sikerült betölteni a célokat')
  })
})
