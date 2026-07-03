import { Lecture, PaginatedLectures } from '@/types/lecture';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export interface BackendLectureExample {
  id: string;
  lectureId: string;
  problem: string;
  conclusion: string;
  problemImage: string;
  solutionImage: string;
  steps: string; // JSON string
  tips: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendLecture {
  id: string;
  title: string;
  grade: string;
  category: string;
  basicConcept: string;
  coverImage: string;
  videoUrl: string;
  practiceIds: string; // JSON string array
  examples: BackendLectureExample[];
  createdAt: string;
  updatedAt: string;
}

export interface BackendPaginatedLectures {
  data: BackendLecture[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
}

export async function getLecturesByGrade(grade: string, page: number = 1, limit: number = 9): Promise<PaginatedLectures> {
  const url = `${API_BASE_URL}/lectures/grade/${grade}?page=${page}&limit=${limit}`;
  const response = await fetch(url, {
    cache: 'no-store', // Always fetch fresh data for now
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch lectures: ${response.statusText}`);
  }

  const result: BackendPaginatedLectures = await response.json();

  // Map BackendLecture to UI Lecture type
  const mappedData: Lecture[] = result.data.map(item => ({
    id: item.id,
    title: item.title,
    chapter: item.category, // Map category to chapter for UI
    status: 'not_started', // TODO: Implement real progress tracking
    practiceCount: 0, // TODO: Implement real practice count
    thumbnailUrl: item.coverImage ? `${process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '') : 'http://localhost:8080'}${item.coverImage}` : undefined,
  }));

  return {
    ...result,
    data: mappedData,
  };
}

export async function getLectureById(id: string): Promise<BackendLecture> {
  const url = `${API_BASE_URL}/lectures/${id}`;
  const response = await fetch(url, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch lecture details: ${response.statusText}`);
  }

  const result: BackendLecture = await response.json();

  // Clean up image URLs
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '') : 'http://localhost:8080';
  if (result.coverImage) {
    result.coverImage = `${baseUrl}${result.coverImage}`;
  }

  result.examples = result.examples.map(ex => {
    if (ex.problemImage) ex.problemImage = `${baseUrl}${ex.problemImage}`;
    if (ex.solutionImage) ex.solutionImage = `${baseUrl}${ex.solutionImage}`;
    return ex;
  });

  return result;
}
