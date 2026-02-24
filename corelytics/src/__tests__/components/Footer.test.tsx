/**
 * @jest-environment jsdom
 */
import { render, fireEvent } from '@testing-library/react'
import { useSession, signOut } from 'next-auth/react'
import Footer from '@/components/footer'

// next-auth mockolása
jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>

describe('Footer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Alapértelmezett mock érték - nem bejelentkezett felhasználó
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })
    mockSignOut.mockResolvedValue({ url: '/' })
  })

  it('renders footer component', () => {
    const { container } = render(<Footer />)
    
    // Egy footer elemet kell renderelnie
    expect(container.firstChild).toBeInTheDocument()
    expect(container.firstChild?.nodeName).toBe('FOOTER')
  })

  it('renders without crashing', () => {
    expect(() => render(<Footer />)).not.toThrow()
  })

  it('renders company info section', () => {
    const { getByText } = render(<Footer />)
    
    // Céginfo ellenőrzése
    expect(getByText('Corelytics')).toBeInTheDocument()
    expect(getByText(/Személyes fitness és táplálkozás követő társad/)).toBeInTheDocument()
  })

  it('renders quick links section', () => {
    const { getByText } = render(<Footer />)
    
    // Gyors linkek ellenőrzése
    expect(getByText('Gyors linkek')).toBeInTheDocument()
    expect(getByText('Ételek')).toBeInTheDocument()
    expect(getByText('Edzések')).toBeInTheDocument()
    expect(getByText('Konklúzió')).toBeInTheDocument()
  })

  it('renders contact info section', () => {
    const { getByText } = render(<Footer />)
    
    // Kapcsolat info ellenőrzése
    expect(getByText('Kapcsolat')).toBeInTheDocument()
    expect(getByText('Email: support@corelytics.com')).toBeInTheDocument()
    expect(getByText('Kövess minket a közösségi médiában')).toBeInTheDocument()
  })

  it('renders copyright with current year', () => {
    const { getByText } = render(<Footer />)
    const currentYear = new Date().getFullYear()
    
    // Copyright szöveg ellenőrzése az aktuális évvel
    expect(getByText(`© ${currentYear} Corelytics. Minden jog fenntartva.`)).toBeInTheDocument()
  })

  it('renders login link when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    const { getByText } = render(<Footer />)
    expect(getByText('Bejelentkezés')).toBeInTheDocument()
  })

  it('renders logout button when authenticated', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        },
        expires: '2024-12-31T23:59:59.999Z',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    const { getByText } = render(<Footer />)
    expect(getByText('Kijelentkezés')).toBeInTheDocument()
  })

  it('calls signOut when logout button is clicked', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        },
        expires: '2024-12-31T23:59:59.999Z',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    const { getByText } = render(<Footer />)
    const logoutButton = getByText('Kijelentkezés')
    
    fireEvent.click(logoutButton)
    
    // Ellenőrizzük, hogy a signOut meghívódott-e a megfelelő callbackUrl-lel
    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' })
  })

  it('has correct link hrefs', () => {
    const { getByText } = render(<Footer />)
    
    // Linkek href attribútumainak ellenőrzése
    expect(getByText('Ételek').closest('a')).toHaveAttribute('href', '/#meals')
    expect(getByText('Edzések').closest('a')).toHaveAttribute('href', '/#workouts')
    expect(getByText('Konklúzió').closest('a')).toHaveAttribute('href', '/#conclusion')
  })

  it('login link has correct href when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    const { getByText } = render(<Footer />)
    expect(getByText('Bejelentkezés').closest('a')).toHaveAttribute('href', '/auth/signin')
  })
})
