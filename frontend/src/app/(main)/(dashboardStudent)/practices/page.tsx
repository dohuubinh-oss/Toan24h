import { redirect } from 'next/navigation';

export default function PracticesRedirectPage() {
  // [TODO: WARNING] Hiện tại đang hardcode mặc định là khối 5.
  // Khi tích hợp API/JWT thật, lấy grade của học sinh từ user profile
  
  const mockStudentGrade = '5';
  
  redirect(`/practices/lop/${mockStudentGrade}`);
}
