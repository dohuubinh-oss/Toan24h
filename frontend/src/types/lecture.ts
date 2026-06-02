export type LectureStatus = 'not_started' | 'in_progress' | 'completed';

export interface Lecture {
  id: string;
  title: string;
  chapter: string;
  status: LectureStatus;
  practiceCount: number;
  thumbnailUrl?: string;
}

export interface PaginatedLectures {
  data: Lecture[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
}
