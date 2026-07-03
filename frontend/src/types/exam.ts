import { Question } from "./question";

export interface Exam {
  id?: string;
  title: string;
  examCode: string;
  grade: string;
  duration: number;
  type?: 'exam' | 'practice';
  questions: Question[];
}
