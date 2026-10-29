import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LectureToolbar } from './LectureToolbar';

describe('LectureToolbar', () => {
  const chapters = ['Đại số', 'Hình học'];

  it('renders search input and chapter filters', () => {
    const onSearchChange = vi.fn();
    const onChapterChange = vi.fn();
    const onStatusChange = vi.fn();

    render(
      <LectureToolbar
        searchQuery=""
        onSearchChange={onSearchChange}
        selectedChapter="all"
        onChapterChange={onChapterChange}
        chapters={chapters}
        selectedStatus="all"
        onStatusChange={onStatusChange}
      />
    );

    expect(screen.getByPlaceholderText(/Tìm kiếm bài giảng/i)).toBeInTheDocument();
    expect(screen.getByText('Tất cả')).toBeInTheDocument();
    expect(screen.getByText('Đại số')).toBeInTheDocument();
    expect(screen.getByText('Hình học')).toBeInTheDocument();
  });

  it('triggers search callback when typing', () => {
    const onSearchChange = vi.fn();
    render(
      <LectureToolbar
        searchQuery=""
        onSearchChange={onSearchChange}
        selectedChapter="all"
        onChapterChange={vi.fn()}
        chapters={chapters}
        selectedStatus="all"
        onStatusChange={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText(/Tìm kiếm bài giảng/i);
    fireEvent.change(input, { target: { value: 'phương trình' } });
    expect(onSearchChange).toHaveBeenCalledWith('phương trình');
  });

  it('triggers chapter filter change when clicking chapter chip', () => {
    const onChapterChange = vi.fn();
    render(
      <LectureToolbar
        searchQuery=""
        onSearchChange={vi.fn()}
        selectedChapter="all"
        onChapterChange={onChapterChange}
        chapters={chapters}
        selectedStatus="all"
        onStatusChange={vi.fn()}
      />
    );

    const algebraChip = screen.getByText('Đại số');
    fireEvent.click(algebraChip);
    expect(onChapterChange).toHaveBeenCalledWith('Đại số');
  });
});
