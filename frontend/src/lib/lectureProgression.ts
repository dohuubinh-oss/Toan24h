import { Lecture, LectureStatus } from '@/types/lecture';

export interface ExamItem {
  id: string;
  lectureId?: string;
  title?: string;
  type?: string;
  cate?: string;
  [key: string]: any;
}

export interface ExamResultItem {
  examId: string;
  totalScore: number;
  status: string;
  createdAt?: string;
  [key: string]: any;
}

/**
 * Kiểm tra xem một đề thi / bài luyện tập có phải là đề Học sinh giỏi hoặc Chuyên hay không.
 * Các đề này không tính vào điều kiện hoàn thành bài giảng bắt buộc.
 */
export function isHsgExam(exam: ExamItem): boolean {
  if (!exam) return false;

  const type = (exam.type || '').toLowerCase();
  if (type === 'hsg' || type === 'specialized') {
    return true;
  }

  const title = (exam.title || '').toLowerCase();
  const hsgKeywords = ['hsg', 'học sinh giỏi', 'chuyên'];
  return hsgKeywords.some((keyword) => title.includes(keyword));
}

/**
 * Tính toán tiến độ học tập có điều kiện (Mastery Progression) cho danh sách bài giảng.
 *
 * Quy tắc hoàn thành bài giảng:
 * 1. Đạt Điểm trung bình tất cả bài tập thường >= 7.0.
 * 2. Tất cả các bài tập thường đều phải đạt điểm qua >= 6.0.
 * (Các đề thi có tag Học sinh giỏi / Chuyên được miễn trừ, không tính vào điều kiện hoàn thành).
 *
 * Quy tắc mở khóa (Unlock):
 * - Bài giảng đầu tiên luôn được mở khóa.
 * - Bài tiếp theo được mở khóa khi bài trước đó đã Hoàn thành.
 * - Các bài giảng trước đó luôn mở khóa để ôn tập.
 */
export function calculateLectureProgression(
  lectures: Lecture[],
  examsData: ExamItem[] = [],
  resultsData: ExamResultItem[] = []
): Lecture[] {
  if (!Array.isArray(lectures) || lectures.length === 0) {
    return [];
  }

  // Bước 1: Tính toán trạng thái học tập (isCompleted, averageScore, status) cho từng bài
  const evaluatedLectures = lectures.map((lecture) => {
    const lectureExams = (examsData || []).filter(
      (exam) => exam.lectureId === lecture.id
    );
    const regularExams = lectureExams.filter((exam) => !isHsgExam(exam));
    const practiceCount = lectureExams.length;
    const regularPracticeCount = regularExams.length;

    // Đếm số bài đạt tốt (> 6.5) cho badge hiển thị
    let completedWellCount = 0;
    lectureExams.forEach((exam) => {
      const examResults = resultsData.filter(
        (r) => r.examId === exam.id && r.status === 'graded'
      );
      if (examResults.length > 0) {
        const maxScore = Math.max(...examResults.map((r) => Number(r.totalScore) || 0));
        if (maxScore > 6.5) {
          completedWellCount++;
        }
      }
    });

    // Trường hợp 1: Bài giảng không có bài tập thường nào (thuần lý thuyết)
    if (regularPracticeCount === 0) {
      return {
        ...lecture,
        practiceCount,
        regularPracticeCount: 0,
        completedWellCount,
        averageScore: 10,
        isCompleted: true,
        status: 'COMPLETED' as LectureStatus,
        isLocked: false,
      };
    }

    // Trường hợp 2: Có bài tập thường -> Xét điểm từng bài
    const regularExamScores: number[] = [];
    let allExamsAttempted = true;
    let allExamsPassed = true;

    regularExams.forEach((exam) => {
      const examResults = resultsData.filter(
        (r) => r.examId === exam.id && r.status === 'graded'
      );
      if (examResults.length === 0) {
        allExamsAttempted = false;
        allExamsPassed = false;
      } else {
        const maxScore = Math.max(...examResults.map((r) => Number(r.totalScore) || 0));
        regularExamScores.push(maxScore);
        if (maxScore < 6.0) {
          allExamsPassed = false;
        }
      }
    });

    const hasAnyAttempt = regularExamScores.length > 0;
    const averageScore =
      regularExamScores.length > 0
        ? Math.round(
            (regularExamScores.reduce((acc, score) => acc + score, 0) /
              regularPracticeCount) *
              10
          ) / 10
        : 0;

    const isCompleted =
      allExamsAttempted && allExamsPassed && averageScore >= 7.0;

    let status: LectureStatus = 'NOT_STARTED';
    if (isCompleted) {
      status = 'COMPLETED';
    } else if (hasAnyAttempt) {
      status = 'PENDING';
    }

    return {
      ...lecture,
      practiceCount,
      regularPracticeCount,
      completedWellCount,
      averageScore,
      isCompleted,
      status,
      isLocked: false, // Sẽ được gán ở bước 2
    };
  });

  // Bước 2: Thiết lập quy tắc khóa/mở khóa liên hoàn (Chaining Unlock)
  const unlockedIndices = new Set<number>();

  // 1. Bài giảng đầu tiên luôn mở khóa
  if (evaluatedLectures.length > 0) {
    unlockedIndices.add(0);
  }

  // 2. Khi bài i hoàn thành sẽ tự động mở khóa bài i+1 và bài i-1 (và các bài đã hoàn thành luôn mở để ôn tập)
  evaluatedLectures.forEach((current, index) => {
    if (current.isCompleted) {
      unlockedIndices.add(index); // Bài đã xong luôn mở

      // Mở bài sau (i + 1)
      if (index + 1 < evaluatedLectures.length) {
        unlockedIndices.add(index + 1);
      }

      // Mở bài trước (i - 1) nếu bài đó chưa hoàn thành
      if (index - 1 >= 0) {
        unlockedIndices.add(index - 1);
      }
    }

    // Nếu bài đang làm dở
    if (current.status === 'PENDING') {
      unlockedIndices.add(index);
    }
  });

  return evaluatedLectures.map((current, index) => {
    const isUnlocked = unlockedIndices.has(index);
    if (isUnlocked) {
      return {
        ...current,
        isLocked: false,
      };
    }

    const prevLecture = evaluatedLectures[index - 1];
    return {
      ...current,
      isLocked: true,
      lockReason: prevLecture
        ? `Cần hoàn thành bài "${prevLecture.title}" (ĐTB ≥ 7.0 & các bài ≥ 6.0) để mở khóa bài học này.`
        : 'Bài học này chưa được mở khóa.',
    };
  });
}
