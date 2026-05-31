import { Question } from '../types/question';
import { Exam } from '../types/exam';

export interface DifficultyMatrix {
  [topic: string]: { NB: number; TH: number; VD: number; VDC: number };
}

export function calculateExamDifficulty(questions: Question[]) {
  if (!questions || questions.length === 0) {
    return { diffScore: 0, matrix: {}, diffLabel: 'Dễ' };
  }

  const matrix = questions.reduce((acc, q) => {
    const topic = q.topic || 'Chưa phân loại';
    if (!acc[topic]) {
      acc[topic] = { NB: 0, TH: 0, VD: 0, VDC: 0 };
    }
    if (q.difficulty_level === 'Nhận biết') acc[topic].NB++;
    else if (q.difficulty_level === 'Thông hiểu') acc[topic].TH++;
    else if (q.difficulty_level === 'Vận dụng') acc[topic].VD++;
    else if (q.difficulty_level === 'Vận dụng cao') acc[topic].VDC++;
    return acc;
  }, {} as DifficultyMatrix);

  const topics = Object.keys(matrix);
  const totalNB = topics.reduce((sum, t) => sum + matrix[t].NB, 0);
  const totalTH = topics.reduce((sum, t) => sum + matrix[t].TH, 0);
  const totalVD = topics.reduce((sum, t) => sum + matrix[t].VD, 0);
  const totalVDC = topics.reduce((sum, t) => sum + matrix[t].VDC, 0);

  const totalQuestions = questions.length;
  const avgDifficulty = ((totalNB * 1) + (totalTH * 2) + (totalVD * 3) + (totalVDC * 4)) / totalQuestions;
  
  // Map 1-4 scale to 1-10 scale
  const diffScore = ((avgDifficulty - 1) / 3) * 10;
  const diffLabel = diffScore < 4 ? 'Dễ' : diffScore < 7 ? 'Trung bình' : 'Khó';

  return { diffScore, matrix, diffLabel, totalNB, totalTH, totalVD, totalVDC };
}

export function validateExamConfig(config: Partial<Exam>): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!config.title || config.title.trim() === '') {
    errors.title = 'Vui lòng nhập tên đề thi';
  }

  if (!config.examCode || config.examCode.trim() === '') {
    errors.examCode = 'Vui lòng nhập mã đề';
  }

  if (!config.grade || config.grade.trim() === '') {
    errors.grade = 'Vui lòng chọn khối lớp';
  }

  if (!config.duration || config.duration <= 0) {
    errors.duration = 'Thời gian phải lớn hơn 0';
  }

  return errors;
}
