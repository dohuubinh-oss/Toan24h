import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CreateQuestionPage from './page'

// Mocking children components
vi.mock('@/components/questions/creator/JsonInputSection', () => ({
  default: () => <div data-testid="json-input">JsonInputSection</div>
}))
vi.mock('@/components/questions/creator/QuestionEditorSection', () => ({
  default: () => <div data-testid="question-editor">QuestionEditorSection</div>
}))
vi.mock('@/components/questions/creator/QuestionSettingsSidebar', () => ({
  default: () => <div data-testid="question-settings">QuestionSettingsSidebar</div>
}))

describe('CreateQuestionPage', () => {
  it('renders header text and tags', () => {
    render(<CreateQuestionPage />)
    expect(screen.getByText('Smart Question Creator')).toBeInTheDocument()
    expect(screen.getByText('Câu hỏi chùm')).toBeInTheDocument()
  })

  it('renders action buttons', () => {
    render(<CreateQuestionPage />)
    const previewButtons = screen.getAllByRole('button', { name: /Xem trước/i })
    expect(previewButtons.length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /Lưu vào ngân hàng/i })).toBeInTheDocument()
  })

  it('renders all sections', () => {
    render(<CreateQuestionPage />)
    expect(screen.getByTestId('json-input')).toBeInTheDocument()
    expect(screen.getByTestId('question-editor')).toBeInTheDocument()
    expect(screen.getByTestId('question-settings')).toBeInTheDocument()
  })
})
