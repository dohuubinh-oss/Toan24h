import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CreateQuestionPage from './page'

// Mocking children components
vi.mock('@/components/questions/creator/JsonInputSection', () => ({
  default: ({ onAiExtract }: any) => (
    <div data-testid="json-input">
      <button onClick={onAiExtract}>Tải ảnh câu hỏi</button>
    </div>
  )
}))
vi.mock('@/components/questions/creator/QuestionEditorSection', () => ({
  default: () => <div data-testid="question-editor">QuestionEditorSection</div>
}))
vi.mock('@/components/questions/creator/QuestionSettingsSidebar', () => ({
  default: () => <div data-testid="question-settings">QuestionSettingsSidebar</div>
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    back: vi.fn(),
  })),
  useSearchParams: vi.fn(() => ({
    get: vi.fn(),
  })),
}))

describe('CreateQuestionPage', () => {
  it('renders header text and tags', () => {
    render(<CreateQuestionPage />)
    expect(screen.getByText('Thêm câu hỏi thông minh')).toBeInTheDocument()
  })

  it('renders action buttons in header without duplicate AI button', () => {
    render(<CreateQuestionPage />)
    expect(screen.getByRole('button', { name: /Lưu vào ngân hàng/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Bóc tách đề bằng AI/i })).not.toBeInTheDocument()
  })

  it('renders all sections', () => {
    render(<CreateQuestionPage />)
    expect(screen.getByTestId('json-input')).toBeInTheDocument()
    expect(screen.getByTestId('question-editor')).toBeInTheDocument()
    expect(screen.getByTestId('question-settings')).toBeInTheDocument()
  })

  it('renders AI extraction trigger in JsonInputSection', () => {
    render(<CreateQuestionPage />)
    const aiBtn = screen.getByRole('button', { name: /Tải ảnh câu hỏi/i })
    expect(aiBtn).toBeInTheDocument()
  })
})
