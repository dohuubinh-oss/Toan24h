import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StudentExamListClient } from './StudentExamListClient'
import { ExamMilestone } from '@/lib/examMilestoneProgression'

describe('StudentExamListClient Component', () => {
  const dummyExams: Record<ExamMilestone, any[]> = {
    midterm_1: [
      {
        id: 'exam-1',
        title: 'Đề kiểm tra Giữa kì 1 Toán 7 - Đề số 1',
        examCode: 'GK1-T7-01',
        type: 'Giữa kì 1',
        cate: 'exam',
        duration: 60,
        questionIds: ['1', '2', '3'],
      },
      {
        id: 'exam-2',
        title: 'Đề kiểm tra Giữa kì 1 Toán 7 - Đề số 2',
        examCode: 'GK1-T7-02',
        type: 'Giữa kì 1',
        cate: 'practice',
        duration: 45,
        questionIds: ['1', '2'],
      },
    ],
    final_1: [
      {
        id: 'exam-3',
        title: 'Đề thi Cuối kì 1 Toán 7 - Chuẩn GDPT',
        examCode: 'CK1-T7-01',
        type: 'Cuối kì 1',
        cate: 'exam',
        duration: 90,
        questionIds: ['1', '2', '3', '4'],
      },
    ],
    midterm_2: [],
    final_2: [],
    topics: [],
  }

  const dummyBestSubmissions: Record<string, any> = {
    'exam-1': {
      id: 'sub-1',
      examId: 'exam-1',
      score: 8.5,
    },
  }

  it('renders with active milestone defaulted to currentMilestone', () => {
    render(
      <StudentExamListClient
        grade="7"
        currentMilestone="midterm_1"
        examsByMilestone={dummyExams}
        bestSubmissions={dummyBestSubmissions}
      />
    )

    // Current milestone is midterm_1, both exams should be visible
    expect(screen.getByText('Đề kiểm tra Giữa kì 1 Toán 7 - Đề số 1')).toBeInTheDocument()
    expect(screen.getByText('Đề kiểm tra Giữa kì 1 Toán 7 - Đề số 2')).toBeInTheDocument()
    // Cuối kì 1 is not in the active view
    expect(screen.queryByText('Đề thi Cuối kì 1 Toán 7 - Chuẩn GDPT')).not.toBeInTheDocument()
  })

  it('displays best score badge for exams with submissions', () => {
    render(
      <StudentExamListClient
        grade="7"
        currentMilestone="midterm_1"
        examsByMilestone={dummyExams}
        bestSubmissions={dummyBestSubmissions}
      />
    )

    expect(screen.getByText(/8\.5\/10\s*đ/i)).toBeInTheDocument()
  })

  it('switches tabs and displays exams for the newly selected milestone', () => {
    render(
      <StudentExamListClient
        grade="7"
        currentMilestone="midterm_1"
        examsByMilestone={dummyExams}
        bestSubmissions={dummyBestSubmissions}
      />
    )

    const ck1Tab = screen.getByRole('tab', { name: /Cuối kì 1/i })
    fireEvent.click(ck1Tab)

    expect(screen.getByText('Đề thi Cuối kì 1 Toán 7 - Chuẩn GDPT')).toBeInTheDocument()
    expect(screen.queryByText('Đề kiểm tra Giữa kì 1 Toán 7 - Đề số 1')).not.toBeInTheDocument()
  })

  it('displays empty state when selected milestone has no exams', () => {
    render(
      <StudentExamListClient
        grade="7"
        currentMilestone="midterm_1"
        examsByMilestone={dummyExams}
        bestSubmissions={dummyBestSubmissions}
      />
    )

    const gk2Tab = screen.getByRole('tab', { name: /Giữa kì 2/i })
    fireEvent.click(gk2Tab)

    expect(screen.getByText(/Chưa có đề thi nào trong Giữa kì 2/i)).toBeInTheDocument()
    expect(screen.getByText(/Nội dung đề thi cho chặng này đang được cập nhật/i)).toBeInTheDocument()
  })

  it('filters exams by search query and shows empty state when no match is found', () => {
    render(
      <StudentExamListClient
        grade="7"
        currentMilestone="midterm_1"
        examsByMilestone={dummyExams}
        bestSubmissions={dummyBestSubmissions}
      />
    )

    const searchInput = screen.getByPlaceholderText(/Tìm kiếm đề thi/i)
    fireEvent.change(searchInput, { target: { value: 'Đề số 2' } })

    expect(screen.getByText('Đề kiểm tra Giữa kì 1 Toán 7 - Đề số 2')).toBeInTheDocument()
    expect(screen.queryByText('Đề kiểm tra Giữa kì 1 Toán 7 - Đề số 1')).not.toBeInTheDocument()

    // Search query with no match
    fireEvent.change(searchInput, { target: { value: 'Không tồn tại 999' } })
    expect(screen.getByText(/Không tìm thấy đề thi phù hợp/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Xóa tìm kiếm/i })).toBeInTheDocument()

    // Clicking "Xóa tìm kiếm" resets query and displays exams again
    fireEvent.click(screen.getByRole('button', { name: /Xóa tìm kiếm/i }))
    expect(screen.getByText('Đề kiểm tra Giữa kì 1 Toán 7 - Đề số 1')).toBeInTheDocument()
  })

  it('marks untaken exam as recommended when in current milestone', () => {
    render(
      <StudentExamListClient
        grade="7"
        currentMilestone="midterm_1"
        examsByMilestone={dummyExams}
        bestSubmissions={dummyBestSubmissions}
      />
    )

    // exam-2 is not submitted yet and should be recommended
    expect(screen.getByText(/Khuyên làm/i)).toBeInTheDocument()
  })
})
