/**
 * @jest-environment jsdom
 */
/* eslint-disable @next/next/no-img-element */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession, signIn } from 'next-auth/react'
import SignIn from '@/app/auth/signin/page'

// next-auth mockolása
jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>

// next/navigation mockolása
const mockPush = jest.fn()
const mockRefresh = jest.fn()
const mockSearchParamsGet = jest.fn(() => null)
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: mockRefresh,
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  usePathname() {
    return '/auth/signin'
  },
  useSearchParams() {
    return {
      get: mockSearchParamsGet,
    }
  },
}))

// next/image mockolása
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { src: string; alt: string; width: number; height: number }) => (
    <img src={props.src} alt={props.alt} width={props.width} height={props.height} />
  ),
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

// Axios mockolása
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  isAxiosError: jest.fn(() => false),
}))

describe('SignIn Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSearchParamsGet.mockReturnValue(null)
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })
    mockSignIn.mockResolvedValue({
      error: null,
      status: 200,
      ok: true,
      url: '/',
    })
  })

  it('hibamentesen renderelődik', () => {
    expect(() => render(<SignIn />)).not.toThrow()
  })

  it('megjeleníti a bejelentkezési címet', () => {
    render(<SignIn />)
    expect(screen.getByText('Jelentkezz be a fiókodba')).toBeInTheDocument()
  })

  it('megjeleníti az email és jelszó mezőket', () => {
    render(<SignIn />)
    expect(screen.getByPlaceholderText('Email cím')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Jelszó')).toBeInTheDocument()
  })

  it('megjeleníti a bejelentkezés gombot', () => {
    render(<SignIn />)
    expect(screen.getByRole('button', { name: 'Bejelentkezés' })).toBeInTheDocument()
  })

  it('megjeleníti az elfelejtett jelszó linket', () => {
    render(<SignIn />)
    expect(screen.getByText('Elfelejtetted a jelszavad?')).toBeInTheDocument()
    const forgotLink = screen.getByText('Elfelejtetted a jelszavad?').closest('a')
    expect(forgotLink?.getAttribute('href')).toBe('/auth/forgot-password')
  })

  it('megjeleníti a regisztrációs linket', () => {
    render(<SignIn />)
    expect(screen.getByText('Regisztrálj')).toBeInTheDocument()
    const signupLink = screen.getByText('Regisztrálj').closest('a')
    expect(signupLink?.getAttribute('href')).toBe('/auth/signup')
  })

  it('megjeleníti a "Még nincs fiókod?" szöveget', () => {
    render(<SignIn />)
    expect(screen.getByText(/Még nincs fiókod/)).toBeInTheDocument()
  })

  it('az email mező type attribútuma email', () => {
    render(<SignIn />)
    const emailInput = screen.getByPlaceholderText('Email cím')
    expect(emailInput.getAttribute('type')).toBe('email')
  })

  it('a jelszó mező type attribútuma password', () => {
    render(<SignIn />)
    const passwordInput = screen.getByPlaceholderText('Jelszó')
    expect(passwordInput.getAttribute('type')).toBe('password')
  })

  it('megjeleníti a Header és Footer komponenseket', () => {
    const { container } = render(<SignIn />)
    expect(container.querySelector('header')).toBeInTheDocument()
    expect(container.querySelector('footer')).toBeInTheDocument()
  })

  it('mutat hibaüzenetet érvénytelen bejelentkezésnél', async () => {
    mockSignIn.mockResolvedValue({
      error: 'CredentialsSignin',
      status: 401,
      ok: false,
      url: null,
    })

    render(<SignIn />)

    const emailInput = screen.getByPlaceholderText('Email cím')
    const passwordInput = screen.getByPlaceholderText('Jelszó')

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'rossz_jelszo' } })

    const submitButton = screen.getByRole('button', { name: 'Bejelentkezés' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Érvénytelen bejelentkezési adatok')).toBeInTheDocument()
    })
  })

  it('mutat hibaüzenetet nem megerősített email esetén', async () => {
    mockSignIn.mockResolvedValue({
      error: 'EMAIL_NOT_VERIFIED',
      status: 401,
      ok: false,
      url: null,
    })

    render(<SignIn />)

    fireEvent.change(screen.getByPlaceholderText('Email cím'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Jelszó'), { target: { value: 'helyes_jelszo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Bejelentkezés' }))

    await waitFor(() => {
      expect(screen.getByText('A bejelentkezéshez előbb meg kell erősítened az email címedet')).toBeInTheDocument()
    })
  })

  it('megjeleníti a regisztráció utáni tájékoztatót', () => {
    mockSearchParamsGet.mockImplementation((key: string) => (key === 'registered' ? '1' : null))

    render(<SignIn />)

    expect(screen.getByText('A regisztráció sikeres. Kérjük, erősítsd meg az email címedet a kiküldött levélben.')).toBeInTheDocument()
  })

  it('meghívja a signIn funkciót az űrlap beküldésekor', async () => {
    render(<SignIn />)

    const emailInput = screen.getByPlaceholderText('Email cím')
    const passwordInput = screen.getByPlaceholderText('Jelszó')

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'helyes_jelszo' } })

    const submitButton = screen.getByRole('button', { name: 'Bejelentkezés' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@test.com',
        password: 'helyes_jelszo',
        redirect: false,
      })
    })
  })
})
