import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EssayQuestion from './EssayQuestion'

// Mock getClientRects for jsdom (used by ProseMirror)
Element.prototype.getClientRects = vi.fn(() => [] as unknown as DOMRectList)
Element.prototype.getBoundingClientRect = vi.fn(() => ({
  width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => {}
}))
if (typeof Range !== 'undefined') {
  Range.prototype.getClientRects = vi.fn(() => [] as unknown as DOMRectList)
  Range.prototype.getBoundingClientRect = vi.fn(() => ({
    width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => {}
  }))
}
if (typeof document !== 'undefined') {
  document.elementFromPoint = vi.fn(() => null)
}

describe('EssayQuestion Component', () => {
  it('renders single question content and handles input', async () => {
    const handleAnswerChange = vi.fn()
    const user = userEvent.setup()
    
    render(
      <EssayQuestion
        questionId={42}
        index={41}
        content="Tính độ dài cạnh huyền BC"
        answers={{}}
        isHintOpen={false}
        isFlagged={false}
        onAnswerChange={handleAnswerChange}
        onToggleFlag={vi.fn()}
        onToggleHint={vi.fn()}
      />
    )
    
    expect(screen.getByText('Câu hỏi 42')).toBeInTheDocument()
    expect(screen.getByText('Tính độ dài cạnh huyền BC')).toBeInTheDocument()
    
    const input = document.querySelector('.ProseMirror') as HTMLElement
    expect(input).toBeInTheDocument()
    
    await user.type(input, '10')
    input.blur()
    
    expect(handleAnswerChange).toHaveBeenCalled()
  })

  it('renders group question content and handles input', async () => {
    const handleAnswerChange = vi.fn()
    const user = userEvent.setup()
    
    render(
      <EssayQuestion
        questionId={10}
        index={9}
        sharedContext="Cho tam giác ABC vuông tại A"
        subQuestions={[
          { id: 11, type: 'essay', content: 'Tính độ dài cạnh huyền BC' },
          { id: 12, type: 'essay', content: 'Tính diện tích tam giác ABC' }
        ]}
        answers={{ 11: '10cm' }}
        isHintOpen={false}
        isFlagged={false}
        onAnswerChange={handleAnswerChange}
        onToggleFlag={vi.fn()}
        onToggleHint={vi.fn()}
      />
    )
    
    expect(screen.getByText('Câu hỏi 10')).toBeInTheDocument()
    expect(screen.getByText('Cho tam giác ABC vuông tại A')).toBeInTheDocument()
    expect(screen.getByText('Tính độ dài cạnh huyền BC')).toBeInTheDocument()
    expect(screen.getByText('Tính diện tích tam giác ABC')).toBeInTheDocument()
    
    expect(screen.getByText('Lời giải Ý 1')).toBeInTheDocument()
    expect(screen.getByText('Lời giải Ý 2')).toBeInTheDocument()

    const inputs = document.querySelectorAll('.ProseMirror')
    expect(inputs).toHaveLength(2)
    
    await user.type(inputs[1] as HTMLElement, '24cm2')
    ;(inputs[1] as HTMLElement).blur()
    expect(handleAnswerChange).toHaveBeenCalled()
  })

  it('renders MC group questions and handles answer selection and OCR', async () => {
    // Mock the recognizeHandwriting function
    vi.mock('@/lib/api', () => ({
      recognizeHandwriting: vi.fn().mockResolvedValue('OCR_TEXT_RESULT'),
      uploadTempImage: vi.fn().mockResolvedValue('http://mock-url.com/img.png')
    }))

    const handleAnswerChange = vi.fn()
    const user = userEvent.setup()
    
    render(
      <EssayQuestion
        questionId={20}
        index={19}
        sharedContext="Cho hàm số y = x^3"
        subQuestions={[
          { 
            id: 21, 
            type: 'mc', 
            content: 'Đạo hàm là:', 
            options: [
              { id: 'A', text: '3x^2' },
              { id: 'B', text: '2x^2' }
            ] 
          }
        ]}
        answers={{}}
        explanations={{}}
        isHintOpen={false}
        isFlagged={false}
        onAnswerChange={handleAnswerChange}
        onToggleFlag={vi.fn()}
        onToggleHint={vi.fn()}
      />
    )
    
    // Left pane should have buttons for options A and B
    const optionA = screen.getByText('A')
    const optionB = screen.getByText('B')
    expect(optionA).toBeInTheDocument()
    expect(optionB).toBeInTheDocument()

    // Click option A
    await user.click(optionA)
    // First argument is subquestion ID (21), second is answer ('A'), third is explanation (empty string)
    expect(handleAnswerChange).toHaveBeenCalledWith(21, 'A', '')

    // Check right pane for OCR button
    const ocrButton = screen.getByText('Tải ảnh lời giải bài làm tay').closest('button')
    expect(ocrButton).toBeInTheDocument()

    // Verify it handles OCR (simulated by clicking a file input that will be inside the wrapper)
    // The actual component will use a hidden input type=file, which we can find by its type
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(fileInput).toBeInTheDocument()
  })
})
