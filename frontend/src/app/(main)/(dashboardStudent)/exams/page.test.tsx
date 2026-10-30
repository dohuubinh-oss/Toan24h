import { describe, it, expect, vi, beforeEach } from 'vitest'
import ExamsRedirectPage from './page'
import * as navigation from 'next/navigation'
import { cookies } from 'next/headers'

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

describe('ExamsRedirectPage (/exams)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to /exams/lop/6 by default when userGrade cookie is not set', async () => {
    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn().mockReturnValue(undefined),
    } as any)

    await ExamsRedirectPage()
    expect(navigation.redirect).toHaveBeenCalledWith('/exams/lop/6')
  })

  it('redirects to /exams/lop/${grade} based on userGrade cookie', async () => {
    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn((key: string) => {
        if (key === 'userGrade') return { value: '9' }
        return undefined
      }),
    } as any)

    await ExamsRedirectPage()
    expect(navigation.redirect).toHaveBeenCalledWith('/exams/lop/9')
  })
})
