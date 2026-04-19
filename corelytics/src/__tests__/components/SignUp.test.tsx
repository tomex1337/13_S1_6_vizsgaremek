/**
 * @jest-environment jsdom
 */
/* eslint-disable @next/next/no-img-element */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import SignUp from '@/app/auth/signup/page'
import axios from 'axios'

// next-auth mockolása
jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

// next/navigation mockolása
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  usePathname() {
    return '/auth/signup'
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

const mockAxiosPost = axios.post as jest.MockedFunction<typeof axios.post>
const mockIsAxiosError = axios.isAxiosError as unknown as jest.MockedFunction<() => boolean>

describe('SignUp Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })
    mockAxiosPost.mockResolvedValue({ data: { message: 'Sikeres regisztráció' } })
  })

  it('hibamentesen renderelődik', () => {
    expect(() => render(<SignUp />)).not.toThrow()
  })

  it('megjeleníti a regisztrációs címet', () => {
    render(<SignUp />)
    expect(screen.getByText('Hozd létre a fiókodat')).toBeInTheDocument()
  })

  it('megjeleníti az összes beviteli mezőt', () => {
    render(<SignUp />)
    expect(screen.getByPlaceholderText('Teljes név')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email cím')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Jelszó')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Jelszó megerősítése')).toBeInTheDocument()
  })

  it('megjeleníti a regisztráció gombot', () => {
    render(<SignUp />)
    expect(screen.getByRole('button', { name: 'Regisztráció' })).toBeInTheDocument()
  })

  it('megjeleníti a bejelentkezés linket', () => {
    render(<SignUp />)
    expect(screen.getByText(/Már van fiókod/)).toBeInTheDocument()
    expect(screen.getByText('Jelentkezz be')).toBeInTheDocument()
    const signinLink = screen.getByText('Jelentkezz be').closest('a')
    expect(signinLink?.getAttribute('href')).toBe('/auth/signin')
  })

  it('a jelszó mezők type attribútuma password', () => {
    render(<SignUp />)
    const passwordInput = screen.getByPlaceholderText('Jelszó')
    const confirmPasswordInput = screen.getByPlaceholderText('Jelszó megerősítése')
    expect(passwordInput.getAttribute('type')).toBe('password')
    expect(confirmPasswordInput.getAttribute('type')).toBe('password')
  })

  it('az email mező type attribútuma email', () => {
    render(<SignUp />)
    const emailInput = screen.getByPlaceholderText('Email cím')
    expect(emailInput.getAttribute('type')).toBe('email')
  })

  it('megjeleníti a Header és Footer komponenseket', () => {
    const { container } = render(<SignUp />)
    expect(container.querySelector('header')).toBeInTheDocument()
    expect(container.querySelector('footer')).toBeInTheDocument()
  })

  it('hibaüzenetet mutat, ha a jelszavak nem egyeznek', async () => {
    render(<SignUp />)

    fireEvent.change(screen.getByPlaceholderText('Teljes név'), { target: { value: 'Teszt Felhasználó' } })
    fireEvent.change(screen.getByPlaceholderText('Email cím'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Jelszó'), { target: { value: 'jelszo123' } })
    fireEvent.change(screen.getByPlaceholderText('Jelszó megerősítése'), { target: { value: 'mas_jelszo' } })

    fireEvent.click(screen.getByRole('button', { name: 'Regisztráció' }))

    await waitFor(() => {
      expect(screen.getByText('A jelszavak nem egyeznek')).toBeInTheDocument()
    })
  })

  it('nem hívja meg az API-t, ha a jelszavak nem egyeznek', async () => {
    render(<SignUp />)

    fireEvent.change(screen.getByPlaceholderText('Teljes név'), { target: { value: 'Teszt Felhasználó' } })
    fireEvent.change(screen.getByPlaceholderText('Email cím'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Jelszó'), { target: { value: 'jelszo123' } })
    fireEvent.change(screen.getByPlaceholderText('Jelszó megerősítése'), { target: { value: 'mas_jelszo' } })

    fireEvent.click(screen.getByRole('button', { name: 'Regisztráció' }))

    await waitFor(() => {
      expect(screen.getByText('A jelszavak nem egyeznek')).toBeInTheDocument()
    })
    
    expect(mockAxiosPost).not.toHaveBeenCalled()
  })

  it('sikeres regisztráció után átirányít a bejelentkezés oldalra', async () => {
    render(<SignUp />)

    fireEvent.change(screen.getByPlaceholderText('Teljes név'), { target: { value: 'Teszt Felhasználó' } })
    fireEvent.change(screen.getByPlaceholderText('Email cím'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Jelszó'), { target: { value: 'jelszo123' } })
    fireEvent.change(screen.getByPlaceholderText('Jelszó megerősítése'), { target: { value: 'jelszo123' } })

    fireEvent.click(screen.getByRole('button', { name: 'Regisztráció' }))

    await waitFor(() => {
      expect(mockAxiosPost).toHaveBeenCalledWith('/api/auth/register', {
        email: 'test@test.com',
        password: 'jelszo123',
        name: 'Teszt Felhasználó',
      })
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/signin?registered=1')
    })

    // Várjuk meg, hogy minden állapotfrissítés befejeződjön (setIsLoading(false))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Regisztráció' })).not.toBeDisabled()
    })
  })

  it('hibaüzenetet mutat API hiba esetén', async () => {
    const axiosError = {
      response: { data: { message: 'Ez az email cím már használatban van' } },
      isAxiosError: true,
    }
    mockAxiosPost.mockRejectedValue(axiosError)
    mockIsAxiosError.mockReturnValue(true)

    render(<SignUp />)

    fireEvent.change(screen.getByPlaceholderText('Teljes név'), { target: { value: 'Teszt' } })
    fireEvent.change(screen.getByPlaceholderText('Email cím'), { target: { value: 'existing@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Jelszó'), { target: { value: 'jelszo123' } })
    fireEvent.change(screen.getByPlaceholderText('Jelszó megerősítése'), { target: { value: 'jelszo123' } })

    fireEvent.click(screen.getByRole('button', { name: 'Regisztráció' }))

    await waitFor(() => {
      expect(screen.getByText('Ez az email cím már használatban van')).toBeInTheDocument()
    })

    // Várjuk meg, hogy minden állapotfrissítés befejeződjön (setIsLoading(false))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Regisztráció' })).not.toBeDisabled()
    })
  })

  it('a gomb kikapcsolt állapotba kerül betöltés közben', async () => {
    // Lassú API hívás szimulálása
    let resolvePost: (value: unknown) => void
    mockAxiosPost.mockImplementation(() => new Promise(resolve => {
      resolvePost = resolve
    }))

    render(<SignUp />)

    fireEvent.change(screen.getByPlaceholderText('Teljes név'), { target: { value: 'Teszt' } })
    fireEvent.change(screen.getByPlaceholderText('Email cím'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Jelszó'), { target: { value: 'jelszo123' } })
    fireEvent.change(screen.getByPlaceholderText('Jelszó megerősítése'), { target: { value: 'jelszo123' } })

    fireEvent.click(screen.getByRole('button', { name: 'Regisztráció' }))

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /Fiók létrehozása|Regisztráció/ })
      expect(button).toBeDisabled()
    })

    // Resolve a hívást, majd várjuk meg, hogy az állapotfrissítés befejeződjön
    resolvePost!({ data: {} })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Regisztráció' })).not.toBeDisabled()
    })
  })
})
