// Beállító fájl a React Testing Library számára
import '@testing-library/jest-dom'


// Next.js router mockolása
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Next Auth mockolása
jest.mock('next-auth/react', () => ({
  useSession() {
    return {
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    }
  },
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
}))

// Axios mockolása
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  isAxiosError: jest.fn(() => false),
}))

// Konzol üzenetek elnyomása tesztek alatt
global.console = {
  ...console,
  // Kommenteld ki az alábbi sort, ha látni szeretnéd a konzol üzeneteket tesztek alatt
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// window.location mockolása - csak ha szükséges specifikus tesztekben
// Object.defineProperty használható egyedi teszt fájlokban ha szükséges

// ResizeObserver mockolása
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// IntersectionObserver mockolása
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))
