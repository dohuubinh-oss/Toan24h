export interface Question {
  type_question: 'group' | 'single';
  content: string;
  type: 'Trắc nghiệm' | 'Tự luận';
  grade: number | string | null;
  topic: string;
  difficulty_level: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao' | '';
  difficulty_point: number | null;
  point: number | null;
  tags: string[];
  options: string[];
  correct_answer: string;
  solution_guide: string;
  hint: string;
  quick_solve_tips: string;
  general_method: string;
  mistakes: string;
  image_question: string | null;
  image_solution: string | null;
}

export interface QuestionBlock {
  shared_content: string;
  image_shared: string | null;
  questions: Question[];
}
