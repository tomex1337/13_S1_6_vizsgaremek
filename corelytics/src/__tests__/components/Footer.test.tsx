/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react'
import Footer from '@/components/footer'

describe('Footer Component', () => {
  it('renders footer component', () => {
    const { container } = render(<Footer />)
    
    // Should render a div element (since Footer currently just returns an empty div)
    expect(container.firstChild).toBeInTheDocument()
    expect(container.firstChild?.nodeName).toBe('FOOTER')
  })

  it('renders without crashing', () => {
    expect(() => render(<Footer />)).not.toThrow()
  })
})
