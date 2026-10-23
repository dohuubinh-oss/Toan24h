import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
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

  it('does not render format button', () => {
    render(<JsonInputCard onProcess={vi.fn()} initialValue='{"a":1}' />)
    expect(screen.queryByRole('button', { name: /định dạng/i })).not.toBeInTheDocument()
  })

  it('updates textarea when initialValue prop changes', () => {
    const { rerender } = render(<JsonInputCard onProcess={vi.fn()} initialValue='[{"id":1}]' />)

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea.value).toBe('[{"id":1}]')

    rerender(<JsonInputCard onProcess={vi.fn()} initialValue='[{"id":2}]' />)
    expect(textarea.value).toBe('[{"id":2}]')
  })

  it('renders and triggers onAiExtract button when prop is provided', () => {
    const handleAiExtract = vi.fn()
    render(<JsonInputCard onProcess={vi.fn()} onAiExtract={handleAiExtract} />)

    const aiBtn = screen.getByRole('button', { name: /Tải ảnh câu hỏi/i })
    expect(aiBtn).toBeInTheDocument()

    fireEvent.click(aiBtn)
    expect(handleAiExtract).toHaveBeenCalledTimes(1)
  })
})
