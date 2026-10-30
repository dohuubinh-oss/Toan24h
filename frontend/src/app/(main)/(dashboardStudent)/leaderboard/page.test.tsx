import { describe, it, expect, vi } from 'vitest'
import LeaderboardRedirectPage from './page'
import * as navigation from 'next/navigation'

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

describe('LeaderboardRedirectPage', () => {
  it('redirects to /student', () => {
    LeaderboardRedirectPage()
    expect(navigation.redirect).toHaveBeenCalledWith('/student')
  })
})
