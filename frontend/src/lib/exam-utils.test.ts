import { describe, it, expect } from 'vitest';
import { calculateExamDifficulty, validateExamConfig } from './exam-utils';
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
});
