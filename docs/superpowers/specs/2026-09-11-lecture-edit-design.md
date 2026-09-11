# Design Spec: Lecture Edit Feature & Exam/Practice Links

## Overview
Implement the ability to edit an existing lecture on the same route `/dashboard/lectures/create` by passing an `editId` query parameter. Additionally, update the instructional text to provide direct links to create an exam and create a practice test.

## Approaches Chosen
- **Lecture Edit**: Using "Phương án 2", we reuse `/dashboard/lectures/create` but check for `editId` in the query string. If present, it switches to edit mode, fetches the lecture data, populates the `LectureCreatorContext`, and uses `PUT /lectures/[id]` for saving.
- **Practice Test Link**: We add links directly in `LectureBasicSettings.tsx`. The link for "Tạo đề thi" will point to `/dashboard/exams/create`. The link for "Tạo bài luyện tập" will point to `/dashboard/exams/create?type=practice`.

## Technical Details

### 1. Link Updates (`LectureBasicSettings.tsx`)
- Replace the static text with `Link` components from `next/link`.
- If `editId` is present in the URL, we also might want to append `&lectureId=[editId]` to the exam creation links so that the exam is automatically linked to this lecture (if the feature exists, though `exams/create` supports `lectureId` state based on `frontend/src/app/(fullscreen)/dashboard/exams/create/page.tsx` it seems to have `exam.lectureId`).

### 2. Edit Mode (`LectureCreatorContext.tsx` & `page.tsx`)
- Read `editId` from `useSearchParams()` in `page.tsx`. Pass it down to `LectureCreatorProvider`.
- Inside `LectureCreatorProvider`, add `useEffect` to fetch lecture data `GET /lectures/[editId]` if `editId` is provided.
- Populate `title`, `grade`, `category`, `basicConcept`, and `dangToanList`.
- Update `validateAndSubmit`:
  - If `editId` exists, call `apiFetch('/lectures/[editId]', { method: 'PUT', ... })`.
  - Else, call `POST`.
- Update `isSubmitting` to also handle an `isLoading` state so the form shows a loading spinner while fetching initial data.

## Open Questions
- API endpoint for GET lecture by ID: Assuming it's `GET /lectures/[id]`.
- API endpoint for PUT lecture: Assuming it's `PUT /lectures/[id]`.
