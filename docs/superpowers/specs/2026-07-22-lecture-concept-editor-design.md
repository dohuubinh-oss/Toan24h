# Lecture Concept Editor Design

## Goal
Replace the custom Media List UI in `LectureMediaCard` with a Rich Text Editor (similar to `SharedEditorCard`) and ensure inserted images and YouTube videos stretch to 100% width. Remove the deprecated `mediaItems` array from both frontend and backend.

## Architecture & Data Flow
- **Frontend**: 
  - `LectureCreatorContext` drops `mediaItems` state.
  - `LectureMediaCard` renders a `SharedEditorCard` bound to the `basicConcept` state.
  - `SharedEditorCard` and `RichTextEditor` extensions are updated so that `TiptapImage` uses `w-full` instead of `max-w-full`.
- **Backend**:
  - `Lecture` model drops the `MediaItems` field.
  - Any DTOs referencing `MediaItems` will drop it (e.g., `CreateLectureRequest`).
  - Image URL processing currently done for `MediaItems` might need to be adjusted or removed if the Rich Text Editor's upload logic already handles URLs (which it does via `uploadTempImage`).
  
## Validation
- Images and YouTube videos inserted take up 100% of the container width (`w-full`).
- No `mediaItems` are sent in the API payload.
- Lecture saves and loads successfully.
