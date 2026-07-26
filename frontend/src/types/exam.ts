import { Question } from "./question";

export interface Exam {
  id?: string;
  title: string;
  examCode: string;
  grade: string;
  duration: number;
  cate?: 'exam' | 'practice';
  type?: string; // 'midterm' | 'final' | 'specialized' | etc.
  lectureId?: string;
  questions: Question[];
}
