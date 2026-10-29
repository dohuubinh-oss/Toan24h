import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GradeRestrictionModal } from './GradeRestrictionModal';

describe('GradeRestrictionModal', () => {
  it('renders modal with friendly message and action buttons', () => {
    render(
      <GradeRestrictionModal
        userGrade="8"
        attemptedGrade="6"
      />
    );

    expect(screen.getByText('Gói học của bạn dành riêng cho Khối 8')).toBeInTheDocument();
    expect(screen.getByText(/Tài khoản hiện tại được thiết kế chuyên sâu cho chương trình/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Trở về bài học Lớp 8 của tôi/i })).toHaveAttribute(
      'href',
      '/lectures/lop/8'
    );
    expect(screen.getByRole('link', { name: /Đổi khối lớp trong Cài đặt/i })).toHaveAttribute(
      'href',
      '/student/settings'
    );
  });
});
