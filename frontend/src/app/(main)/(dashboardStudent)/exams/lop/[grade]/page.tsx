import { redirect } from 'next/navigation';

export default async function GradeExamsRedirectPage({
  params,
}: {
  params: Promise<{ grade: string }>
}) {
  const { grade } = await params;
  redirect(`/lectures/lop/${grade}`);
}
