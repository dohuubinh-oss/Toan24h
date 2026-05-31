import { Exam } from "../types/exam";
import { Question } from "../types/question";

export const MOCK_QUESTIONS: Question[] = [
  {
    type_question: 'single',
    type: 'Trắc nghiệm',
    content: 'Tìm tất cả các giá trị thực của tham số m để hàm số y = \\frac{1}{3}x^3 - mx^2 + (m^2 - m + 1)x + 1 đạt cực đại tại x = 1.',
    grade: 12,
    topic: 'Giải tích',
    difficulty_level: 'Vận dụng',
    difficulty_point: 7,
    point: 0.2,
    tags: ['Cực trị', 'Tham số m'],
    options: [
      'm = 1',
      'm = 2',
      'm \\in \\{1; 2\\}',
      'm \\in \\emptyset'
    ],
    correct_answer: 'B',
    solution_guide: 'Ta có y\' = x^2 - 2mx + (m^2 - m + 1). Để hàm số đạt cực đại tại x = 1 thì y\'(1) = 0 và y\'\'(1) < 0. Giải hệ ra được m = 2.',
    hint: 'Tính đạo hàm bậc 1 và bậc 2',
    quick_solve_tips: '',
    general_method: '',
    mistakes: '',
    image_question: null,
    image_solution: null,
  },
  {
    type_question: 'single',
    type: 'Trắc nghiệm',
    content: 'Cho khối chóp S.ABC có đáy ABC là tam giác vuông cân tại B, AB = a. Cạnh bên SA vuông góc với mặt phẳng đáy và SA = a\\sqrt{2}. Thể tích của khối chóp đã cho bằng:',
    grade: 12,
    topic: 'Hình học không gian',
    difficulty_level: 'Thông hiểu',
    difficulty_point: 5,
    point: 0.2,
    tags: ['Thể tích', 'Khối chóp'],
    options: [
      '\\frac{a^3\\sqrt{2}}{6}',
      '\\frac{a^3\\sqrt{2}}{3}',
      '\\frac{a^3\\sqrt{2}}{2}',
      'a^3\\sqrt{2}'
    ],
    correct_answer: 'A',
    solution_guide: 'Diện tích đáy S = \\frac{1}{2}a^2. Thể tích V = \\frac{1}{3} S \\cdot h = \\frac{1}{3} \\cdot \\frac{1}{2}a^2 \\cdot a\\sqrt{2} = \\frac{a^3\\sqrt{2}}{6}.',
    hint: 'Công thức thể tích chóp là V = 1/3 S.h',
    quick_solve_tips: '',
    general_method: '',
    mistakes: '',
    image_question: null,
    image_solution: null,
  },
  {
    type_question: 'single',
    type: 'Tự luận',
    content: 'Cho hình chóp S.ABCD có đáy ABCD là hình vuông cạnh a. Cạnh bên SA vuông góc với đáy, SA = a\\sqrt{2}. Gọi M là trung điểm của BC. Tính khoảng cách từ điểm M đến mặt phẳng (SCD).',
    grade: 12,
    topic: 'Hình học không gian',
    difficulty_level: 'Vận dụng cao',
    difficulty_point: 9,
    point: 0.5,
    tags: ['Khoảng cách', 'Mặt phẳng'],
    options: [],
    correct_answer: '',
    solution_guide: 'Kẻ AH vuông góc với SD...',
    hint: 'Chuyển khoảng cách từ M về A',
    quick_solve_tips: '',
    general_method: '',
    mistakes: '',
    image_question: null,
    image_solution: null,
  }
];

export const MOCK_EXAM: Exam = {
  id: 'exam-1',
  title: 'Kiểm tra & Hoàn thiện đề thi',
  examCode: 'MATH-01',
  grade: '12',
  duration: 90,
  questions: MOCK_QUESTIONS
};
