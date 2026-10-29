import { describe, it, expect } from 'vitest';
import { isHsgExam, calculateLectureProgression } from './lectureProgression';
import { Lecture } from '@/types/lecture';

describe('isHsgExam', () => {
  it('identifies HSG by type', () => {
    expect(isHsgExam({ id: '1', title: 'Đề số 1', type: 'hsg' })).toBe(true);
    expect(isHsgExam({ id: '2', title: 'Đề số 2', type: 'specialized' })).toBe(true);
  });

  it('identifies HSG by title keywords', () => {
    expect(isHsgExam({ id: '3', title: 'Đề thi Học sinh giỏi Lớp 8', type: 'midterm' })).toBe(true);
    expect(isHsgExam({ id: '4', title: 'Đề thi HSG cấp trường', type: 'final' })).toBe(true);
    expect(isHsgExam({ id: '5', title: 'Đề thi chuyên Toán vòng 2', type: 'practice' })).toBe(true);
  });

  it('returns false for regular exams', () => {
    expect(isHsgExam({ id: '6', title: 'Bài tập cơ bản phương trình bậc nhất', type: 'practice' })).toBe(false);
    expect(isHsgExam({ id: '7', title: 'Đề kiểm tra 15 phút Đại số', type: 'midterm' })).toBe(false);
  });
});

describe('calculateLectureProgression', () => {
  const sampleLectures: Lecture[] = [
    {
      id: 'lec-1',
      title: 'Bài 1: Khái niệm phương trình bậc nhất một ẩn',
      chapter: 'Đại số',
      status: 'NOT_STARTED',
      practiceCount: 2,
    },
    {
      id: 'lec-2',
      title: 'Bài 2: Phương trình đưa về dạng ax + b = 0',
      chapter: 'Đại số',
      status: 'NOT_STARTED',
      practiceCount: 2,
    },
    {
      id: 'lec-3',
      title: 'Bài 3: Phương trình tích',
      chapter: 'Đại số',
      status: 'NOT_STARTED',
      practiceCount: 1,
    },
  ];

  const examsData = [
    // Bài 1 có 2 bài tập thường và 1 bài HSG
    { id: 'exam-1a', lectureId: 'lec-1', title: 'Luyện tập cơ bản 1', type: 'practice' },
    { id: 'exam-1b', lectureId: 'lec-1', title: 'Luyện tập cơ bản 2', type: 'practice' },
    { id: 'exam-1-hsg', lectureId: 'lec-1', title: 'Đề thi HSG mở rộng', type: 'hsg' },

    // Bài 2 có 2 bài tập thường
    { id: 'exam-2a', lectureId: 'lec-2', title: 'Luyện tập phương trình 2a', type: 'practice' },
    { id: 'exam-2b', lectureId: 'lec-2', title: 'Luyện tập phương trình 2b', type: 'practice' },

    // Bài 3 có 1 bài tập thường
    { id: 'exam-3a', lectureId: 'lec-3', title: 'Luyện tập phương trình tích', type: 'practice' },
  ];

  it('first lecture is unlocked by default, subsequent lectures are locked initially', () => {
    const resultsData: any[] = [];
    const progression = calculateLectureProgression(sampleLectures, examsData, resultsData);

    expect(progression[0].isLocked).toBe(false);
    expect(progression[0].status).toBe('NOT_STARTED');

    expect(progression[1].isLocked).toBe(true);
    expect(progression[1].lockReason).toContain('Bài 1: Khái niệm phương trình bậc nhất một ẩn');

    expect(progression[2].isLocked).toBe(true);
  });

  it('does not complete lecture if average score < 7.0 even if all exams >= 6.0', () => {
    const resultsData = [
      { examId: 'exam-1a', totalScore: 6.5, status: 'graded', createdAt: '2026-01-01' },
      { examId: 'exam-1b', totalScore: 6.5, status: 'graded', createdAt: '2026-01-02' },
      // ĐTB = 6.5 < 7.0 => Chưa hoàn thành
    ];

    const progression = calculateLectureProgression(sampleLectures, examsData, resultsData);

    expect(progression[0].status).toBe('PENDING');
    expect(progression[0].isCompleted).toBe(false);
    expect(progression[0].averageScore).toBe(6.5);
    // Bài 2 vẫn phải bị khóa
    expect(progression[1].isLocked).toBe(true);
  });

  it('does not complete lecture if an exam is < 6.0 even if average score >= 7.0', () => {
    const resultsData = [
      { examId: 'exam-1a', totalScore: 9.5, status: 'graded', createdAt: '2026-01-01' },
      { examId: 'exam-1b', totalScore: 5.5, status: 'graded', createdAt: '2026-01-02' },
      // ĐTB = 7.5 >= 7.0, nhưng exam-1b = 5.5 < 6.0 => Chưa hoàn thành
    ];

    const progression = calculateLectureProgression(sampleLectures, examsData, resultsData);

    expect(progression[0].status).toBe('PENDING');
    expect(progression[0].isCompleted).toBe(false);
    expect(progression[0].averageScore).toBe(7.5);
    // Bài 2 vẫn phải bị khóa
    expect(progression[1].isLocked).toBe(true);
  });

  it('completes lecture when all regular exams >= 6.0 and average >= 7.0, ignoring HSG exam', () => {
    const resultsData = [
      { examId: 'exam-1a', totalScore: 7.0, status: 'graded', createdAt: '2026-01-01' },
      { examId: 'exam-1b', totalScore: 8.0, status: 'graded', createdAt: '2026-01-02' },
      // Bài HSG bị điểm thấp (3.0) hoặc chưa làm nhưng KHÔNG ảnh hưởng hoàn thành
      { examId: 'exam-1-hsg', totalScore: 3.0, status: 'graded', createdAt: '2026-01-03' },
    ];

    const progression = calculateLectureProgression(sampleLectures, examsData, resultsData);

    expect(progression[0].status).toBe('COMPLETED');
    expect(progression[0].isCompleted).toBe(true);
    expect(progression[0].averageScore).toBe(7.5);

    // Bài 2 được tự động mở khóa vì Bài 1 đã hoàn thành!
    expect(progression[1].isLocked).toBe(false);
    // Bài 3 vẫn bị khóa vì Bài 2 chưa hoàn thành
    expect(progression[2].isLocked).toBe(true);
  });

  it('takes highest score if student took the exam multiple times', () => {
    const resultsData = [
      // Lần 1 được 5.0, Lần 2 cải thiện lên 8.0
      { examId: 'exam-1a', totalScore: 5.0, status: 'graded', createdAt: '2026-01-01' },
      { examId: 'exam-1a', totalScore: 8.0, status: 'graded', createdAt: '2026-01-02' },
      { examId: 'exam-1b', totalScore: 7.0, status: 'graded', createdAt: '2026-01-02' },
    ];

    const progression = calculateLectureProgression(sampleLectures, examsData, resultsData);

    // Điểm cao nhất của 1a là 8.0, 1b là 7.0 => ĐTB = 7.5 >= 7.0 và cả 2 >= 6.0 => Hoàn thành
    expect(progression[0].status).toBe('COMPLETED');
    expect(progression[0].isCompleted).toBe(true);
    expect(progression[0].averageScore).toBe(7.5);
    expect(progression[1].isLocked).toBe(false);
  });

  it('marks lecture without regular exams as completed and unlocks next', () => {
    const lectureWithNoExams: Lecture[] = [
      {
        id: 'lec-theory-only',
        title: 'Bài Giới thiệu Lý thuyết',
        chapter: 'Khởi động',
        status: 'NOT_STARTED',
        practiceCount: 0,
      },
      {
        id: 'lec-next',
        title: 'Bài Kế tiếp',
        chapter: 'Khởi động',
        status: 'NOT_STARTED',
        practiceCount: 1,
      },
    ];

    const progression = calculateLectureProgression(lectureWithNoExams, [], []);
    expect(progression[0].isCompleted).toBe(true);
    expect(progression[0].status).toBe('COMPLETED');
    expect(progression[1].isLocked).toBe(false);
  });

  it('when lecture i is completed, it unlocks lecture i+1 and lecture i-1 if not completed', () => {
    // Giả sử có 4 bài: Bài 1 (chưa xong), Bài 2 (đã xong), Bài 3 (chưa xong), Bài 4 (chưa xong)
    const fourLectures: Lecture[] = [
      { id: 'l1', title: 'Bài 1', chapter: 'Đại số', status: 'NOT_STARTED', practiceCount: 1 },
      { id: 'l2', title: 'Bài 2', chapter: 'Đại số', status: 'NOT_STARTED', practiceCount: 1 },
      { id: 'l3', title: 'Bài 3', chapter: 'Đại số', status: 'NOT_STARTED', practiceCount: 1 },
      { id: 'l4', title: 'Bài 4', chapter: 'Đại số', status: 'NOT_STARTED', practiceCount: 1 },
    ];
    const fourExams = [
      { id: 'e1', lectureId: 'l1', title: 'Đề 1', type: 'practice' },
      { id: 'e2', lectureId: 'l2', title: 'Đề 2', type: 'practice' },
      { id: 'e3', lectureId: 'l3', title: 'Đề 3', type: 'practice' },
      { id: 'e4', lectureId: 'l4', title: 'Đề 4', type: 'practice' },
    ];
    // Chỉ có kết quả làm tốt bài 2
    const results = [
      { examId: 'e2', totalScore: 8.5, status: 'graded', createdAt: '2026-01-01' },
    ];

    const progression = calculateLectureProgression(fourLectures, fourExams, results);

    // Bài 1 (index 0): luôn mở vì là bài đầu
    expect(progression[0].isLocked).toBe(false);
    // Bài 2 (index 1): đã hoàn thành -> luôn mở
    expect(progression[1].isCompleted).toBe(true);
    expect(progression[1].isLocked).toBe(false);
    // Bài 3 (index 2 = i+1): được mở khóa bởi Bài 2
    expect(progression[2].isLocked).toBe(false);
    // Bài 4 (index 3 = i+2): vẫn bị khóa vì Bài 3 chưa xong
    expect(progression[3].isLocked).toBe(true);
  });
});
