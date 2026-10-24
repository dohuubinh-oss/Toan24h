export interface Question {
  id?: string;
  gg_drive?: string;
  book_name?: string;
  cate?: 'exam' | 'practice';
  type_question: 'group' | 'single';
  shared_content?: string | null;
  diagram_svg?: string | null;
  content: string;
  type: 'Trắc nghiệm' | 'Tự luận';
  grade: number | string | null;
  topic: string;
  difficulty_level: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao' | '';
  difficulty_point: number | null;
  point: number | null;
  tags: string[];
  options: string[];
  correct_answer?: string;
  solution_guide?: any;
  hint?: string;
  mistakes?: string;
  short_answer?: string;
  shortAnswer?: string;
  quick_solve_tips?: string;
  quickSolveTips?: string;
  general_method?: string;
  subQuestions?: Question[];
}

export interface QuestionBlock {
  shared_content: string | null;
  diagram_svg?: string | null;
  type_question?: 'group' | 'single';
  is_group?: boolean;
  point?: number | null;
  questions: Question[];
}

export interface SolutionStep {
  step: number;
  title: string;
  content: string;
  formula?: string | null;
  point?: number | null;
}

export interface StructuredSolutionGuide {
  problem?: string;
  steps: SolutionStep[];
  conclusion?: string;
  tips?: string;
}
