import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { recognizeHandwriting } from './api'

describe('recognizeHandwriting', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('sends FormData with Blob and returns recognized text', async () => {
    const mockBlob = new Blob(['dummy-image-bytes'], { type: 'image/jpeg' })
    const mockResponseText = 'x^2 + 2x + 1 = 0'

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ text: mockResponseText })
    })

    const result = await recognizeHandwriting(mockBlob)
    expect(result).toBe(mockResponseText)
    expect(global.fetch).toHaveBeenCalled()

    const callArgs = (global.fetch as any).mock.calls[0]
    expect(callArgs[0]).toContain('/ocr')
    expect(callArgs[1].method).toBe('POST')
    expect(callArgs[1].body).toBeInstanceOf(FormData)
  })

  it('handles error response from server', async () => {
    const mockFile = new File(['content'], 'test.png', { type: 'image/png' })

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ error: 'Lỗi nhận dạng ảnh' })
    })

    await expect(recognizeHandwriting(mockFile)).rejects.toThrow('Lỗi nhận dạng ảnh')
  })
})
