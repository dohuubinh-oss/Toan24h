import React from 'react'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ToastProvider, useToast, toast } from './ToastProvider'

function TestComponent() {
  const t = useToast()
  return (
    <div>
      <button onClick={() => t.success('Thao tác thành công')}>Show Success</button>
      <button onClick={() => t.error('Đã có lỗi xảy ra')}>Show Error</button>
      <button onClick={() => t.warning('Cảnh báo quan trọng')}>Show Warning</button>
      <button onClick={() => t.info('Thông tin mới')}>Show Info</button>
      <button onClick={() => toast.success('Standalone Success')}>Standalone</button>
    </div>
  )
}

describe('ToastProvider Component', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children correctly', () => {
    render(
      <ToastProvider>
        <div>App Content</div>
      </ToastProvider>
    )
    expect(screen.getByText('App Content')).toBeInTheDocument()
  })

  it('displays success, error, warning and info toasts on demand', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    fireEvent.click(screen.getByText('Show Success'))
    expect(screen.getByText('Thao tác thành công')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Show Error'))
    expect(screen.getByText('Đã có lỗi xảy ra')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Show Warning'))
    expect(screen.getByText('Cảnh báo quan trọng')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Show Info'))
    expect(screen.getByText('Thông tin mới')).toBeInTheDocument()
  })

  it('allows dismissing a toast by clicking the close button', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    fireEvent.click(screen.getByText('Show Success'))
    expect(screen.getByText('Thao tác thành công')).toBeInTheDocument()

    const closeBtn = screen.getByLabelText('Đóng thông báo')
    fireEvent.click(closeBtn)

    expect(screen.queryByText('Thao tác thành công')).not.toBeInTheDocument()
  })

  it('auto-dismisses toasts after duration', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    fireEvent.click(screen.getByText('Show Success'))
    expect(screen.getByText('Thao tác thành công')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(screen.queryByText('Thao tác thành công')).not.toBeInTheDocument()
  })

  it('supports standalone toast.success/error exported object', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    fireEvent.click(screen.getByText('Standalone'))
    expect(screen.getByText('Standalone Success')).toBeInTheDocument()
  })
})
