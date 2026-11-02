import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GradeLectureList } from './GradeLectureList';
import { Lecture } from '@/types/lecture';

describe('GradeLectureList', () => {
  const sampleLectures: Lecture[] = [
    {
      id: 'lec-1',
      title: 'Phương trình bậc nhất',
      chapter: 'Đại số',
      status: 'COMPLETED',
      practiceCount: 3,
      isCompleted: true,
      averageScore: 8.5,
      isLocked: false,
    },
    {
      id: 'lec-2',
      title: 'Định lý Ta-lét',
      chapter: 'Hình học',
      status: 'NOT_STARTED',
      practiceCount: 2,
      isLocked: true,
      lockReason: 'Cần hoàn thành bài trước',
    },
  ];

  it('renders all lectures initially', () => {
    render(<GradeLectureList lectures={sampleLectures} grade="8" />);

    expect(screen.getByText('Phương trình bậc nhất')).toBeInTheDocument();
    expect(screen.getByText('Định lý Ta-lét')).toBeInTheDocument();
  });

  it('filters lectures by search query', () => {
    render(<GradeLectureList lectures={sampleLectures} grade="8" />);

    const searchInput = screen.getByPlaceholderText(/Tìm kiếm bài giảng/i);
    fireEvent.change(searchInput, { target: { value: 'Ta-lét' } });

    expect(screen.queryByText('Phương trình bậc nhất')).not.toBeInTheDocument();
    expect(screen.getByText('Định lý Ta-lét')).toBeInTheDocument();
  });

  it('filters lectures by chapter', () => {
    render(<GradeLectureList lectures={sampleLectures} grade="8" />);

    const geomChip = screen.getByRole('button', { name: /Hình học/i });
    fireEvent.click(geomChip);

    expect(screen.queryByText('Phương trình bậc nhất')).not.toBeInTheDocument();
    expect(screen.getByText('Định lý Ta-lét')).toBeInTheDocument();
  });

  it('filters lectures by status', () => {
    render(<GradeLectureList lectures={sampleLectures} grade="8" />);

    const completedButton = screen.getByRole('button', { name: /Hoàn thành/i });
    fireEvent.click(completedButton);

    expect(screen.getByText('Phương trình bậc nhất')).toBeInTheDocument();
    expect(screen.queryByText('Định lý Ta-lét')).not.toBeInTheDocument();
  });

  it('paginates lectures correctly with 6 items per page and resets on filter change', () => {
    const manyLectures: Lecture[] = Array.from({ length: 8 }, (_, i) => ({
      id: `lec-${i + 1}`,
      title: `Bài giảng số ${i + 1}`,
      chapter: i < 5 ? 'Đại số' : 'Hình học',
      status: 'NOT_STARTED',
      practiceCount: 1,
      isLocked: false,
    }));

    render(<GradeLectureList lectures={manyLectures} allLectures={manyLectures} grade="8" />);

    // Page 1 should show Bài giảng 1 to 6
    expect(screen.getByText('Bài giảng số 1')).toBeInTheDocument();
    expect(screen.getByText('Bài giảng số 6')).toBeInTheDocument();
    expect(screen.queryByText('Bài giảng số 7')).not.toBeInTheDocument();

    // Pagination info
    expect(screen.getByText(/1 - 6/i)).toBeInTheDocument();
    expect(screen.getByText(/trong số/i)).toBeInTheDocument();

    // Click page 2
    const page2Button = screen.getByRole('button', { name: '2' });
    fireEvent.click(page2Button);

    expect(screen.queryByText('Bài giảng số 1')).not.toBeInTheDocument();
    expect(screen.getByText('Bài giảng số 7')).toBeInTheDocument();
    expect(screen.getByText('Bài giảng số 8')).toBeInTheDocument();

    // Filter by Hình học (which only has 3 items)
    const geomChip = screen.getByRole('button', { name: /Hình học/i });
    fireEvent.click(geomChip);

    // Resets to page 1 and only shows Hình học items (no pagination since <= 6 items)
    expect(screen.getByText('Bài giảng số 7')).toBeInTheDocument();
    expect(screen.getByText('Bài giảng số 8')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '2' })).not.toBeInTheDocument();
  });
});
