import { Practice, PaginatedPractices } from '@/types/practice';

// Helper để tạo mock data
const generateMockPractices = (grade: string): Practice[] => {
  const baseData: Practice[] = [
    {
      id: `P${grade}-01`,
      title: 'Đề luyện tập: Nhân đơn thức với đa thức',
      lectureName: 'Nhân đơn thức với đa thức',
      duration: 15,
      questionCount: 10,
      status: 'completed',
      score: 8,
      grade,
    },
    {
      id: `P${grade}-02`,
      title: 'Đề kiểm tra 15 phút: Nhân đa thức',
      lectureName: 'Nhân đa thức với đa thức',
      duration: 15,
      questionCount: 10,
      status: 'completed',
      score: 3,
      grade,
    },
    {
      id: `P${grade}-03`,
      title: 'Bài tập vận dụng: Hằng đẳng thức (Phần 1)',
      lectureName: 'Những hằng đẳng thức đáng nhớ (Phần 1)',
      duration: 30,
      questionCount: 20,
      status: 'not_started',
      grade,
    },
    {
      id: `P${grade}-04`,
      title: 'Bài tập nâng cao: Hằng đẳng thức',
      lectureName: 'Những hằng đẳng thức đáng nhớ (Phần 2)',
      duration: 45,
      questionCount: 30,
      status: 'not_started',
      grade,
    },
    {
      id: `P${grade}-05`,
      title: 'Kiểm tra 1 tiết: Tứ giác',
      lectureName: 'Tứ giác',
      duration: 45,
      questionCount: 30,
      status: 'not_started',
      grade,
    },
    {
      id: `P${grade}-06`,
      title: 'Luyện tập chung: Hình thang cân',
      lectureName: 'Hình thang - Hình thang cân',
      duration: 30,
      questionCount: 20,
      status: 'not_started',
      grade,
    },
  ];

  // Nhân bản data để có nhiều trang
  let extendedData: Practice[] = [];
  for (let i = 0; i < 3; i++) {
    extendedData = extendedData.concat(
      baseData.map((item) => ({
        ...item,
        id: `${item.id}-${i}`,
        title: `${item.title} (Bộ ${i + 1})`
      }))
    );
  }

  return extendedData;
};

// Database mock map
const practicesDB: Record<string, Practice[]> = {
  '5': generateMockPractices('5'),
  '8': generateMockPractices('8'),
  '9': generateMockPractices('9'),
};

export const fetchPracticesByGrade = async (
  grade: string,
  page: number = 1,
  limit: number = 6,
  lectureId?: string,
  practiceIds?: string[]
): Promise<PaginatedPractices> => {
  // Giả lập network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  let data = practicesDB[grade] || [];

  if (practiceIds && practiceIds.length > 0) {
    data = data.filter(item => practiceIds.includes(item.id));
  } else if (lectureId) {
    // Lọc theo lectureId nếu có (hiện tại mock bằng cách filter title/lectureName chứa ID để demo)
    const filtered = data.filter(item => item.id.includes(lectureId) || item.lectureName.includes(lectureId));
    // Fallback: nếu không khớp (do database dùng UUID còn mock dùng string tĩnh) thì trả về 2 bài đầu tiên làm mẫu
    if (filtered.length === 0) {
      data = data.slice(0, 2);
    } else {
      data = filtered;
    }
  }

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const paginatedData = data.slice(startIndex, endIndex);

  return {
    practices: paginatedData,
    totalItems,
    totalPages,
    currentPage: page,
  };
};
