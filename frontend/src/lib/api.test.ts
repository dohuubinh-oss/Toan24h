import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiFetch, uploadTempImage } from './api'

describe('API Client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('apiFetch should call fetch with correct URL and headers', async () => {
    const mockResponse = { data: 'test' }
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as any)

    const result = await apiFetch('/test-endpoint', { method: 'POST', body: JSON.stringify({ a: 1 }) })
    const fetchCall = vi.mocked(fetch).mock.calls[0]
    expect(fetchCall[0]).toBe('http://localhost:8080/api/v1/test-endpoint')
    expect(fetchCall[1]?.method).toBe('POST')
    expect(fetchCall[1]?.body).toBe(JSON.stringify({ a: 1 }))
    expect((fetchCall[1]?.headers as Headers).get('Content-Type')).toBe('application/json')
    expect(result).toEqual(mockResponse)
  })

  it('apiFetch should throw error if response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Bad Request' }),
    } as any)

    await expect(apiFetch('/test')).rejects.toThrow('API Error: 400 - {"error":"Bad Request"}')
  })

  it('uploadTempImage should return URL on success', async () => {
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' })
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success', data: { url: '/uploads/temp/test.png' } }),
    } as any)

    const result = await uploadTempImage(mockFile)
    expect(result).toBe('/uploads/temp/test.png')
    
    // Check if FormData was used
    const fetchCall = vi.mocked(fetch).mock.calls[0]
    expect(fetchCall[1]?.body).toBeInstanceOf(FormData)
  })
})

describe('API Functions', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('deleteQuestion should call DELETE /questions/:id and return true on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success' }),
    } as any)

    const { deleteQuestion } = await import('./api')
    const result = await deleteQuestion('123')
    
    expect(result).toBe(true)
    const fetchCall = vi.mocked(fetch).mock.calls[0]
    expect(fetchCall[0]).toContain('/questions/123')
    expect(fetchCall[1]?.method).toBe('DELETE')
  })

  it('getQuestion should call GET /questions/:id and return data on success', async () => {
    const mockQuestion = { id: '123', content: 'test question' }
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success', data: mockQuestion }),
    } as any)

    const { getQuestion } = await import('./api')
    const result = await getQuestion('123')
    
    expect(result).toMatchObject(mockQuestion)
    const fetchCall = vi.mocked(fetch).mock.calls[0]
    expect(fetchCall[0]).toContain('/questions/123')
    expect(fetchCall[1]?.method).toBeUndefined() // default GET
  })

  it('updateQuestion should call PUT /questions/:id and return updated data on success', async () => {
    const mockData = { type_question: 'single', content: 'updated question' } as Partial<Question>
    
    // updateQuestion calls PUT, then calls GET if success
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success' }),
    } as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success', data: { id: '123', content: 'updated question' } }),
    } as any)

    const { updateQuestion } = await import('./api')
    const result = await updateQuestion('123', mockData)
    
    expect(result?.id).toBe('123')
    expect(result?.content).toBe('updated question')
    
    const putCall = vi.mocked(fetch).mock.calls[0]
    expect(putCall[0]).toContain('/questions/123')
    expect(putCall[1]?.method).toBe('PUT')
    expect(putCall[1]?.body).toContain('"typeQuestion":"single"')
  })
})
