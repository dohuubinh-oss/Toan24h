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
