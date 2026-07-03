'use client'

import React from 'react';
import { usePathname } from 'next/navigation';
import { StudentLectureFilter } from './StudentLectureFilter';

export function StudentFilterManager() {
  const pathname = usePathname();

  // Chỉ hiển thị Filter ở trang Danh sách Bài học (không phải trang chi tiết, không phải luyện tập)
  const segments = pathname?.split('/') || [];
  const isLectureList = pathname?.startsWith('/lectures') && pathname?.includes('/lop/') && segments.length <= 4;

  if (isLectureList) {
    return <StudentLectureFilter />;
  }

  // Trang Dashboard, hoặc trang Chi tiết bài giảng sẽ không có bộ lọc
  return null;
}
