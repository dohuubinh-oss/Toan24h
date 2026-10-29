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

    const geomChip = screen.getByRole('button', { name: 'Hình học' });
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
});
