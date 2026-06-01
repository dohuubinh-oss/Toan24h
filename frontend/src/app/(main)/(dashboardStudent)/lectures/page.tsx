import { redirect } from 'next/navigation';

export default function LecturesRedirectPage() {
  // [TODO: WARNING] Hiện tại đang hardcode mặc định là khối 5.
  // KHI CÓ API HOẶC JWT TỪ BACKEND:
  // 1. Trích xuất thông tin người dùng từ JWT hoặc gọi API lấy profile.
  // 2. Lấy được `grade` (khối lớp) của học sinh đó.
  // 3. Redirect sang route tương ứng. Ví dụ: redirect(`/lectures/lop/${user.grade}`)
  
  const mockStudentGrade = '5'; // Giả lập học sinh lớp 5
  
  redirect(`/lectures/lop/${mockStudentGrade}`);
}
