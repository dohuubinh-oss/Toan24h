export type ExamMilestone = 'midterm_1' | 'final_1' | 'midterm_2' | 'final_2' | 'topics';

export interface MilestoneInfo {
  id: ExamMilestone;
  title: string;
  typeMatch: string[]; // ['Giữa kì 1'], ['Cuối kì 1'], etc.
  order: number;
}

export const MILESTONES_CONFIG: MilestoneInfo[] = [
  {
    id: 'midterm_1',
    title: 'Giữa kì 1',
    typeMatch: [
      'Giữa kì 1',
      'Giữa kỳ 1',
      'Giữa kì I',
      'Giữa kỳ I',
      'midterm_1',
      'midterm 1',
      'midterm-1',
      'giua_ki_1',
      'gk1',
    ],
    order: 1,
  },
  {
    id: 'final_1',
    title: 'Cuối kì 1',
    typeMatch: [
      'Cuối kì 1',
      'Cuối kỳ 1',
      'Cuối kì I',
      'Cuối kỳ I',
      'Học kì 1',
      'Học kỳ 1',
      'Học kì I',
      'Học kỳ I',
      'final_1',
      'final 1',
      'final-1',
      'cuoi_ki_1',
      'ck1',
      'hk1',
    ],
    order: 2,
  },
  {
    id: 'midterm_2',
    title: 'Giữa kì 2',
    typeMatch: [
      'Giữa kì 2',
      'Giữa kỳ 2',
      'Giữa kì II',
      'Giữa kỳ II',
      'midterm_2',
      'midterm 2',
      'midterm-2',
      'giua_ki_2',
      'gk2',
    ],
    order: 3,
  },
  {
    id: 'final_2',
    title: 'Cuối kì 2',
    typeMatch: [
      'Cuối kì 2',
      'Cuối kỳ 2',
      'Cuối kì II',
      'Cuối kỳ II',
      'Học kì 2',
      'Học kỳ 2',
      'Học kì II',
      'Học kỳ II',
      'final_2',
      'final 2',
      'final-2',
      'cuoi_ki_2',
      'ck2',
      'hk2',
    ],
    order: 4,
  },
  {
    id: 'topics',
    title: 'Chuyên đề & Ôn tập',
    typeMatch: [
      'Chuyên Đề',
      'Chuyên đề',
      'Ôn tập',
      'HSG',
      'học sinh giỏi',
      'chuyen de',
      'on tap',
      'topics',
      'specialized',
    ],
    order: 5,
  },
];

/**
 * Xác định phân loại chặng cho một đề thi dựa vào type, title hoặc milestone có sẵn.
 */
export function getMilestoneForExam(exam: any): ExamMilestone {
  if (!exam) return 'topics';

  // 1. Nếu đề thi đã có sẵn trường milestone hợp lệ
  if (exam.milestone && MILESTONES_CONFIG.some((m) => m.id === exam.milestone)) {
    return exam.milestone as ExamMilestone;
  }

  const rawType = (exam.type || '').toString().trim().toLowerCase();
  const rawTitle = (exam.title || '').toString().trim().toLowerCase();

  // 2. Kiểm tra typeMatch từ MILESTONES_CONFIG
  if (rawType) {
    for (const milestone of MILESTONES_CONFIG) {
      const match = milestone.typeMatch.some((tm) => {
        const norm = tm.trim().toLowerCase();
        return rawType === norm || rawType.includes(norm);
      });
      if (match) {
        return milestone.id;
      }
    }
  }

  // 3. Fallback phân loại dựa theo tiêu đề (exam.title)
  if (rawTitle) {
    if (
      rawTitle.includes('giữa kì 1') ||
      rawTitle.includes('giữa kỳ 1') ||
      rawTitle.includes('giữa kì i') ||
      rawTitle.includes('giữa kỳ i') ||
      rawTitle.includes('gk1') ||
      rawTitle.includes('midterm 1') ||
      rawTitle.includes('midterm_1')
    ) {
      return 'midterm_1';
    }

    if (
      rawTitle.includes('cuối kì 1') ||
      rawTitle.includes('cuối kỳ 1') ||
      rawTitle.includes('cuối kì i') ||
      rawTitle.includes('cuối kỳ i') ||
      rawTitle.includes('học kì 1') ||
      rawTitle.includes('học kỳ 1') ||
      rawTitle.includes('học kì i') ||
      rawTitle.includes('học kỳ i') ||
      rawTitle.includes('ck1') ||
      rawTitle.includes('hk1') ||
      rawTitle.includes('final 1') ||
      rawTitle.includes('final_1')
    ) {
      return 'final_1';
    }

    if (
      rawTitle.includes('giữa kì 2') ||
      rawTitle.includes('giữa kỳ 2') ||
      rawTitle.includes('giữa kì ii') ||
      rawTitle.includes('giữa kỳ ii') ||
      rawTitle.includes('gk2') ||
      rawTitle.includes('midterm 2') ||
      rawTitle.includes('midterm_2')
    ) {
      return 'midterm_2';
    }

    if (
      rawTitle.includes('cuối kì 2') ||
      rawTitle.includes('cuối kỳ 2') ||
      rawTitle.includes('cuối kì ii') ||
      rawTitle.includes('cuối kỳ ii') ||
      rawTitle.includes('học kì 2') ||
      rawTitle.includes('học kỳ 2') ||
      rawTitle.includes('học kì ii') ||
      rawTitle.includes('học kỳ ii') ||
      rawTitle.includes('ck2') ||
      rawTitle.includes('hk2') ||
      rawTitle.includes('final 2') ||
      rawTitle.includes('final_2')
    ) {
      return 'final_2';
    }

    if (
      rawTitle.includes('chuyên đề') ||
      rawTitle.includes('ôn tập') ||
      rawTitle.includes('hsg') ||
      rawTitle.includes('học sinh giỏi') ||
      rawTitle.includes('specialized')
    ) {
      return 'topics';
    }
  }

  // 4. Mặc định là 'topics' (Chuyên đề & Ôn tập) cho các đề không nằm trong 4 kì chính
  return 'topics';
}

/**
 * Gom nhóm danh sách đề thi theo 5 chặng học.
 */
export function groupExamsByMilestone<T = any>(exams: T[]): Record<ExamMilestone, T[]> {
  const grouped: Record<ExamMilestone, T[]> = {
    midterm_1: [],
    final_1: [],
    midterm_2: [],
    final_2: [],
    topics: [],
  };

  if (!Array.isArray(exams) || exams.length === 0) {
    return grouped;
  }

  for (const exam of exams) {
    const milestone = getMilestoneForExam(exam);
    grouped[milestone].push(exam);
  }

  return grouped;
}

/**
 * Tính toán chặng mục tiêu hiện tại của học sinh dựa trên các đề thi đã nộp thành công.
 * Quy tắc cuốn chiếu:
 * - midterm_1: mặc định khi chưa hoàn thành đề nào.
 * - final_1: khi đã hoàn thành ít nhất 1 đề Giữa kì 1.
 * - midterm_2: khi đã hoàn thành ít nhất 1 đề Cuối kì 1.
 * - final_2: khi đã hoàn thành ít nhất 1 đề Giữa kì 2 hoặc Cuối kì 2.
 */
export function determineCurrentMilestone(submissions: any[], exams: any[]): ExamMilestone {
  if (!Array.isArray(submissions) || submissions.length === 0) {
    return 'midterm_1';
  }

  const examList = Array.isArray(exams) ? exams : [];
  const examMap = new Map<string, any>();
  for (const exam of examList) {
    if (exam?.id !== undefined) {
      examMap.set(String(exam.id), exam);
    }
    if (exam?._id !== undefined) {
      examMap.set(String(exam._id), exam);
    }
  }

  const completedMilestones = new Set<ExamMilestone>();

  for (const sub of submissions) {
    if (!sub) continue;
    // Bỏ qua các bài nộp đang làm dở (in_progress)
    if (sub.status === 'in_progress') continue;

    const examId = sub.examId || sub.exam_id || sub.exam?.id;
    const matchedExam = (examId !== undefined ? examMap.get(String(examId)) : null) || sub.exam;

    if (matchedExam) {
      const milestone = getMilestoneForExam(matchedExam);
      completedMilestones.add(milestone);
    }
  }

  if (completedMilestones.has('midterm_2') || completedMilestones.has('final_2')) {
    return 'final_2';
  }
  if (completedMilestones.has('final_1')) {
    return 'midterm_2';
  }
  if (completedMilestones.has('midterm_1')) {
    return 'final_1';
  }

  return 'midterm_1';
}

/**
 * Lấy thông tin chi tiết cấu hình chặng học theo ID.
 */
export function getMilestoneInfo(id: ExamMilestone): MilestoneInfo | undefined {
  return MILESTONES_CONFIG.find((m) => m.id === id);
}

/**
 * Kiểm tra xem một chặng đã được vượt qua (passed) so với chặng hiện tại hay chưa.
 */
export function isMilestonePassed(target: ExamMilestone, current: ExamMilestone): boolean {
  const targetInfo = getMilestoneInfo(target);
  const currentInfo = getMilestoneInfo(current);
  if (!targetInfo || !currentInfo) return false;
  if (target === 'topics' || current === 'topics') return false;
  return targetInfo.order < currentInfo.order;
}
