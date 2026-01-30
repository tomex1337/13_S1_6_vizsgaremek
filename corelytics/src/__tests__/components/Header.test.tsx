/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import Header from '@/components/header'

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

// tRPC mockolása
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

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders header component', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    render(<Header />)
    
    // A header div renderelése kell
    expect(document.querySelector('div')).toBeInTheDocument()
  })

  it('renders without crashing when authenticated', () => {
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

    const { container } = render(<Header />)
    
    // Hibák nélkül kell renderelnie
    expect(container.firstChild).toBeInTheDocument()
  })
})
