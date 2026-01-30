/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react'
import Footer from '@/components/footer'

describe('Footer Component', () => {
  it('renders footer component', () => {
    const { container } = render(<Footer />)
    
    // Egy div elemet kell renderelnie (mivel a Footer jelenleg csak egy üres div-et ad vissza)
    expect(container.firstChild).toBeInTheDocument()
    expect(container.firstChild?.nodeName).toBe('FOOTER')
  })

  it('renders without crashing', () => {
    expect(() => render(<Footer />)).not.toThrow()
  })
})
