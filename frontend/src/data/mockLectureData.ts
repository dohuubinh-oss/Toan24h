import { Lecture, PaginatedLectures } from '../types/lecture';

// Create a large mock dataset to simulate pagination
const generateMockLectures = (): Record<string, Lecture[]> => {
  const data: Record<string, Lecture[]> = {};
  
  // Lớp 5, 7, 8, 9, etc.
  const grades = ['5', '7', '8', '9'];
  
  grades.forEach(grade => {
    const lectures: Lecture[] = [];
    const totalLectures = 25; // 25 bài giảng mỗi lớp
    
    for (let i = 1; i <= totalLectures; i++) {
      const chapterNum = Math.ceil(i / 5);
      let status: 'not_started' | 'in_progress' | 'completed' = 'not_started';
      
      // Randomize some statuses for realism
      if (i <= 3) status = 'completed';
      else if (i === 4) status = 'in_progress';

      let thumbnailUrl: string | undefined;
      if (grade === '7' && i === 25) {
        thumbnailUrl = '/Kiến thức toán lớp 7 bài 25.jpg';
      }

      lectures.push({
        id: `L${grade}-${i.toString().padStart(2, '0')}`,
        title: `Bài giảng số ${i} - Toán lớp ${grade}`,
        chapter: `Chương ${chapterNum}: Nội dung học chương ${chapterNum}`,
        status,
        practiceCount: Math.floor(Math.random() * 5) + 1,
        thumbnailUrl,
      });
    }
    data[grade] = lectures;
  });

  return data;
};

const ALL_MOCK_LECTURES = generateMockLectures();

export const fetchLecturesByGrade = async (grade: string, page: number = 1, limit: number = 6): Promise<PaginatedLectures> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const gradeData = ALL_MOCK_LECTURES[grade] || [];
  
  const totalItems = gradeData.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const safePage = Math.max(1, Math.min(page, totalPages));
  
  const startIndex = (safePage - 1) * limit;
  const endIndex = Math.min(startIndex + limit, totalItems);
  
  const paginatedData = gradeData.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    currentPage: safePage,
    totalPages,
    totalItems,
    startIndex: startIndex + 1,
    endIndex,
  };
};
