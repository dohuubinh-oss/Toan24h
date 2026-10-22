import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import AIHintPanel from './AIHintPanel'
import { Question } from '@/types/question'

describe('AIHintPanel Component', () => {
  it('renders Lời giải ngắn when question has short_answer', () => {
    const question: Question = {
      content: 'Tính x',
      type: 'Tự luận',
      grade: 9,
      topic: 'Đại số',
      type_question: 'single',
      difficulty_level: 'Thông hiểu',
      difficulty_point: 5,
      point: 1,
      tags: [],
      options: [],
      short_answer: 'Lời giải ngắn gọn cho học sinh',
    }
    render(
      <AIHintPanel
        isOpen={true}
        onClose={vi.fn()}
        question={question}
        unlockedLevel={3}
        onUnlock={vi.fn()}
        readonlyMode={true}
      />
    )
    expect(screen.getByText('Lời giải ngắn')).toBeInTheDocument()
    expect(screen.getByText('Lời giải ngắn gọn cho học sinh')).toBeInTheDocument()
  })

  it('renders Lời giải ngắn fallback when question has legacy quick_solve_tips', () => {
    const question: Question = {
      content: 'Tính x',
      type: 'Tự luận',
      grade: 9,
      topic: 'Đại số',
      type_question: 'single',
      difficulty_level: 'Thông hiểu',
      difficulty_point: 5,
      point: 1,
      tags: [],
      options: [],
      quick_solve_tips: 'Mẹo bấm máy tính',
    }
    render(
      <AIHintPanel
        isOpen={true}
        onClose={vi.fn()}
        question={question}
        unlockedLevel={3}
        onUnlock={vi.fn()}
        readonlyMode={true}
      />
    )
    expect(screen.getByText('Lời giải ngắn')).toBeInTheDocument()
    expect(screen.getByText('Mẹo bấm máy tính')).toBeInTheDocument()
  })
})
