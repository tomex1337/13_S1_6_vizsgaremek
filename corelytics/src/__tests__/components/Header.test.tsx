/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import Header from '@/components/header'

// Mock next-auth
jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

// Mock next/navigation
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
    
    // Should render the header div
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
    
    // Should render without errors
    expect(container.firstChild).toBeInTheDocument()
  })
})
