import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import HomePage from './page'

vi.mock('../components/home/HomeNavigation', () => ({
  default: () => <div data-testid="home-nav">Nav</div>
}))
vi.mock('../components/home/HomeHero', () => ({
  default: () => <div data-testid="home-hero">Hero</div>
}))
vi.mock('../components/home/HomeFeatures', () => ({
  default: () => <div data-testid="home-features">Features</div>
}))
vi.mock('../components/home/HomePricing', () => ({
  default: () => <div data-testid="home-pricing">Pricing</div>
}))
vi.mock('../components/home/HomeTestimonials', () => ({
  default: () => <div data-testid="home-testimonials">Testimonials</div>
}))
vi.mock('../components/home/HomeFAQ', () => ({
  default: () => <div data-testid="home-faq">FAQ</div>
}))
vi.mock('../components/home/HomeFooter', () => ({
  default: () => <div data-testid="home-footer">Footer</div>
}))

describe('HomePage', () => {
  it('renders all main sections', () => {
    render(<HomePage />)
    expect(screen.getByTestId('home-nav')).toBeInTheDocument()
    expect(screen.getByTestId('home-hero')).toBeInTheDocument()
    expect(screen.getByTestId('home-features')).toBeInTheDocument()
    expect(screen.getByTestId('home-pricing')).toBeInTheDocument()
    expect(screen.getByTestId('home-testimonials')).toBeInTheDocument()
    expect(screen.getByTestId('home-faq')).toBeInTheDocument()
    expect(screen.getByTestId('home-footer')).toBeInTheDocument()
  })
})
