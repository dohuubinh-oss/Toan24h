import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function ExamsRedirectPage() {
  const cookieStore = await cookies();
  const userGradeCookie = cookieStore.get('userGrade');
  const grade = userGradeCookie?.value || '6';

  redirect(`/exams/lop/${grade}`);
}
