'use client'

import React from 'react';
import { usePathname } from 'next/navigation';
import { StudentLectureFilter } from './StudentLectureFilter';

export function StudentFilterManager() {
  const pathname = usePathname();

  // Chỉ hiển thị Filter ở trang Danh sách Bài học và Luyện tập (đường dẫn chứa /lop/)
  const isListPage = pathname?.includes('/lop/');
  const isLectureOrPractice = pathname?.startsWith('/lectures') || pathname?.startsWith('/practices');

  if (isLectureOrPractice && isListPage) {
    return <StudentLectureFilter />;
  }

  // Trang Dashboard, hoặc trang Chi tiết bài giảng (/lectures/[id]) sẽ không có bộ lọc
  return null;
}
