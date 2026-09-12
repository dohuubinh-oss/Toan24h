export type PracticeStatus = 'NOT_STARTED' | 'PENDING' | 'COMPLETED';

export interface Practice {
  id: string;
  title: string;
  lectureName: string;
  duration: number; // minutes
  questionCount: number;
  status: PracticeStatus;
  score?: number; // Score if completed
  grade: string;
  resultId?: string;
}

export interface PaginatedPractices {
  practices: Practice[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export interface AppealInfo {
  is_appealed: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  message: string;
  teacher_feedback: string;
}

export interface QuestionAnswer {
  type: string;
  student_answer: string;
  image_urls: string[];
  score: number;
  reasoning_score: number;
  is_correct: boolean;
  ai_explanation: string;
  ai_reasoning_remark: string;
  error_location: string;
  appeal: AppealInfo;
  student_explanation: string;
}

export interface Submission {
  id: string;
  userId?: string;
  examId: string;
  status: 'in_progress' | 'submitted' | 'graded' | 'needs_review';
  totalScore: number;
  answersJson: Record<string, QuestionAnswer>;
  overallEssayFeedback?: string;
  overallComprehensionFeedback?: string;
  deductionReason?: string;
  comprehensionLevel?: string;
  isRandomGuess?: boolean;
  studentName?: string;
  studentEmail?: string;
  startedAt: string;
  submittedAt?: string;
  createdAt: string;
}
