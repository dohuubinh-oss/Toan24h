import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EssayQuestion from './EssayQuestion'
import { ToastProvider } from '@/components/ui/ToastProvider'

// Top-level mocks
vi.mock('@/lib/api', () => ({
  recognizeHandwriting: vi.fn().mockResolvedValue('OCR_TEXT_RESULT'),
  uploadTempImage: vi.fn().mockResolvedValue('http://mock-url.com/img.png'),
  submitAppeal: vi.fn(),
  reportQuestion: vi.fn()
}))

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
  beforeEach(() => {
    vi.clearAllMocks()

    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }])
        })
      }
    })

    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const renderWithToast = (ui: React.ReactElement) => {
    return render(<ToastProvider>{ui}</ToastProvider>)
  }

  it('renders single question content and handles input', async () => {
    const handleAnswerChange = vi.fn()
    const user = userEvent.setup()

    renderWithToast(
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

    renderWithToast(
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

    expect(screen.getByText('Lời giải câu 10a')).toBeInTheDocument()
    expect(screen.getByText('Lời giải câu 10b')).toBeInTheDocument()

    const inputs = document.querySelectorAll('.ProseMirror')
    expect(inputs).toHaveLength(2)

    await user.type(inputs[1] as HTMLElement, '24cm2')
    ;(inputs[1] as HTMLElement).blur()
    expect(handleAnswerChange).toHaveBeenCalled()
  })

  it('renders MC group questions and opens QR modal on desktop', async () => {
    // Default matchMedia returns matches: false (desktop)
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))

    const handleAnswerChange = vi.fn()
    const user = userEvent.setup()

    renderWithToast(
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

    // Option A and B render
    const optionA = screen.getByText('A')
    const optionB = screen.getByText('B')
    expect(optionA).toBeInTheDocument()
    expect(optionB).toBeInTheDocument()

    // Click option A
    await user.click(optionA)
    expect(handleAnswerChange).toHaveBeenCalledWith(21, 'A', '')

    // Check camera button
    const cameraButton = screen.getByRole('button', { name: /Chụp bài thi/i })
    expect(cameraButton).toBeInTheDocument()

    // Clicking camera on desktop opens Mobile QR upload modal
    fireEvent.click(cameraButton)
    expect(screen.getByText(/Chụp bài làm bằng điện thoại/i)).toBeInTheDocument()
  })

  it('opens InAppCameraModal when clicking camera on mobile device', async () => {
    // Simulate mobile touch device
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('pointer: coarse'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))

    renderWithToast(
      <EssayQuestion
        questionId={30}
        index={29}
        content="Bài tập hình học"
        answers={{}}
        isHintOpen={false}
        isFlagged={false}
        onAnswerChange={vi.fn()}
        onToggleFlag={vi.fn()}
        onToggleHint={vi.fn()}
      />
    )

    const cameraButton = screen.getByRole('button', { name: /Chụp bài thi/i })
    fireEvent.click(cameraButton)

    // Should open In-App WebRTC Camera modal directly, not QR modal!
    expect(screen.getByText(/Chụp ảnh bài làm trực tiếp/i)).toBeInTheDocument()
    expect(screen.queryByText(/Chụp bài làm bằng điện thoại/i)).not.toBeInTheDocument()
  })

  it('renders step results with score badges, titles, and error details in readonly mode', () => {
    const aiFeedbacks = {
      1: {
        isCorrect: false,
        score: 0.5,
        maxScore: 1.0,
        aiExplanation: 'Giải thích chung',
        isAlternativeMethod: true,
        stepResults: [
          {
            step: 1,
            title: 'Tìm điều kiện xác định',
            score: 0.5,
            max_score: 0.5,
            is_correct: true,
          },
          {
            step: 2,
            title: 'Biến đổi phương trình',
            score: 0.0,
            max_score: 0.5,
            is_correct: false,
            error_location: '2x = 6',
            deduction_reason: 'Chuyển vế đổi dấu sai',
          },
        ],
      },
    }

    renderWithToast(
      <EssayQuestion
        questionId={1}
        index={0}
        content="Giải phương trình"
        answers={{ 1: 'x = 3' }}
        isHintOpen={false}
        isFlagged={false}
        readonly={true}
        aiFeedbacks={aiFeedbacks as any}
      />
    )

    expect(screen.getByText(/Chi tiết chấm điểm từng bước/i)).toBeInTheDocument()
    expect(screen.getByText(/Tìm điều kiện xác định/i)).toBeInTheDocument()
    expect(screen.getByText(/Chuyển vế đổi dấu sai/i)).toBeInTheDocument()
    expect(screen.getByText(/phương pháp tương đương hợp lệ/i)).toBeInTheDocument()
  })

  it('renders diagram upload button and opens diagram QR modal', () => {
    renderWithToast(
      <EssayQuestion
        questionId={50}
        index={49}
        content="Cho hình chóp S.ABCD"
        answers={{}}
        isHintOpen={false}
        isFlagged={false}
        onAnswerChange={vi.fn()}
        onToggleFlag={vi.fn()}
        onToggleHint={vi.fn()}
      />
    )

    const diagramButton = screen.getByRole('button', { name: /Tải ảnh hình vẽ/i })
    expect(diagramButton).toBeInTheDocument()
    fireEvent.click(diagramButton)

    expect(screen.getByText(/Chụp ảnh hình vẽ bằng điện thoại/i)).toBeInTheDocument()
  })

  it('renders independent diagram result card in readonly mode', () => {
    const aiFeedbacks = {
      60: {
        isCorrect: true,
        score: 1.0,
        maxScore: 1.0,
        aiExplanation: 'Lời giải tốt',
        diagramResult: {
          hasDiagramRequired: true,
          score: 0.5,
          maxScore: 0.5,
          isCorrect: true,
          explanation: 'Hình vẽ các đỉnh, đường cao AH và ký hiệu vuông góc chính xác.',
          studentDiagramUrl: '/uploads/diagrams/sub_test_60.jpg'
        }
      }
    }

    renderWithToast(
      <EssayQuestion
        questionId={60}
        index={59}
        content="Cho tam giác ABC có đường cao AH"
        answers={{ 60: 'AH = 4cm' }}
        isHintOpen={false}
        isFlagged={false}
        readonly={true}
        aiFeedbacks={aiFeedbacks as any}
      />
    )

    expect(screen.getByText(/Phần vẽ hình: 0.5 \/ 0.5 điểm/i)).toBeInTheDocument()
    expect(screen.getByText(/Hình vẽ các đỉnh, đường cao AH và ký hiệu vuông góc chính xác./i)).toBeInTheDocument()
    expect(screen.getByAltText(/Ảnh hình vẽ bài làm/i)).toBeInTheDocument()
  })

  it('renders inline QuestionHintTabs below question content when isHintOpen is true in practice mode', () => {
    const handleToggleHint = vi.fn()
    renderWithToast(
      <EssayQuestion
        questionId={70}
        index={69}
        content="Cho tam giác vuông có hai cạnh góc vuông là 3 và 4. Tính cạnh huyền."
        answers={{}}
        hint="Sử dụng định lý Pytago a^2 + b^2 = c^2"
        shortAnswer="Cạnh huyền bằng 5"
        generalMethod="Phương pháp áp dụng định lý Pytago"
        solution_guide="Áp dụng định lý Pytago: c = \sqrt{3^2 + 4^2} = 5"
        isHintOpen={true}
        isFlagged={false}
        examType="practice"
        onToggleHint={handleToggleHint}
      />
    )

    expect(screen.getByTestId('question-hints-inline')).toBeInTheDocument()
    expect(screen.getByText('Gợi ý hướng giải bài toán')).toBeInTheDocument()
    expect(screen.getByText(/Sử dụng định lý Pytago/)).toBeInTheDocument()
    expect(screen.getByText('Mẹo giải nhanh')).toBeInTheDocument()
    expect(screen.getByText('Lời giải mẫu')).toBeInTheDocument()
  })

  it('toggles solution guide (Hình 3) below question content in readonly result mode', () => {
    const handleToggleHint = vi.fn()
    const { rerender } = renderWithToast(
      <EssayQuestion
        questionId={70}
        index={69}
        content="Cho tam giác vuông có hai cạnh góc vuông là 3 và 4. Tính cạnh huyền."
        answers={{ 70: 'c = 5' }}
        solution_guide="Áp dụng định lý Pytago: c = \sqrt{3^2 + 4^2} = 5"
        isHintOpen={true}
        isFlagged={false}
        readonly={true}
        onToggleHint={handleToggleHint}
      />
    )

    // Solution guide like Hình 3 is displayed below question content
    const solutionResultBox = screen.getByTestId('solution-guide-result')
    expect(solutionResultBox).toBeInTheDocument()
    expect(within(solutionResultBox).getByText('Lời giải chi tiết (Đáp án chuẩn)')).toBeInTheDocument()

    // When isHintOpen is false, it is hidden
    rerender(
      <ToastProvider>
        <EssayQuestion
          questionId={70}
          index={69}
          content="Cho tam giác vuông có hai cạnh góc vuông là 3 và 4. Tính cạnh huyền."
          answers={{ 70: 'c = 5' }}
          solution_guide="Áp dụng định lý Pytago: c = \sqrt{3^2 + 4^2} = 5"
          isHintOpen={false}
          isFlagged={false}
          readonly={true}
          onToggleHint={handleToggleHint}
        />
      </ToastProvider>
    )
    expect(screen.queryByTestId('solution-guide-result')).toBeNull()
  })
})
