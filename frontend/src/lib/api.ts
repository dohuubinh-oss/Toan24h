const isServer = typeof window === 'undefined';
const API_BASE_URL = isServer 
  ? (process.env.BACKEND_URL ? `${process.env.BACKEND_URL}${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}` : 'http://localhost:8080/api/v1')
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1');

import { Question } from '@/types/question'

export interface ApiOptions extends RequestInit {
  url_is_refresh?: boolean;
}

export async function apiFetch(endpoint: string, options: ApiOptions = {}) {
  let url = `${API_BASE_URL}${endpoint}`
  // Support absolute URLs for retry mechanism
  if (endpoint.startsWith('http')) {
    url = endpoint
  }
  
  const headers = new Headers(options.headers || {})
  
  // Set default content type to JSON if not uploading FormData
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined' && !options.url_is_refresh) {
      // Try refresh token
      // Try refresh token via HttpOnly cookies
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        })
        
        if (refreshRes.ok) {
          // Backend sets the new accessToken cookie automatically
          // Retry original request
          const retryRes = await fetch(url, {
            ...options,
            headers,
            credentials: 'include'
          })
          if (retryRes.ok) {
            return retryRes.json()
          }
        } else {
          // Refresh failed, clear client user data and redirect to login
          localStorage.removeItem('user')
          window.location.href = '/login'
        }
      } catch (e) {
        console.error("Refresh token error", e)
      }
    }

    let errorData
    try {
      errorData = await response.json()
    } catch (e) {
      errorData = response.statusText
    }
    
    let errorMessage = `API Error: ${response.status}`
    if (errorData && typeof errorData === 'object' && errorData.error) {
      errorMessage = errorData.error
    } else if (typeof errorData === 'string') {
      errorMessage = errorData
    } else {
      errorMessage = `${errorMessage} - ${JSON.stringify(errorData)}`
    }
    
    throw new Error(errorMessage)
  }

  return response.json()
}

export async function uploadTempImage(file: File | Blob): Promise<string> {
  const formData = new FormData()
  // Ensure we have a filename
  const filename = file instanceof File ? file.name : 'upload.png'
  formData.append('file', file, filename)

  const response = await apiFetch('/uploads/temp', {
    method: 'POST',
    body: formData,
    // Note: Do not set Content-Type header when sending FormData,
    // the browser will automatically set it with the correct boundary
  })

  if (response.status === 'success' && response.data?.url) {
    return response.data.url
  }
  
  throw new Error('Upload failed')
}

// Helper to convert object URL (blob:http...) to File and upload
export async function uploadObjectUrlIfNeeded(url: string | null): Promise<string | null> {
  if (!url || !url.startsWith('blob:')) {
    return url;
  }
  
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return await uploadTempImage(blob)
  } catch (error) {
    console.error("Failed to upload object URL:", error)
    return url // fallback to original
  }
}

export async function recognizeHandwriting(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiFetch('/ocr', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to recognize handwriting');
  }

  const data = await res.json();
  return data.text || '';
}

export async function getQuestions(page: number = 1, limit: number = 20, filters?: { ids?: string[], grade?: string, topic?: string, type?: string, difficulty?: string, q?: string }): Promise<{data: Question[], total: number, totalPages?: number}> {
  let url = `/questions?page=${page}&limit=${limit}`
  if (filters) {
    if (filters.ids && filters.ids.length > 0) url += `&ids=${filters.ids.join(',')}`;
    if (filters.grade) url += `&grade=${filters.grade.replace(/\D/g, '')}`; // extract only number
    if (filters.topic) url += `&topic=${encodeURIComponent(filters.topic)}`;
    if (filters.type) url += `&type=${encodeURIComponent(filters.type)}`;
    if (filters.difficulty) url += `&difficulty=${encodeURIComponent(filters.difficulty)}`;
    if (filters.q) url += `&q=${encodeURIComponent(filters.q)}`;
  }
  const response = await apiFetch(url)
  if (response.status === 'success' && response.data) {
    const items = response.data.items || (Array.isArray(response.data) ? response.data : [])
    const total = response.data.total || items.length

    const questions = items.map((q: any) => {
      // Parse tags and options if they are stringified JSON (from Go backend)
      let parsedTags = []
      let parsedOptions = []
      
      try {
        parsedTags = typeof q.tags === 'string' ? JSON.parse(q.tags || '[]') : (q.tags || [])
      } catch(e) {
        console.error("Failed to parse tags", q.tags)
      }

      try {
        parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options || '[]') : (q.options || [])
      } catch(e) {
        console.error("Failed to parse options", q.options)
      }

      let subQuestions = []
      if (q.subQuestions && Array.isArray(q.subQuestions)) {
        subQuestions = q.subQuestions.map((sub: any) => {
          let pTags = []
          let pOpts = []
          try {
            pTags = typeof sub.tags === 'string' ? JSON.parse(sub.tags || '[]') : (sub.tags || [])
          } catch(e) {}
          try {
            pOpts = typeof sub.options === 'string' ? JSON.parse(sub.options || '[]') : (sub.options || [])
          } catch(e) {}
          return {
            ...sub,
            type_question: sub.typeQuestion,
            correct_answer: sub.correctAnswer,
            solution_guide: sub.solutionGuide,
            difficulty_level: sub.difficultyLevel,
            difficulty_point: sub.difficultyPoint,
            quick_solve_tips: sub.quickSolveTips,
            general_method: sub.generalMethod,
            hint: sub.hint,
            mistakes: sub.mistakes,
            book_name: sub.bookName,
            tags: pTags,
            options: pOpts
          }
        })
      }

      return {
        ...q,
        type_question: q.typeQuestion,
        correct_answer: q.correctAnswer,
        solution_guide: q.solutionGuide,
        difficulty_level: q.difficultyLevel,
        difficulty_point: q.difficultyPoint,
        quick_solve_tips: q.quickSolveTips,
        general_method: q.generalMethod,
        hint: q.hint,
        mistakes: q.mistakes,
        book_name: q.bookName,
        tags: parsedTags,
        options: parsedOptions,
        subQuestions: subQuestions
      } as Question
    })

    const totalPages = response.data.totalPages || response.data.pages || Math.ceil(total / limit);
    return { data: questions, total, totalPages }
  }
  return { data: [], total: 0, totalPages: 0 }
}

export async function deleteQuestion(id: string): Promise<boolean> {
  try {
    const response = await apiFetch(`/questions/${id}`, {
      method: 'DELETE'
    })
    return response.status === 'success'
  } catch (error) {
    console.error(`Failed to delete question ${id}:`, error)
    return false
  }
}

export async function getQuestion(id: string): Promise<Question | null> {
  try {
    const response = await apiFetch(`/questions/${id}`)
    if (response.status === 'success' && response.data) {
      const q = response.data
      
      let parsedTags = []
      let parsedOptions = []
      try { parsedTags = typeof q.tags === 'string' ? JSON.parse(q.tags || '[]') : (q.tags || []) } catch(e) {}
      try { parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options || '[]') : (q.options || []) } catch(e) {}
      
      let subQuestions = []
      if (q.subQuestions && Array.isArray(q.subQuestions)) {
        subQuestions = q.subQuestions.map((sub: any) => {
          let pTags = []
          let pOpts = []
          try { pTags = typeof sub.tags === 'string' ? JSON.parse(sub.tags || '[]') : (sub.tags || []) } catch(e) {}
          try { pOpts = typeof sub.options === 'string' ? JSON.parse(sub.options || '[]') : (sub.options || []) } catch(e) {}
          return {
            ...sub,
            type_question: sub.typeQuestion,
            correct_answer: sub.correctAnswer,
            solution_guide: sub.solutionGuide,
            difficulty_level: sub.difficultyLevel,
            difficulty_point: sub.difficultyPoint,
            quick_solve_tips: sub.quickSolveTips,
            general_method: sub.generalMethod,
            hint: sub.hint,
            mistakes: sub.mistakes,
            book_name: sub.bookName,
            tags: pTags,
            options: pOpts
          }
        })
      }

      return {
        ...q,
        type_question: q.typeQuestion,
        correct_answer: q.correctAnswer,
        solution_guide: q.solutionGuide,
        difficulty_level: q.difficultyLevel,
        difficulty_point: q.difficultyPoint,
        quick_solve_tips: q.quickSolveTips,
        general_method: q.generalMethod,
        hint: q.hint,
        mistakes: q.mistakes,
        book_name: q.bookName,
        tags: parsedTags,
        options: parsedOptions,
        subQuestions: subQuestions
      } as Question
    }
    return null
  } catch (error) {
    console.error(`Failed to get question ${id}:`, error)
    return null
  }
}

export async function updateQuestion(id: string, data: Partial<Question>): Promise<Question | null> {
  try {
    // Convert snake_case back to camelCase for backend
    const payload = {
      ...data,
      tags: Array.isArray(data.tags) ? JSON.stringify(data.tags) : (data.tags || '[]'),
      options: Array.isArray(data.options) ? JSON.stringify(data.options) : (data.options || '[]'),
      typeQuestion: data.type_question ?? (data as any).typeQuestion,
      correctAnswer: data.correct_answer ?? (data as any).correctAnswer,
      solutionGuide: data.solution_guide ?? (data as any).solutionGuide,
      difficultyLevel: data.difficulty_level ?? (data as any).difficultyLevel,
      difficultyPoint: data.difficulty_point ?? (data as any).difficultyPoint,
      quickSolveTips: data.quick_solve_tips ?? (data as any).quickSolveTips,
      generalMethod: data.general_method ?? (data as any).generalMethod,
      hint: data.hint,
      mistakes: data.mistakes,
      bookName: data.book_name ?? (data as any).bookName,
      subQuestions: data.subQuestions ? data.subQuestions.map((sub: any) => ({
        ...sub,
        tags: Array.isArray(sub.tags) ? JSON.stringify(sub.tags) : (sub.tags || '[]'),
        options: Array.isArray(sub.options) ? JSON.stringify(sub.options) : (sub.options || '[]'),
        typeQuestion: sub.type_question ?? sub.typeQuestion,
        correctAnswer: sub.correct_answer ?? sub.correctAnswer,
        solutionGuide: sub.solution_guide ?? sub.solutionGuide,
        difficultyLevel: sub.difficulty_level ?? sub.difficultyLevel,
        difficultyPoint: sub.difficulty_point ?? sub.difficultyPoint,
        quickSolveTips: sub.quick_solve_tips ?? sub.quickSolveTips,
        generalMethod: sub.general_method ?? sub.generalMethod,
        bookName: sub.book_name ?? sub.bookName,
      })) : undefined
    }
    
    // Clean up snake_case keys if necessary, or just send both. The backend will map properly if JSON tags align.
    const response = await apiFetch(`/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
    
    if (response.status === 'success') {
      return getQuestion(id) // Re-fetch to ensure mapped format is correct
    }
    return null
  } catch (error) {
    console.error(`Failed to update question ${id}:`, error)
    return null
  }
}

export async function createExam(payload: any): Promise<any> {
  const response = await apiFetch('/exams', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response
}

export async function getExams(): Promise<any[]> {
  try {
    const response = await apiFetch('/exams', { cache: 'no-store' })
    if (response.data) {
      return response.data
    }
    return []
	} catch (error) {
		console.error("Failed to fetch exams:", error)
		return []
	}
}

export async function deleteExam(id: string): Promise<boolean> {
  try {
    await apiFetch(`/exams/${id}`, { method: 'DELETE' })
    return true
  } catch (error) {
    console.error("Failed to delete exam:", error)
    return false
  }
}

export async function sendCheatWarning(examId: string, level: number) {
  return apiFetch('/notifications/cheat', {
    method: 'POST',
    body: JSON.stringify({ examId, level }),
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function getExamById(id: string): Promise<any> {
  try {
    const response = await apiFetch(`/exams/${id}`)
    if (response.data) {
      return response.data
    }
    return null
  } catch (error) {
    console.error(`Failed to fetch exam ${id}:`, error)
    return null
  }
}

export async function submitExam(examId: string, answers: any[]): Promise<any> {
  const payload = { answers }
  const response = await apiFetch(`/exams/${examId}/submit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response
}

export async function getExamResultById(id: string): Promise<any> {
  try {
    const response = await apiFetch(`/exam-results/${id}`)
    if (response.data) {
      return response.data
    }
    return null
  } catch (error) {
    console.error(`Failed to fetch exam result ${id}:`, error)
    return null
  }
}

export async function getMyExamResults(token?: string): Promise<any[]> {
  try {
    const headers: any = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    const response = await apiFetch(`/exam-results`, { headers, cache: 'no-store' })
    if (response.data) {
      return response.data
    }
    return []
  } catch (error) {
    console.error(`Failed to fetch my exam results:`, error)
    return []
  }
}

export async function getPendingAppeals(): Promise<any[]> {
  try {
    const response = await apiFetch(`/appeals`)
    if (response.data) {
      return response.data
    }
    return []
  } catch (error) {
    console.error(`Failed to fetch pending appeals:`, error)
    return []
  }
}

export async function resolveAppeal(detailId: string, data: { status: string, newScore: number, teacherFeedback: string }): Promise<any> {
  const response = await apiFetch(`/appeals/${detailId}/resolve`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return response
}

export async function submitAppeal(resultId: string, detailId: string, appealMessage: string): Promise<any> {
  const response = await apiFetch(`/exam-results/${resultId}/appeal`, {
    method: 'POST',
    body: JSON.stringify({ detailId, appealMessage }),
  })
  return response
}

export async function reportQuestion(questionId: string, message: string): Promise<any> {
  const response = await apiFetch(`/questions/${questionId}/report`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
  return response
}

export async function getReportedQuestions(): Promise<any[]> {
  try {
    const response = await apiFetch(`/questions/reported`)
    if (response.status === 'success' && response.data) {
      return response.data
    }
    return []
  } catch (error) {
    console.error(`Failed to fetch reported questions:`, error)
    return []
  }
}

export async function resolveReportedQuestion(id: string): Promise<boolean> {
  try {
    const response = await apiFetch(`/questions/reported/${id}/resolve`, {
      method: "POST"
    })
    return response.status === "success"
  } catch (error) {
    console.error(`Failed to resolve reported question ${id}:`, error)
    return false
  }
}

