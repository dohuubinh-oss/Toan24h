import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResultScoreCircle from './ResultScoreCircle'

describe('ResultScoreCircle Component', () => {
  it('renders score properly', () => {
    render(
      <ResultScoreCircle score={8.5} maxScore={10} topPercent={5} />
    )
    
    expect(screen.getByText('8.5')).toBeInTheDocument()
    expect(screen.getByText('/ 10')).toBeInTheDocument()
    expect(screen.getByText('Kết quả xuất sắc!')).toBeInTheDocument()
    expect(screen.getByText('Bạn nằm trong top 5% của lớp.')).toBeInTheDocument()
  })

  it('calculates the dashoffset correctly', () => {
    const { container } = render(
      <ResultScoreCircle score={5} maxScore={10} topPercent={50} />
    )
    
    const circle = container.querySelector('.text-primary')
    expect(circle?.getAttribute('stroke-dashoffset')).toMatch(/^219\.9/)
  })
})
