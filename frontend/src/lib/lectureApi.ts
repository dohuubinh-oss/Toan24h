import { Lecture, PaginatedLectures } from '@/types/lecture';

const isServer = typeof window === 'undefined';
const API_BASE_URL = isServer 
  ? (process.env.BACKEND_URL ? `${process.env.BACKEND_URL}${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}` : 'http://localhost:8080/api/v1')
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1');

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
  practiceIds: string; // JSON string array
  examples: string; // JSON string array of DangToanItem
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

  const mappedData: Lecture[] = result.data.map(item => {
    let coverImage: string | undefined;
    try {
      const match = item.basicConcept?.match(/<img[^>]+src="([^">]+)"/);
      if (match) {
        coverImage = match[1];
      }
    } catch(e) {}
    
    return {
      id: item.id,
      title: item.title,
      chapter: item.category, // Map category to chapter for UI
      status: 'NOT_STARTED', // TODO: Implement real progress tracking
      practiceCount: 0, // TODO: Implement real practice count
      thumbnailUrl: coverImage ? `${process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '') : 'http://localhost:8080'}${coverImage}` : undefined,
    }
  });

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
    throw new Error(`Failed to fetch lecture: ${response.statusText}`);
  }

  const result: BackendLecture = await response.json();
  return result;
}
