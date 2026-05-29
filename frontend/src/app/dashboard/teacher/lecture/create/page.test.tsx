import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CreateLecturePage from './page'

// Mock TipTap editor since we already tested the inner components
vi.mock('@/components/lecture/creator/LectureContentEditor', () => ({
  default: () => <div data-testid="mock-editor">Mock Editor</div>
}))

describe('CreateLecturePage', () => {
  it('renders all sections', () => {
    render(<CreateLecturePage />)
    expect(screen.getByText('Soạn bài giảng mới')).toBeDefined()
    expect(screen.getByText('Cấu hình cơ bản')).toBeDefined()
    expect(screen.getByTestId('mock-editor')).toBeDefined()
  })
})
