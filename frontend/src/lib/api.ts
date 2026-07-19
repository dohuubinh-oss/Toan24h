const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

import { Question } from '@/types/question'

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const headers = new Headers(options.headers || {})
  
  // Set default content type to JSON if not uploading FormData
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorData
    try {
      errorData = await response.json()
    } catch (e) {
      errorData = response.statusText
    }
    throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`)
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

// Mockup for AI handwriting recognition
export async function recognizeHandwriting(file: File): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500))
  // Return some mockup text/latex
  return 'Gợi ý từ AI: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$'
}

export async function getQuestions(page: number = 1, limit: number = 20): Promise<Question[]> {
  const response = await apiFetch(`/questions?page=${page}&limit=${limit}`)
  if (response.status === 'success' && Array.isArray(response.data)) {
    return response.data.map((q: any) => {
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
        book_name: q.bookName,
        tags: parsedTags,
        options: parsedOptions,
        subQuestions: subQuestions
      } as Question
    })
  }
  return []
}
