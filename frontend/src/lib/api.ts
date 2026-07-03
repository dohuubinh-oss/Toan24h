const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

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
