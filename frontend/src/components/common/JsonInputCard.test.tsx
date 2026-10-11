import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import JsonInputCard from './JsonInputCard'

describe('JsonInputCard', () => {
  it('renders title, badge, textarea and process button', () => {
    const handleProcess = vi.fn()
    render(
      <JsonInputCard
        title="Nhập nhanh bằng JSON"
        badge="Thông minh"
        buttonText="Xử lý JSON"
        onProcess={handleProcess}
      />
    )

    expect(screen.getByText('Nhập nhanh bằng JSON')).toBeInTheDocument()
    expect(screen.getByText('Thông minh')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Xử lý JSON/i })).toBeInTheDocument()
  })

  it('shows error when submitting empty input', () => {
    const handleProcess = vi.fn()
    render(<JsonInputCard onProcess={handleProcess} />)

    fireEvent.click(screen.getByRole('button', { name: /Xử lý JSON/i }))
    expect(screen.getByText('Vui lòng nhập JSON')).toBeInTheDocument()
    expect(handleProcess).not.toHaveBeenCalled()
  })

  it('calls onProcess with text content on valid input', () => {
    const handleProcess = vi.fn()
    render(<JsonInputCard onProcess={handleProcess} />)

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: '{"test": 123}' } })
    fireEvent.click(screen.getByRole('button', { name: /Xử lý JSON/i }))

    expect(handleProcess).toHaveBeenCalledWith('{"test": 123}')
  })

  it('displays caught error message if onProcess throws', () => {
    const handleProcess = vi.fn().mockImplementation(() => {
      throw new Error('Cú pháp JSON không hợp lệ')
    })
    render(<JsonInputCard onProcess={handleProcess} />)

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'invalid json' } })
    fireEvent.click(screen.getByRole('button', { name: /Xử lý JSON/i }))

    expect(screen.getByText('Cú pháp JSON không hợp lệ')).toBeInTheDocument()
  })
})
