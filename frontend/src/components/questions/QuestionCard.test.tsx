import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuestionCard from './QuestionCard';

describe('QuestionCard', () => {
  const defaultProps = {
    id: 'Q123',
    grade: 9,
    topic: 'Căn bậc hai',
    difficulty: 'Thông hiểu',
    isSelected: false,
    onToggle: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onSwap: vi.fn(),
  };

  it('renders badges and question ID with proper labels', () => {
    render(
      <QuestionCard {...defaultProps}>
        <div>Nội dung câu hỏi mẫu</div>
      </QuestionCard>
    );

    expect(screen.getByText('LỚP 9')).toBeInTheDocument();
    expect(screen.getByText('Căn bậc hai')).toBeInTheDocument();
    expect(screen.getByText('Thông hiểu')).toBeInTheDocument();
    expect(screen.getByText('ID: Q123')).toBeInTheDocument();
    expect(screen.getByText('Nội dung câu hỏi mẫu')).toBeInTheDocument();
  });

  it('renders accessible action buttons and triggers callbacks', () => {
    render(<QuestionCard {...defaultProps} />);

    const swapBtn = screen.getByRole('button', { name: 'Đổi câu hỏi Q123' });
    const editBtn = screen.getByRole('button', { name: 'Chỉnh sửa câu hỏi Q123' });
    const deleteBtn = screen.getByRole('button', { name: 'Xóa câu hỏi Q123' });

    expect(swapBtn).toBeInTheDocument();
    expect(editBtn).toBeInTheDocument();
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(swapBtn);
    expect(defaultProps.onSwap).toHaveBeenCalledTimes(1);

    fireEvent.click(editBtn);
    expect(defaultProps.onEdit).toHaveBeenCalledTimes(1);

    fireEvent.click(deleteBtn);
    expect(defaultProps.onDelete).toHaveBeenCalledTimes(1);
  });

  it('handles checkbox toggle with proper aria-label', () => {
    render(<QuestionCard {...defaultProps} isSelected={true} />);

    const checkbox = screen.getByRole('checkbox', { name: 'Chọn câu hỏi ID Q123' });
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders question number badge when index is provided', () => {
    render(<QuestionCard {...defaultProps} index={0} />);

    expect(screen.getByText('Câu 1')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
