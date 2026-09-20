import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import JsonInputSection from './JsonInputSection'

describe('JsonInputSection Component', () => {
  it('renders the heading', () => {
    render(<JsonInputSection />)
    expect(screen.getByText('Nhập nhanh bằng JSON')).toBeInTheDocument()
  })

  it('renders the textarea and process button', () => {
    render(<JsonInputSection />)
    expect(screen.getByPlaceholderText(/shared_content/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Xử lý JSON/i })).toBeInTheDocument()
  })
})

