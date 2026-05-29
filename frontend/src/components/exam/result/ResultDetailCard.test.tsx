import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResultDetailCard from './ResultDetailCard'

describe('ResultDetailCard Component', () => {
  const options = [
    { id: 'A', text: '0' },
    { id: 'B', text: '2' },
    { id: 'C', text: '4' },
    { id: 'D', text: '6' },
  ]

  it('renders correctly for a multiple choice question (wrong answer)', () => {
    render(
      <ResultDetailCard 
        questionId={3}
        content="Tìm giá trị cực đại của hàm số $y = x^3 - 3x + 2$ trên đoạn $[0, 2]$."
        type="mc"
        options={options}
        selectedOptionId="B"
        correctOptionId="C"
        isCorrect={false}
        aiExplanation="Đạo hàm $y' = 3x^2 - 3$. Xét $y' = 0 \Rightarrow x = 1$ (do $x \in [0, 2]$)."
      />
    )
    
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Tìm giá trị cực đại của hàm số $y = x^3 - 3x + 2$ trên đoạn $[0, 2]$.')).toBeInTheDocument()
    
    // Check tags
    expect(screen.getByText('Sai')).toBeInTheDocument()
    
    // Check options
    expect(screen.getByText('B. 2 (Lựa chọn của bạn)')).toBeInTheDocument()
    expect(screen.getByText('C. 4 (Đáp án đúng)')).toBeInTheDocument()
    
    // Check AI explanation
    expect(screen.getByText(/Đạo hàm \$y' = 3x\^2 - 3\$/)).toBeInTheDocument()
  })

  it('renders correctly for a multiple choice question (correct answer)', () => {
    render(
      <ResultDetailCard 
        questionId={3}
        content="Question?"
        type="mc"
        options={options}
        selectedOptionId="C"
        correctOptionId="C"
        isCorrect={true}
      />
    )
    
    expect(screen.getByText('Đúng')).toBeInTheDocument()
    expect(screen.getByText('C. 4 (Lựa chọn của bạn & Đáp án đúng)')).toBeInTheDocument()
  })

  it('renders correctly for an essay question', () => {
    render(
      <ResultDetailCard 
        questionId={11}
        content="Chứng minh..."
        type="essay"
        studentAnswer="Đây là lời giải"
        score={1.0}
        maxScore={1.0}
      />
    )
    
    expect(screen.getByText('11')).toBeInTheDocument()
    expect(screen.getByText('1.0 / 1.0đ')).toBeInTheDocument()
    expect(screen.getByText('Đây là lời giải')).toBeInTheDocument()
  })
})
