import { describe, it, expect } from 'vitest';
import { calculateExamDifficulty, validateExamConfig, sortExamQuestions } from './exam-utils';
import { Question } from '../types/question';

describe('exam-utils', () => {
  describe('calculateExamDifficulty', () => {
    it('should calculate difficulty score correctly based on question levels', () => {
      const mockQuestions: Partial<Question>[] = [
        { difficulty_level: 'Nhận biết' }, // 1
        { difficulty_level: 'Thông hiểu' }, // 2
        { difficulty_level: 'Vận dụng' }, // 3
        { difficulty_level: 'Vận dụng cao' }, // 4
      ];
      
      const { diffScore, matrix } = calculateExamDifficulty(mockQuestions as Question[]);
      
      // Avg = (1 + 2 + 3 + 4) / 4 = 2.5
      // diffScore = ((2.5 - 1) / 3) * 10 = (1.5 / 3) * 10 = 5
      expect(diffScore).toBe(5);
      
      // Since topic is undefined, it defaults to 'Chưa phân loại'
      expect(matrix['Chưa phân loại'].NB).toBe(1);
      expect(matrix['Chưa phân loại'].TH).toBe(1);
      expect(matrix['Chưa phân loại'].VD).toBe(1);
      expect(matrix['Chưa phân loại'].VDC).toBe(1);
    });

    it('should handle empty questions array gracefully', () => {
      const { diffScore, matrix } = calculateExamDifficulty([]);
      expect(diffScore).toBe(0); // If 0 questions, we could default to 0
      expect(Object.keys(matrix).length).toBe(0);
    });
  });

  describe('validateExamConfig', () => {
    it('should return empty object if all config fields are valid', () => {
      const errors = validateExamConfig({
        title: 'Đề thi HK1',
        examCode: '101',
        grade: '12',
        duration: 90
      });
      expect(Object.keys(errors).length).toBe(0);
    });

    it('should return error for missing title', () => {
      const errors = validateExamConfig({
        title: '',
        examCode: '101',
        grade: '12',
        duration: 90
      });
      expect(errors.title).toBe('Vui lòng nhập tên đề thi');
    });

    it('should return error for missing or zero duration', () => {
      const errors = validateExamConfig({
        title: 'Test',
        examCode: '101',
        grade: '12',
        duration: 0
      });
      expect(errors.duration).toBe('Thời gian phải lớn hơn 0');
    });
    
    it('should return multiple errors if multiple fields are missing', () => {
      const errors = validateExamConfig({
        title: '',
        examCode: '',
        grade: '',
        duration: 0
      });
      expect(errors.title).toBeDefined();
      expect(errors.examCode).toBeDefined();
      expect(errors.grade).toBeDefined();
      expect(errors.duration).toBeDefined();
    });
  });

  describe('sortExamQuestions', () => {
    it('sorts multiple choice questions first and essay questions last', () => {
      const questions: Partial<Question>[] = [
        { id: '1', type: 'Tự luận', difficulty_level: 'Nhận biết' },
        { id: '2', type: 'Trắc nghiệm', difficulty_level: 'Thông hiểu' },
        { id: '3', type: 'Tự luận', difficulty_level: 'Vận dụng' },
        { id: '4', type: 'Trắc nghiệm', difficulty_level: 'Nhận biết' },
      ];

      const sorted = (sortExamQuestions as any)(questions as Question[]);
      expect(sorted.map((q: any) => q.id)).toEqual(['4', '2', '1', '3']);
    });

    it('sorts group questions as essay questions at the bottom, ordered by difficulty', () => {
      const questions: Partial<Question>[] = [
        { id: 'g1', type_question: 'group', difficulty_level: 'Vận dụng' },
        { id: 'mc1', type_question: 'single', type: 'Trắc nghiệm', difficulty_level: 'Vận dụng cao' },
        { id: 'mc2', type_question: 'single', type: 'Trắc nghiệm', difficulty_level: 'Nhận biết' },
        { id: 'es1', type_question: 'single', type: 'Tự luận', difficulty_level: 'Nhận biết' },
      ];

      const sorted = (sortExamQuestions as any)(questions as Question[]);
      expect(sorted.map((q: any) => q.id)).toEqual(['mc2', 'mc1', 'es1', 'g1']);
    });

    it('sorts questions with the same difficulty level by difficulty_point ascending', () => {
      const questions: Partial<Question>[] = [
        { id: 'mc2', type: 'Trắc nghiệm', difficulty_level: 'Thông hiểu', difficulty_point: 6.0 },
        { id: 'mc1', type: 'Trắc nghiệm', difficulty_level: 'Thông hiểu', difficulty_point: 4.5 },
      ];

      const sorted = (sortExamQuestions as any)(questions as Question[]);
      expect(sorted.map((q: any) => q.id)).toEqual(['mc1', 'mc2']);
    });

    it('returns empty array when given empty or null questions', () => {
      expect((sortExamQuestions as any)([])).toEqual([]);
      expect((sortExamQuestions as any)(null)).toEqual([]);
    });
  });
});
