import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CreateExamPage from './page'

// Mock the child components
vi.mock('../../../../components/exams/ExamHeader', () => ({
  default: () => <div data-testid="exam-header-mock">ExamHeader</div>
}))

vi.mock('../../../../components/exams/ExamQuestionList', () => ({
  default: () => <div data-testid="exam-question-list-mock">ExamQuestionList</div>
}))

vi.mock('../../../../components/exams/ExamConfigSidebar', () => ({
  default: () => <div data-testid="exam-config-sidebar-mock">ExamConfigSidebar</div>
}))

describe('CreateExamPage', () => {
  it('renders all layout components', () => {
    render(<CreateExamPage />)
    expect(screen.getByTestId('exam-header-mock')).toBeInTheDocument()
    expect(screen.getByTestId('exam-question-list-mock')).toBeInTheDocument()
    expect(screen.getByTestId('exam-config-sidebar-mock')).toBeInTheDocument()
  })
})
