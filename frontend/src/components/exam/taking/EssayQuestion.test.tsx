import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EssayQuestion from './EssayQuestion'

// Mock MathInput so we don't try to load mathlive in test environment
vi.mock('@/components/ui/MathInput', () => {
  return {
    __esModule: true,
    default: ({ value, onChange }: any) => (
      <textarea 
        data-testid="mock-math-input" 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
      />
    )
  }
})

describe('EssayQuestion Component', () => {
  it('renders question content and handles input', async () => {
    const handleAnswerChange = vi.fn()
    const user = userEvent.setup()
    
    render(
      <EssayQuestion
        questionId={42}
        content="Tính độ dài cạnh huyền BC"
        answer=""
        isFlagged={false}
        onAnswerChange={handleAnswerChange}
        onToggleFlag={vi.fn()}
      />
    )
    
    expect(screen.getByText('Câu 42')).toBeInTheDocument()
    expect(screen.getByText('Tính độ dài cạnh huyền BC')).toBeInTheDocument()
    
    const input = screen.getByTestId('mock-math-input')
    await user.type(input, '10')
    
    // It should have called handleAnswerChange
    expect(handleAnswerChange).toHaveBeenCalled()
  })
})
