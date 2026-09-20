import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function ExamsRedirectPage() {
  const cookieStore = await cookies();
  const userRoleCookie = cookieStore.get('userRole')?.value;
  const userGradeCookie = cookieStore.get('userGrade')?.value;

  if (userRoleCookie === 'admin' || userRoleCookie === 'teacher') {
    redirect('/dashboard/tests');
  }

  // Nếu người dùng đã có lớp, redirect thẳng tới trang đề thi của lớp đó
  if (userGradeCookie && userGradeCookie.trim() !== '') {
    redirect(`/exams/lop/${userGradeCookie}`);
  }

  // Nếu chưa có lớp, không redirect. 
  // Modal chọn lớp từ layout.tsx sẽ hiện lên che toàn bộ trang.
  return (
    <div className="flex h-full items-center justify-center min-h-[500px]">
      {/* Giao diện trống trong lúc Modal đang bật */}
    </div>
  );
}
