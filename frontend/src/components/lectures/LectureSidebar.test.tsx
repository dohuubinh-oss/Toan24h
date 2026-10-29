import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LectureSidebar } from './LectureSidebar';

describe('LectureSidebar', () => {
  const chapters = ['Đại số', 'Hình học'];

  it('renders search input, chapter list and status filters', () => {
    const onSearchChange = vi.fn();
    const onChapterChange = vi.fn();
    const onStatusChange = vi.fn();

    render(
      <LectureSidebar
        searchQuery=""
        onSearchChange={onSearchChange}
        selectedChapter="all"
        onChapterChange={onChapterChange}
        chapters={chapters}
        selectedStatus="all"
        onStatusChange={onStatusChange}
        totalCount={10}
        completedCount={4}
        pendingCount={2}
        lockedCount={4}
      />
    );

    expect(screen.getByPlaceholderText(/Tìm kiếm bài giảng/i)).toBeInTheDocument();
    expect(screen.getByText('Tất cả chuyên đề')).toBeInTheDocument();
    expect(screen.getByText('Đại số')).toBeInTheDocument();
    expect(screen.getByText('Hình học')).toBeInTheDocument();
    expect(screen.getByText('Đã hoàn thành')).toBeInTheDocument();
    expect(screen.getByText(/40%/i)).toBeInTheDocument(); // Tiến độ: 4/10 = 40%
  });

  it('triggers search callback when typing', () => {
    const onSearchChange = vi.fn();
    render(
      <LectureSidebar
        searchQuery=""
        onSearchChange={onSearchChange}
        selectedChapter="all"
        onChapterChange={vi.fn()}
        chapters={chapters}
        selectedStatus="all"
        onStatusChange={vi.fn()}
        totalCount={5}
        completedCount={1}
        pendingCount={1}
        lockedCount={3}
      />
    );

    const input = screen.getByPlaceholderText(/Tìm kiếm bài giảng/i);
    fireEvent.change(input, { target: { value: 'hình chóp' } });
    expect(onSearchChange).toHaveBeenCalledWith('hình chóp');
  });

  it('triggers chapter change when clicking chapter item', () => {
    const onChapterChange = vi.fn();
    render(
      <LectureSidebar
        searchQuery=""
        onSearchChange={vi.fn()}
        selectedChapter="all"
        onChapterChange={onChapterChange}
        chapters={chapters}
        selectedStatus="all"
        onStatusChange={vi.fn()}
        totalCount={5}
        completedCount={1}
        pendingCount={1}
        lockedCount={3}
      />
    );

    const geomItem = screen.getByText('Hình học');
    fireEvent.click(geomItem);
    expect(onChapterChange).toHaveBeenCalledWith('Hình học');
  });
});
