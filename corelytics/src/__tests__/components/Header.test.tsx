/**
 * @jest-environment jsdom
 */
/* eslint-disable @next/next/no-img-element */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession, signOut } from 'next-auth/react'
import Header from '@/components/header'

// next-auth mockolása
jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>

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
  default: (props: { src: string; alt: string; width: number; height: number; className?: string }) => (
    <img src={props.src} alt={props.alt} width={props.width} height={props.height} className={props.className} />
  ),
}))

// tRPC mockolása
const mockUseQuery = jest.fn(() => ({
  data: { permissionLevel: 0 },
  isLoading: false,
  error: null,
}))

jest.mock('@/lib/trpc', () => ({
  trpc: {
    admin: {
      getPermissionLevel: {
        useQuery: (...args: unknown[]) => mockUseQuery(...args),
      },
    },
  },
}))

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseQuery.mockReturnValue({
      data: { permissionLevel: 0 },
      isLoading: false,
      error: null,
    })
    mockSignOut.mockResolvedValue({ url: '/' })
  })

  it('megjeleníti a header komponenst', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    render(<Header />)
    
    // A header elem renderelése kell
    expect(document.querySelector('header')).toBeInTheDocument()
  })

  it('hibamentesen renderelődik bejelentkezett felhasználóval', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        },
        expires: '2026-12-31T23:59:59.999Z',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    const { container } = render(<Header />)
    
    // Hibák nélkül kell renderelnie
    expect(container.firstChild).toBeInTheDocument()
  })

  it('megjeleníti a Corelytics logót', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    render(<Header />)
    const logos = screen.getAllByAltText('Corelytics Logo')
    expect(logos.length).toBeGreaterThanOrEqual(1)
  })

  it('megjeleníti a navigációs linkeket', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    render(<Header />)
    // Desktop és mobil navigáció egyaránt tartalmazza ezeket
    const etelek = screen.getAllByText('Ételek')
    const edzesek = screen.getAllByText('Edzések')
    const konkluzio = screen.getAllByText('Konklúzió')

    expect(etelek.length).toBeGreaterThanOrEqual(1)
    expect(edzesek.length).toBeGreaterThanOrEqual(1)
    expect(konkluzio.length).toBeGreaterThanOrEqual(1)
  })

  it('megjeleníti a bejelentkezés linket, ha nincs bejelentkezve', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    render(<Header />)
    const loginLinks = screen.getAllByText(/Bejelentkezés/)
    expect(loginLinks.length).toBeGreaterThanOrEqual(1)
  })

  it('megjeleníti a felhasználó nevét bejelentkezés után', () => {
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

    render(<Header />)
    const userNames = screen.getAllByText('Teszt Felhasználó')
    expect(userNames.length).toBeGreaterThanOrEqual(1)
  })

  it('megjeleníti a felhasználói menü gombot bejelentkezett felhasználónak', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Teszt User',
        },
        expires: '2026-12-31T23:59:59.999Z',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    render(<Header />)
    // A felhasználói menü gomb megjelenik a névvel
    const menuButton = screen.getByRole('button', { name: /Teszt User/ })
    expect(menuButton).toBeInTheDocument()
  })

  it('nem jeleníti meg az Admin Panel linket normál felhasználónak', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Teszt User',
        },
        expires: '2026-12-31T23:59:59.999Z',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    mockUseQuery.mockReturnValue({
      data: { permissionLevel: 0 },
      isLoading: false,
      error: null,
    })

    const { container } = render(<Header />)
    // Admin Panel link nem jelenik meg se desktop dropdown-ban, se mobilmenüben
    const adminLinks = container.querySelectorAll('a[href="/admin_panel"]')
    expect(adminLinks.length).toBe(0)
  })

  it('hibamentesen renderelődik moderátor jogosultsággal', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'admin@example.com',
          name: 'Admin User',
        },
        expires: '2026-12-31T23:59:59.999Z',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    mockUseQuery.mockReturnValue({
      data: { permissionLevel: 1 },
      isLoading: false,
      error: null,
    })

    const { container } = render(<Header />)
    // A komponens hibamentesen renderelődik moderátor jogosultsággal
    expect(container.querySelector('header')).toBeInTheDocument()
    // A felhasználó neve megjelenik a menü gombon
    expect(screen.getByText('Admin User')).toBeInTheDocument()
  })

  it('a mobilmenü megnyitásakor megjelenik az Admin Panel link moderátornak', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'admin@example.com',
          name: 'Admin User',
        },
        expires: '2026-12-31T23:59:59.999Z',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    mockUseQuery.mockReturnValue({
      data: { permissionLevel: 2 },
      isLoading: false,
      error: null,
    })

    render(<Header />)
    // Mobilmenü megnyitása
    const menuButton = screen.getByRole('button', { name: 'Főmenü megnyitása' })
    fireEvent.click(menuButton)

    // Várjuk meg, hogy az Admin Panel link megjelenjen
    await waitFor(() => {
      expect(screen.getByText('Admin Panel')).toBeInTheDocument()
    })
  })

  it('a navigációs linkek helyes href-ekkel rendelkeznek', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    const { container } = render(<Header />)
    const links = container.querySelectorAll('a')
    const hrefs = Array.from(links).map(l => l.getAttribute('href'))

    expect(hrefs).toContain('/#meals')
    expect(hrefs).toContain('/#workouts')
    expect(hrefs).toContain('/#conclusion')
  })

  it('sticky pozícionálással rendelkezik', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    const { container } = render(<Header />)
    const header = container.querySelector('header')
    expect(header?.className).toContain('sticky')
    expect(header?.className).toContain('top-0')
  })
})
