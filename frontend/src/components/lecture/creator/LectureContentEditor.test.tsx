import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import LectureContentEditor from './LectureContentEditor'
import { LectureCreatorProvider } from './LectureCreatorContext'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn() })
}))

describe('LectureContentEditor', () => {
  it('renders section title and global batch json import button', () => {
    render(
      <LectureCreatorProvider>
        <LectureContentEditor />
      </LectureCreatorProvider>
    )

    expect(screen.getByText('2. Phân tích bài tập mẫu')).toBeDefined()
    expect(screen.getByRole('button', { name: /Nhập JSON/i })).toBeDefined()
  })
})
