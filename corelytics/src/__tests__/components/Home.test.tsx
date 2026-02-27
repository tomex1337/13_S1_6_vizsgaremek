/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import Home from '@/app/page'

// next-auth mockolása
jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

// next/navigation mockolása
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
}))

// next/image mockolása
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { src: string; alt: string; width: number; height: number }) => (
    <img src={props.src} alt={props.alt} width={props.width} height={props.height} />
  ),
}))

// Vercel Speed Insights mockolása
jest.mock('@vercel/speed-insights/next', () => ({
  SpeedInsights: () => null,
}))

// tRPC mockolása (Header használja)
jest.mock('@/lib/trpc', () => ({
  trpc: {
    admin: {
      getPermissionLevel: {
        useQuery: jest.fn(() => ({
          data: { permissionLevel: 0 },
          isLoading: false,
          error: null,
        })),
      },
    },
  },
}))

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Alapértelmezett mock - nem bejelentkezett felhasználó
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })
  })

  it('hibamentesen renderelődik', () => {
    expect(() => render(<Home />)).not.toThrow()
  })

  it('megjeleníti a főcímet', () => {
    render(<Home />)
    expect(screen.getByText(/Gondold újra/)).toBeInTheDocument()
    expect(screen.getByText(/az edzésterved/)).toBeInTheDocument()
  })

  it('megjeleníti a Corelytics logót', () => {
    render(<Home />)
    const logos = screen.getAllByAltText('Corelytics Logo')
    // Legalább egy logó a főoldalon és egy a header-ben
    expect(logos.length).toBeGreaterThanOrEqual(1)
  })

  it('megjeleníti az ételek szekciót', () => {
    const { container } = render(<Home />)
    // Ellenőrizzük a meals szekciót az id alapján
    const mealsSection = container.querySelector('#meals')
    expect(mealsSection).toBeInTheDocument()
    expect(screen.getByText('Étrend- és edzéstervező alkalmazás')).toBeInTheDocument()
    expect(screen.getByText(/A Corelytics-al kiválóan tudod az étrended követni/)).toBeInTheDocument()
  })

  it('megjeleníti az edzések szekciót', () => {
    const { container } = render(<Home />)
    const workoutsSection = container.querySelector('#workouts')
    expect(workoutsSection).toBeInTheDocument()
    expect(screen.getByText('Edzésterv nyilvántartása')).toBeInTheDocument()
    expect(screen.getByText(/Szervezd meg az edzéseidet/)).toBeInTheDocument()
  })

  it('megjeleníti a konklúzió szekciót', () => {
    const { container } = render(<Home />)
    const conclusionSection = container.querySelector('#conclusion')
    expect(conclusionSection).toBeInTheDocument()
    expect(screen.getByText('Súly- és testösszetétel nyomon követés')).toBeInTheDocument()
    expect(screen.getByText(/Mérd meg a fejlődésed/)).toBeInTheDocument()
  })

  it('megjeleníti a Header komponenst', () => {
    const { container } = render(<Home />)
    const header = container.querySelector('header')
    expect(header).toBeInTheDocument()
  })

  it('megjeleníti a Footer komponenst', () => {
    const { container } = render(<Home />)
    const footer = container.querySelector('footer')
    expect(footer).toBeInTheDocument()
  })

  it('tartalmazza a három fő szekciót a helyes sorrendben', () => {
    const { container } = render(<Home />)
    const sections = container.querySelectorAll('[id]')
    const sectionIds = Array.from(sections).map(s => s.id)
    
    // Ellenőrizzük, hogy a meals, workouts és conclusion szekciók jelen vannak
    expect(sectionIds).toContain('meals')
    expect(sectionIds).toContain('workouts')
    expect(sectionIds).toContain('conclusion')
    
    // Ellenőrizzük a sorrendet
    const mealsIndex = sectionIds.indexOf('meals')
    const workoutsIndex = sectionIds.indexOf('workouts')
    const conclusionIndex = sectionIds.indexOf('conclusion')
    expect(mealsIndex).toBeLessThan(workoutsIndex)
    expect(workoutsIndex).toBeLessThan(conclusionIndex)
  })

  it('bejelentkezett felhasználóval is hibamentesen renderelődik', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Teszt Felhasználó',
        },
        expires: '2026-12-31T23:59:59.999Z',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    expect(() => render(<Home />)).not.toThrow()
  })
})
