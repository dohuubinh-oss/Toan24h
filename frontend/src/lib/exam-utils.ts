import { Question } from '../types/question';
import { Exam } from '../types/exam';

export interface DifficultyMatrix {
  [topic: string]: { NB: number; TH: number; VD: number; VDC: number };
}

export function calculateExamDifficulty(questions: Question[]) {
  if (!questions || questions.length === 0) {
    return { diffScore: 0, matrix: {}, diffLabel: 'Dễ' };
  }

  let totalQuestions = 0;
  
  const matrix = questions.reduce((acc, q) => {
    if (q.type_question === 'group' && q.subQuestions) {
      q.subQuestions.forEach(sub => {
        totalQuestions++;
        const topic = sub.topic || q.topic || 'Chưa phân loại';
        if (!acc[topic]) acc[topic] = { NB: 0, TH: 0, VD: 0, VDC: 0 };
        
        if (sub.difficulty_level === 'Nhận biết') acc[topic].NB++;
        else if (sub.difficulty_level === 'Thông hiểu') acc[topic].TH++;
        else if (sub.difficulty_level === 'Vận dụng') acc[topic].VD++;
        else if (sub.difficulty_level === 'Vận dụng cao') acc[topic].VDC++;
      });
    } else {
      totalQuestions++;
      const topic = q.topic || 'Chưa phân loại';
      if (!acc[topic]) acc[topic] = { NB: 0, TH: 0, VD: 0, VDC: 0 };
      
      if (q.difficulty_level === 'Nhận biết') acc[topic].NB++;
      else if (q.difficulty_level === 'Thông hiểu') acc[topic].TH++;
      else if (q.difficulty_level === 'Vận dụng') acc[topic].VD++;
      else if (q.difficulty_level === 'Vận dụng cao') acc[topic].VDC++;
    }
    return acc;
  }, {} as DifficultyMatrix);

  const topics = Object.keys(matrix);
  const totalNB = topics.reduce((sum, t) => sum + matrix[t].NB, 0);
  const totalTH = topics.reduce((sum, t) => sum + matrix[t].TH, 0);
  const totalVD = topics.reduce((sum, t) => sum + matrix[t].VD, 0);
  const totalVDC = topics.reduce((sum, t) => sum + matrix[t].VDC, 0);

  const avgDifficulty = totalQuestions > 0 ? ((totalNB * 1) + (totalTH * 2) + (totalVD * 3) + (totalVDC * 4)) / totalQuestions : 0;
  
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

  if (config.cate !== 'practice') {
    if (!config.duration || config.duration <= 0) {
      errors.duration = 'Thời gian phải lớn hơn 0';
    }
  }

  return errors;
}

export const DIFFICULTY_WEIGHT: Record<string, number> = {
  'Nhận biết': 1,
  'Thông hiểu': 2,
  'Vận dụng': 3,
  'Vận dụng cao': 4,
};

export function getQuestionDifficultyWeight(q: any): number {
  const level = q?.difficulty_level || q?.difficultyLevel || '';
  if (level && DIFFICULTY_WEIGHT[level]) {
    return DIFFICULTY_WEIGHT[level];
  }
  if ((q?.type_question === 'group' || q?.typeQuestion === 'group') && q?.subQuestions && q?.subQuestions.length > 0) {
    const subLevel = q.subQuestions[0].difficulty_level || q.subQuestions[0].difficultyLevel || '';
    if (subLevel && DIFFICULTY_WEIGHT[subLevel]) {
      return DIFFICULTY_WEIGHT[subLevel];
    }
  }
  return 1;
}

export function isEssayOrGroupQuestion(q: any): boolean {
  return q?.type === 'Tự luận' || q?.type_question === 'group' || q?.typeQuestion === 'group';
}

/**
 * Chuẩn hóa thứ tự câu hỏi trong đề thi:
 * 1. Câu trắc nghiệm ở trên (Phần 1), Câu tự luận & Câu hỏi chùm ở dưới (Phần 2)
 * 2. Trong từng phần: Câu dễ ở trên, Câu khó ở dưới (Nhận biết -> Thông hiểu -> Vận dụng -> Vận dụng cao)
 */
export function sortExamQuestions<T = any>(questions: T[]): T[] {
  if (!questions || !Array.isArray(questions) || questions.length === 0) return [];

  const sortByDifficulty = (a: any, b: any) => {
    const wA = getQuestionDifficultyWeight(a);
    const wB = getQuestionDifficultyWeight(b);
    if (wA !== wB) return wA - wB;

    const pointA = a?.difficulty_point ?? a?.difficultyPoint ?? 0;
    const pointB = b?.difficulty_point ?? b?.difficultyPoint ?? 0;
    return pointA - pointB;
  };

  const multipleChoiceQuestions = questions
    .filter(q => !isEssayOrGroupQuestion(q))
    .sort(sortByDifficulty);

  const essayQuestions = questions
    .filter(q => isEssayOrGroupQuestion(q))
    .sort(sortByDifficulty);

  return [...multipleChoiceQuestions, ...essayQuestions];
}
