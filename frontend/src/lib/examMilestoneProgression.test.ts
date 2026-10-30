import { describe, it, expect } from 'vitest';
import {
  determineCurrentMilestone,
  groupExamsByMilestone,
  MILESTONES_CONFIG,
  getMilestoneForExam,
  getMilestoneInfo,
  isMilestonePassed,
  type ExamMilestone,
} from './examMilestoneProgression';

describe('examMilestoneProgression', () => {
  describe('MILESTONES_CONFIG', () => {
    it('defines 5 milestones in chronological sequence', () => {
      expect(MILESTONES_CONFIG).toHaveLength(5);
      const ids = MILESTONES_CONFIG.map((m) => m.id);
      expect(ids).toEqual(['midterm_1', 'final_1', 'midterm_2', 'final_2', 'topics']);

      MILESTONES_CONFIG.forEach((m) => {
        expect(m).toHaveProperty('id');
        expect(m).toHaveProperty('title');
        expect(m).toHaveProperty('typeMatch');
        expect(m).toHaveProperty('order');
        expect(Array.isArray(m.typeMatch)).toBe(true);
      });
    });
  });

  describe('getMilestoneForExam', () => {
    it('identifies milestone from exam.type', () => {
      expect(getMilestoneForExam({ id: '1', type: 'Giữa kì 1' })).toBe('midterm_1');
      expect(getMilestoneForExam({ id: '2', type: 'Cuối kì 1' })).toBe('final_1');
      expect(getMilestoneForExam({ id: '3', type: 'Giữa kì 2' })).toBe('midterm_2');
      expect(getMilestoneForExam({ id: '4', type: 'Cuối kì 2' })).toBe('final_2');
      expect(getMilestoneForExam({ id: '5', type: 'Chuyên Đề' })).toBe('topics');
      expect(getMilestoneForExam({ id: '6', type: 'Ôn tập' })).toBe('topics');
      expect(getMilestoneForExam({ id: '7', type: 'HSG' })).toBe('topics');
    });

    it('identifies milestone from slug / alternative forms', () => {
      expect(getMilestoneForExam({ id: '1', type: 'giua_ki_1' })).toBe('midterm_1');
      expect(getMilestoneForExam({ id: '2', type: 'cuoi_ki_1' })).toBe('final_1');
      expect(getMilestoneForExam({ id: '3', type: 'giua_ki_2' })).toBe('midterm_2');
      expect(getMilestoneForExam({ id: '4', type: 'cuoi_ki_2' })).toBe('final_2');
      expect(getMilestoneForExam({ id: '5', type: 'Giữa kỳ 1' })).toBe('midterm_1');
      expect(getMilestoneForExam({ id: '6', type: 'Cuối kỳ 2' })).toBe('final_2');
    });

    it('falls back to exam.title when exam.type is missing or empty', () => {
      expect(getMilestoneForExam({ id: '1', title: 'Đề khảo sát Giữa kì 1 Toán 8' })).toBe('midterm_1');
      expect(getMilestoneForExam({ id: '2', title: 'Đề thi học kì 1 (Cuối kì 1) năm 2024' })).toBe('final_1');
      expect(getMilestoneForExam({ id: '3', title: 'Đề thi Giữa kì 2 lớp 7' })).toBe('midterm_2');
      expect(getMilestoneForExam({ id: '4', title: 'Đề kiểm tra Cuối kì 2 Toán 9' })).toBe('final_2');
      expect(getMilestoneForExam({ id: '5', title: 'Chuyên đề Số nguyên tố' })).toBe('topics');
    });

    it('defaults to topics for unclassified exams', () => {
      expect(getMilestoneForExam({ id: '1', title: 'Bài kiểm tra 15 phút' })).toBe('topics');
      expect(getMilestoneForExam(null)).toBe('topics');
      expect(getMilestoneForExam(undefined)).toBe('topics');
    });
  });

  describe('determineCurrentMilestone', () => {
    const sampleExams = [
      { id: 'exam-gk1', title: 'Đề Giữa kì 1', type: 'Giữa kì 1' },
      { id: 'exam-ck1', title: 'Đề Cuối kì 1', type: 'Cuối kì 1' },
      { id: 'exam-gk2', title: 'Đề Giữa kì 2', type: 'Giữa kì 2' },
      { id: 'exam-ck2', title: 'Đề Cuối kì 2', type: 'Cuối kì 2' },
      { id: 'exam-topic', title: 'Chuyên đề Hình học', type: 'Chuyên Đề' },
    ];

    it('returns midterm_1 when student has no submissions', () => {
      expect(determineCurrentMilestone([], sampleExams)).toBe('midterm_1');
      expect(determineCurrentMilestone(undefined as any, sampleExams)).toBe('midterm_1');
    });

    it('returns midterm_1 when all submissions are in_progress', () => {
      const submissions = [
        { id: 'sub-1', examId: 'exam-gk1', status: 'in_progress', totalScore: 0 },
      ];
      expect(determineCurrentMilestone(submissions, sampleExams)).toBe('midterm_1');
    });

    it('advances to final_1 when student completes at least one Giữa kì 1 exam', () => {
      const submissions = [
        { id: 'sub-1', examId: 'exam-gk1', status: 'graded', totalScore: 8.5 },
      ];
      expect(determineCurrentMilestone(submissions, sampleExams)).toBe('final_1');
    });

    it('advances to midterm_2 when student completes at least one Cuối kì 1 exam', () => {
      const submissions = [
        { id: 'sub-1', examId: 'exam-gk1', status: 'graded', totalScore: 8.5 },
        { id: 'sub-2', examId: 'exam-ck1', status: 'submitted', totalScore: 9.0 },
      ];
      expect(determineCurrentMilestone(submissions, sampleExams)).toBe('midterm_2');
    });

    it('advances to final_2 when student completes at least one Giữa kì 2 exam', () => {
      const submissions = [
        { id: 'sub-1', examId: 'exam-gk1', status: 'graded', totalScore: 8.5 },
        { id: 'sub-2', examId: 'exam-ck1', status: 'graded', totalScore: 9.0 },
        { id: 'sub-3', examId: 'exam-gk2', status: 'graded', totalScore: 7.5 },
      ];
      expect(determineCurrentMilestone(submissions, sampleExams)).toBe('final_2');
    });

    it('remains at final_2 when student completes Cuối kì 2 exam', () => {
      const submissions = [
        { id: 'sub-4', examId: 'exam-ck2', status: 'graded', totalScore: 10 },
      ];
      expect(determineCurrentMilestone(submissions, sampleExams)).toBe('final_2');
    });

    it('does not advance semester milestone if only topics exams are completed', () => {
      const submissions = [
        { id: 'sub-1', examId: 'exam-topic', status: 'graded', totalScore: 10 },
      ];
      expect(determineCurrentMilestone(submissions, sampleExams)).toBe('midterm_1');
    });

    it('advances to the furthest milestone reached even if intermediate exams were skipped', () => {
      // Direct jump to final_1 exam completed -> next milestone is midterm_2
      const submissions = [
        { id: 'sub-2', examId: 'exam-ck1', status: 'graded', totalScore: 8.0 },
      ];
      expect(determineCurrentMilestone(submissions, sampleExams)).toBe('midterm_2');
    });
  });

  describe('groupExamsByMilestone', () => {
    it('groups exams into 5 milestone categories correctly', () => {
      const exams = [
        { id: '1', title: 'Đề 1', type: 'Giữa kì 1' },
        { id: '2', title: 'Đề 2', type: 'Giữa kì 1' },
        { id: '3', title: 'Đề 3', type: 'Cuối kì 1' },
        { id: '4', title: 'Đề 4', type: 'Giữa kì 2' },
        { id: '5', title: 'Đề 5', type: 'Cuối kì 2' },
        { id: '6', title: 'Đề 6', type: 'Chuyên Đề' },
        { id: '7', title: 'Đề 7', type: 'Ôn tập' },
      ];

      const grouped = groupExamsByMilestone(exams);

      expect(grouped.midterm_1).toHaveLength(2);
      expect(grouped.final_1).toHaveLength(1);
      expect(grouped.midterm_2).toHaveLength(1);
      expect(grouped.final_2).toHaveLength(1);
      expect(grouped.topics).toHaveLength(2);

      expect(grouped.midterm_1.map((e) => e.id)).toEqual(['1', '2']);
      expect(grouped.final_1.map((e) => e.id)).toEqual(['3']);
      expect(grouped.midterm_2.map((e) => e.id)).toEqual(['4']);
      expect(grouped.final_2.map((e) => e.id)).toEqual(['5']);
      expect(grouped.topics.map((e) => e.id)).toEqual(['6', '7']);
    });

    it('returns empty arrays for categories with no exams', () => {
      const grouped = groupExamsByMilestone([]);
      expect(grouped.midterm_1).toEqual([]);
      expect(grouped.final_1).toEqual([]);
      expect(grouped.midterm_2).toEqual([]);
      expect(grouped.final_2).toEqual([]);
      expect(grouped.topics).toEqual([]);
    });

    it('handles undefined or null gracefully', () => {
      const grouped = groupExamsByMilestone(undefined as any);
      expect(grouped.midterm_1).toEqual([]);
      expect(grouped.final_1).toEqual([]);
      expect(grouped.midterm_2).toEqual([]);
      expect(grouped.final_2).toEqual([]);
      expect(grouped.topics).toEqual([]);
    });
  });

  describe('getMilestoneInfo & isMilestonePassed', () => {
    it('returns milestone info by id', () => {
      const info = getMilestoneInfo('midterm_1');
      expect(info?.title).toBe('Giữa kì 1');
      expect(info?.order).toBe(1);

      expect(getMilestoneInfo('non_existent' as any)).toBeUndefined();
    });

    it('correctly determines whether a milestone has been passed', () => {
      // If current milestone is final_1 (order 2), midterm_1 (order 1) has been passed
      expect(isMilestonePassed('midterm_1', 'final_1')).toBe(true);
      expect(isMilestonePassed('final_1', 'final_1')).toBe(false);
      expect(isMilestonePassed('midterm_2', 'final_1')).toBe(false);

      // If current milestone is final_2 (order 4)
      expect(isMilestonePassed('midterm_1', 'final_2')).toBe(true);
      expect(isMilestonePassed('final_1', 'final_2')).toBe(true);
      expect(isMilestonePassed('midterm_2', 'final_2')).toBe(true);
      expect(isMilestonePassed('final_2', 'final_2')).toBe(false);

      // topics is non-linear, should never be considered 'passed'
      expect(isMilestonePassed('topics', 'final_2')).toBe(false);
      expect(isMilestonePassed('midterm_1', 'topics')).toBe(false);
    });
  });
});
