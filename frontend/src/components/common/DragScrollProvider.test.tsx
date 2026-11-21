import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DragScrollProvider } from './DragScrollProvider'

describe('DragScrollProvider', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <DragScrollProvider>
        <div>Hello Child</div>
      </DragScrollProvider>
    )
    expect(getByText('Hello Child')).toBeDefined()
  })

  it('scrolls any overflow-x-auto container when dragged with mouse', () => {
    const { getByTestId } = render(
      <DragScrollProvider>
        <div data-testid="table-wrapper" className="overflow-x-auto w-[300px]">
          <div className="w-[1000px] flex">
            <span>Wide content</span>
          </div>
        </div>
      </DragScrollProvider>
    )

    const container = getByTestId('table-wrapper')
    Object.defineProperty(container, 'scrollWidth', { value: 1000, configurable: true })
    Object.defineProperty(container, 'clientWidth', { value: 300, configurable: true })
    container.scrollLeft = 100

    // Mouse down inside container
    fireEvent.mouseDown(container, { button: 0, clientX: 200 })

    // Move left by 50px (clientX: 200 -> 150)
    fireEvent.mouseMove(window, { clientX: 150 })

    // scrollLeft should increase: 100 - (-50) = 150
    expect(container.scrollLeft).toBe(150)

    fireEvent.mouseUp(window)
  })

  it('prevents child element click when dragging occurred', () => {
    const handleRowClick = vi.fn()
    const { getByTestId } = render(
      <DragScrollProvider>
        <div data-testid="table-wrapper" className="overflow-x-auto w-[300px]">
          <div className="w-[1000px]">
            <button data-testid="row-action" onClick={handleRowClick}>
              Click me
            </button>
          </div>
        </div>
      </DragScrollProvider>
    )

    const container = getByTestId('table-wrapper')
    const button = getByTestId('row-action')
    Object.defineProperty(container, 'scrollWidth', { value: 1000, configurable: true })
    Object.defineProperty(container, 'clientWidth', { value: 300, configurable: true })

    // Drag action
    fireEvent.mouseDown(button, { button: 0, clientX: 200 })
    fireEvent.mouseMove(window, { clientX: 100 })
    fireEvent.mouseUp(window)

    // Browser fires click event on the button after mouseup
    fireEvent.click(button)

    expect(handleRowClick).not.toHaveBeenCalled()
  })

  it('allows child element click when no drag movement occurred', () => {
    const handleRowClick = vi.fn()
    const { getByTestId } = render(
      <DragScrollProvider>
        <div data-testid="table-wrapper" className="overflow-x-auto w-[300px]">
          <div className="w-[1000px]">
            <button data-testid="row-action" onClick={handleRowClick}>
              Click me
            </button>
          </div>
        </div>
      </DragScrollProvider>
    )

    const container = getByTestId('table-wrapper')
    const button = getByTestId('row-action')
    Object.defineProperty(container, 'scrollWidth', { value: 1000, configurable: true })
    Object.defineProperty(container, 'clientWidth', { value: 300, configurable: true })

    // Simple click without move
    fireEvent.mouseDown(button, { button: 0, clientX: 200 })
    fireEvent.mouseUp(window)
    fireEvent.click(button)

    expect(handleRowClick).toHaveBeenCalledTimes(1)
  })

  it('does not scroll form input elements or no-drag-scroll elements', () => {
    const { getByTestId } = render(
      <DragScrollProvider>
        <div data-testid="table-wrapper" className="overflow-x-auto w-[300px]">
          <input data-testid="test-input" defaultValue="test" />
        </div>
      </DragScrollProvider>
    )

    const container = getByTestId('table-wrapper')
    const input = getByTestId('test-input')
    Object.defineProperty(container, 'scrollWidth', { value: 1000, configurable: true })
    Object.defineProperty(container, 'clientWidth', { value: 300, configurable: true })
    container.scrollLeft = 0

    fireEvent.mouseDown(input, { button: 0, clientX: 200 })
    fireEvent.mouseMove(window, { clientX: 100 })
    fireEvent.mouseUp(window)

    // Should not have scrolled
    expect(container.scrollLeft).toBe(0)
  })

  it('ignores container if it has no horizontal overflow (scrollWidth <= clientWidth)', () => {
    const { getByTestId } = render(
      <DragScrollProvider>
        <div data-testid="table-wrapper" className="overflow-x-auto w-[300px]">
          <span>Narrow content</span>
        </div>
      </DragScrollProvider>
    )

    const container = getByTestId('table-wrapper')
    Object.defineProperty(container, 'scrollWidth', { value: 300, configurable: true })
    Object.defineProperty(container, 'clientWidth', { value: 300, configurable: true })
    container.scrollLeft = 0

    fireEvent.mouseDown(container, { button: 0, clientX: 200 })
    fireEvent.mouseMove(window, { clientX: 100 })
    fireEvent.mouseUp(window)

    expect(container.scrollLeft).toBe(0)
  })
})
