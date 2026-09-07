# Submissions Schema Refactoring Design

## Goal
Replace the current relational `exam_results` and `result_details` tables with a single `submissions` table that stores all question answers, scores, and appeal data within a JSONB column (`answers_json`).

## Rationale
- Improves database write/read performance by using a single row per exam submission instead of N+1 rows.
- Highly flexible schema that can accommodate different question types easily.
- Per-question appeals are still supported by embedding the appeal status directly inside the JSON structure of the specific question.

## Data Model Changes

### 1. Drop old tables (Migration)
- Drop or deprecate `result_details`.
- Drop or deprecate `exam_results`.
- (Optional depending on data retention needs: migrate existing data to the new table, though we might just create the new table and drop old ones if this is a fresh development environment).

### 2. Create `submissions` table
```sql
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- Student taking the exam
    exam_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress', -- in_progress, submitted, graded
    total_score DECIMAL(5,2) DEFAULT 0,
    answers_json JSONB,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Structure of `answers_json`
```json
{
  "q10": {
    "type": "essay",
    "student_answer": "Giải phương trình...",
    "image_urls": ["url1"],
    "score": 2.0,
    "ai_explanation": "Làm đúng bước 1...",
    "is_correct": true,
    "appeal": {
      "is_appealed": true,
      "status": "PENDING",
      "message": "Em nghĩ phần này em làm đúng",
      "teacher_feedback": null
    }
  }
}
```

## Application Changes (Backend)
- Delete `models/exam_result.go` (and `result_details`).
- Create `models/submission.go`.
- Update `exam_result_handler.go` to save and read from the new `submissions` table.
- Implement logic in Go to calculate `total_score` by unmarshaling `answers_json`, summing the `score` of each question, and updating the total.

## Application Changes (Frontend)
- Update API interfaces (`src/types/practice.ts`, `src/lib/api.ts`) to reflect the new `Submission` model instead of `ExamResult`.
- Update pages that render exam results (`exam/[id]/result/page.tsx`, etc.) to parse the JSON structure.

## Verification
- Run backend tests (if any) and verify compilation.
- Perform a manual test on the frontend to start an exam, submit it, and verify the JSON is saved correctly in the DB.
