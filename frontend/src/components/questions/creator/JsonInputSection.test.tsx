import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import JsonInputSection from './JsonInputSection'

describe('JsonInputSection Component', () => {
  it('renders the heading', () => {
    render(<JsonInputSection />)
    expect(screen.getByText('Nhập nhanh bằng JSON')).toBeInTheDocument()
  })

  it('renders the textarea', () => {
    render(<JsonInputSection />)
    expect(screen.getByPlaceholderText(/\[\{"question": "\.\.\.", "options": \[\.\.\.\], "answer": "A"\}, \.\.\.\]/)).toBeInTheDocument()
  })

  it('renders the process button', () => {
    render(<JsonInputSection />)
    expect(screen.getByRole('button', { name: /Xử lý JSON/i })).toBeInTheDocument()
  })

  it('renders pagination', () => {
    render(<JsonInputSection />)
    expect(screen.getByText('Câu 1')).toBeInTheDocument()
    expect(screen.getByText('/ 12')).toBeInTheDocument()
  })
})
