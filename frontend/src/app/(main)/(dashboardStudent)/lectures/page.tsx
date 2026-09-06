import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function LecturesRedirectPage() {
  const cookieStore = await cookies();
  const userGradeCookie = cookieStore.get('userGrade')?.value;

  // Nếu người dùng đã có lớp, redirect thẳng tới trang bài giảng của lớp đó
  if (userGradeCookie && userGradeCookie.trim() !== '') {
    redirect(`/lectures/lop/${userGradeCookie}`);
  }

  // Nếu chưa có lớp, không redirect. 
  // Modal chọn lớp từ layout.tsx sẽ hiện lên che toàn bộ trang.
  return (
    <div className="flex h-full items-center justify-center min-h-[500px]">
      {/* Giao diện trống trong lúc Modal đang bật */}
    </div>
  );
}
