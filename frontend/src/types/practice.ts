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
}

export interface PaginatedPractices {
  practices: Practice[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}
