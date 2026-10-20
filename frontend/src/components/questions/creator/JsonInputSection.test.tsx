import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import JsonInputSection from './JsonInputSection'

describe('JsonInputSection Component', () => {
  it('renders initialValue in the textarea when provided', () => {
    const sampleJson = JSON.stringify([{ shared_content: '', questions: [] }])
    render(<JsonInputSection initialValue={sampleJson} />)

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea.value).toBe(sampleJson)
  })

  it('formats question content and solution guide to HTML on process', () => {
    const handleProcessJson = vi.fn()
    render(<JsonInputSection onProcessJson={handleProcessJson} />)

    const rawInput = JSON.stringify([
      {
        shared_content: 'Đoạn dẫn chung 1.\nĐoạn dẫn chung 2.',
        questions: [
          {
            type_question: 'single',
            content: 'Câu hỏi tính diện tích:\nBiết $a = 2$, $b = 3$.',
            type: 'Trắc nghiệm',
            options: ['A. $S = 6$', 'B. $S = 5$', 'C. $S = 1$', 'D. $S = 10$'],
            correct_answer: '$S = 6$',
            solution_guide: 'Lời giải chi tiết:\nÁp dụng công thức $S = a \\cdot b$\nTa có $S = 2 \\cdot 3 = 6$.'
          }
        ]
      }
    ])

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: rawInput } })

    const processBtn = screen.getByRole('button', { name: /Xử lý JSON/i })
    fireEvent.click(processBtn)

    expect(handleProcessJson).toHaveBeenCalledTimes(1)
    const blocks = handleProcessJson.mock.calls[0][0]
    expect(blocks).toHaveLength(1)

    const block = blocks[0]
    expect(block.shared_content).toContain('<p>Đoạn dẫn chung 1.<br/>Đoạn dẫn chung 2.</p>')

    const q = block.questions[0]
    expect(q.content).toContain('<p>Câu hỏi tính diện tích:<br/>Biết $a = 2$, $b = 3$.</p>')
    expect(q.solution_guide).toContain('<br/>')
    expect(q.solution_guide).toContain('$S = 2 \\cdot 3 = 6$.')
  })
})
