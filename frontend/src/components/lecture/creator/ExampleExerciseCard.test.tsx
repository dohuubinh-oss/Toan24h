import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ExampleExerciseCard from './ExampleExerciseCard'

describe('ExampleExerciseCard', () => {
  const mockExercise = {
    title: 'Phân tích bài tập mẫu',
    problem: 'Cho khối chóp S.ABC...',
    steps: [
      { step: 1, title: 'Tính diện tích', content: 'S = a^2', formula: 'B = S' }
    ],
    conclusion: 'Kết luận: V = a^3 / 3'
  }

  it('renders empty state correctly', () => {
    render(
      <ExampleExerciseCard
        title="2. Phân tích bài tập mẫu"
        exercise={null}
        imageUrl={null}
        onExerciseChange={vi.fn()}
        onImageChange={vi.fn()}
      />
    )
    expect(screen.getByText('2. Phân tích bài tập mẫu')).toBeDefined()
    expect(screen.getByText('Chưa có dữ liệu bài tập mẫu')).toBeDefined()
  })

  it('renders exercise data correctly', () => {
    render(
      <ExampleExerciseCard
        title="2. Phân tích bài tập mẫu"
        exercise={mockExercise}
        imageUrl={null}
        onExerciseChange={vi.fn()}
        onImageChange={vi.fn()}
      />
    )
    expect(screen.getByText('Đề bài:')).toBeDefined()
    expect(screen.getByText('Cho khối chóp S.ABC...')).toBeDefined()
    expect(screen.getByText('Tính diện tích')).toBeDefined()
    expect(screen.getByText('S = a^2')).toBeDefined()
    expect(screen.getByText('B = S')).toBeDefined()
    expect(screen.getByText('Kết luận: V = a^3 / 3')).toBeDefined()
  })

  it('opens JSON modal on button click', () => {
    render(
      <ExampleExerciseCard
        title="2. Phân tích bài tập mẫu"
        exercise={null}
        imageUrl={null}
        onExerciseChange={vi.fn()}
        onImageChange={vi.fn()}
      />
    )
    
    const btn = screen.getByText('Thêm JSON')
    fireEvent.click(btn)
    
    expect(screen.getByText('Nhập dữ liệu JSON')).toBeDefined()
  })
})
