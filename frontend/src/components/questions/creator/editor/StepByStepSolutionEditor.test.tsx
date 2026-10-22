import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import StepByStepSolutionEditor from './StepByStepSolutionEditor'
import { StructuredSolutionGuide } from '@/types/question'

describe('StepByStepSolutionEditor Component', () => {
  const initialGuide: StructuredSolutionGuide = {
    steps: [
      { step: 1, title: 'Bước 1: Tìm x', content: 'Tính giá trị x', formula: '$x = 1$', point: 0.5 },
      { step: 2, title: 'Bước 2: Tìm y', content: 'Tính giá trị y', formula: '$y = 2$', point: 0.5 }
    ],
    conclusion: 'Vậy đáp số là $(1, 2)$'
  }

  it('renders existing steps with titles, contents, formulas and points', () => {
    render(<StepByStepSolutionEditor guide={initialGuide} onChange={vi.fn()} onTotalPointChange={vi.fn()} />)
    expect(screen.getByDisplayValue('Bước 1: Tìm x')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Bước 2: Tìm y')).toBeInTheDocument()
    expect(screen.getAllByDisplayValue('0.5')).toHaveLength(2)
    expect(screen.getByText(/Tổng thang điểm:/)).toBeInTheDocument()
    expect(screen.getByText(/1 đ/)).toBeInTheDocument()
  })

  it('calculates total point and notifies parent when a step point changes', () => {
    const handleTotalPointChange = vi.fn()
    const handleChange = vi.fn()
    render(<StepByStepSolutionEditor guide={initialGuide} onChange={handleChange} onTotalPointChange={handleTotalPointChange} />)

    const pointInputs = screen.getAllByRole('spinbutton')
    // Change step 1 from 0.5 to 1.5
    fireEvent.change(pointInputs[0], { target: { value: '1.5' } })

    expect(handleTotalPointChange).toHaveBeenCalledWith(2)
    expect(handleChange).toHaveBeenCalled()
  })

  it('adds a new step when clicking Add Step button', () => {
    const handleChange = vi.fn()
    render(<StepByStepSolutionEditor guide={initialGuide} onChange={handleChange} onTotalPointChange={vi.fn()} />)

    const addButtons = screen.getAllByRole('button', { name: /\+ Thêm bước/i })
    fireEvent.click(addButtons[0])

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        steps: expect.arrayContaining([
          expect.objectContaining({ step: 1 }),
          expect.objectContaining({ step: 2 }),
          expect.objectContaining({ step: 3, point: 0.5 })
        ])
      })
    )
  })

  it('deletes a step when clicking Delete button', () => {
    const handleChange = vi.fn()
    render(<StepByStepSolutionEditor guide={initialGuide} onChange={handleChange} onTotalPointChange={vi.fn()} />)

    const deleteButtons = screen.getAllByTitle(/Xóa bước/i)
    fireEvent.click(deleteButtons[0])

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        steps: [
          expect.objectContaining({ step: 1, title: 'Bước 2: Tìm y' })
        ]
      })
    )
  })

  it('updates conclusion text', () => {
    const handleChange = vi.fn()
    render(<StepByStepSolutionEditor guide={initialGuide} onChange={handleChange} onTotalPointChange={vi.fn()} />)

    const conclusionInput = screen.getByDisplayValue('Vậy đáp số là $(1, 2)$')
    fireEvent.change(conclusionInput, { target: { value: 'Kết luận mới' } })

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        conclusion: 'Kết luận mới'
      })
    )
  })
})
