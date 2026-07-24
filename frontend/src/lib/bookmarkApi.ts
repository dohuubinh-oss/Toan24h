import { apiFetch } from "./api"

export async function toggleBookmark(lectureId: string) {
  const res = await apiFetch(`/lectures/${lectureId}/bookmark`, {
    method: 'POST',
  })
  return res
}

export async function getBookmarkedLectures() {
  const res = await apiFetch('/bookmarks/lectures')
  return res.data || []
}
