export type LectureStatus = 'NOT_STARTED' | 'PENDING' | 'COMPLETED';

export interface Lecture {
  id: string;
  title: string;
  chapter: string;
  status: LectureStatus;
  practiceCount: number;
  thumbnailUrl?: string;
  isPracticeCard?: boolean;
  practiceIds?: string;
  gg_link?: string;
  isLocked?: boolean;
  isCompleted?: boolean;
  lockReason?: string;
  averageScore?: number;
  regularPracticeCount?: number;
  completedWellCount?: number;
}

export interface PaginatedLectures {
  data: Lecture[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
}
