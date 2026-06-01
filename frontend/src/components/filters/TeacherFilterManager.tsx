'use client'

import React from 'react';
import { usePathname } from 'next/navigation';
import { QuestionFilter } from './QuestionFilter';
import { ExamFilter } from './ExamFilter';
import { UserFilter } from './UserFilter';

export function TeacherFilterManager() {
  const pathname = usePathname();

  if (pathname?.startsWith('/dashboard/questions')) {
    return <QuestionFilter />;
  }
  
  if (pathname?.startsWith('/dashboard/exams')) {
    return <ExamFilter />;
  }
  
  if (pathname?.startsWith('/dashboard/users')) {
    return <UserFilter />;
  }

  // Fallback (nên không bao giờ xảy ra nếu mount đúng vị trí)
  return null;
}
