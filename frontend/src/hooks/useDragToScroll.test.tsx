import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useDragToScroll } from './useDragToScroll'

function TestComponent({ onChildClick }: { onChildClick?: () => void }) {
  const { ref } = useDragToScroll<HTMLDivElement>()

  return (
    <div
      ref={ref}
      data-testid="scroll-container"
      className="overflow-x-auto w-[200px]"
    >
      <div className="w-[800px] flex">
        <button
          type="button"
          onClick={onChildClick}
          data-testid="child-button"
        >
          Row item
        </button>
      </div>
    </div>
  )
}

describe('useDragToScroll hook', () => {
  it('scrolls container when clicking and dragging with mouse', () => {
    const { getByTestId } = render(<TestComponent />)
    const container = getByTestId('scroll-container')

    // Mock scrollWidth > clientWidth to simulate horizontal scrollbar
    Object.defineProperty(container, 'scrollWidth', { value: 800, configurable: true })
    Object.defineProperty(container, 'clientWidth', { value: 200, configurable: true })
    container.scrollLeft = 50

    // Mouse down at X: 100
    fireEvent.mouseDown(container, { button: 0, clientX: 100 })

    // Move to X: 60 (dragged left by 40px)
    fireEvent.mouseMove(window, { clientX: 60 })

    // scrollLeft should have increased: 50 - (-40) = 90
    expect(container.scrollLeft).toBe(90)

    // Mouse up
    fireEvent.mouseUp(window)
  })

  it('prevents accidental child click when dragging occurred', () => {
    const handleChildClick = vi.fn()
    const { getByTestId } = render(<TestComponent onChildClick={handleChildClick} />)
    const container = getByTestId('scroll-container')
    const button = getByTestId('child-button')

    Object.defineProperty(container, 'scrollWidth', { value: 800, configurable: true })
    Object.defineProperty(container, 'clientWidth', { value: 200, configurable: true })

    // Mouse down and drag
    fireEvent.mouseDown(container, { button: 0, clientX: 100 })
    fireEvent.mouseMove(window, { clientX: 50 })
    fireEvent.mouseUp(window)

    // Simulating click event that browsers dispatch on mouseup
    fireEvent.click(button)

    expect(handleChildClick).not.toHaveBeenCalled()
  })

  it('allows normal child click when user does not drag', () => {
    const handleChildClick = vi.fn()
    const { getByTestId } = render(<TestComponent onChildClick={handleChildClick} />)
    const container = getByTestId('scroll-container')
    const button = getByTestId('child-button')

    Object.defineProperty(container, 'scrollWidth', { value: 800, configurable: true })
    Object.defineProperty(container, 'clientWidth', { value: 200, configurable: true })

    // Normal click without movement
    fireEvent.mouseDown(container, { button: 0, clientX: 100 })
    fireEvent.mouseUp(window)
    fireEvent.click(button)

    expect(handleChildClick).toHaveBeenCalledTimes(1)
  })
})
