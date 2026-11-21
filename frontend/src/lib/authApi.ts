import { apiFetch } from "./api"

/**
 * Synchronize user session state in localStorage and client-readable cookies (role, grade, expiresAt).
 * Note: accessToken and refreshToken are set strictly via HttpOnly cookies by the backend.
 */
export function syncAuthSession(res: any) {
  if (res?.user && typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(res.user))
    document.cookie = `userRole=${res.user.role}; path=/; max-age=86400; SameSite=Lax`
    if (res.user.grade) {
      document.cookie = `userGrade=${res.user.grade}; path=/; max-age=86400; SameSite=Lax`
    }
    if (res.user.expiresAt) {
      document.cookie = `userExpiresAt=${res.user.expiresAt}; path=/; max-age=86400; SameSite=Lax`
    } else {
      document.cookie = `userExpiresAt=; path=/; max-age=0; SameSite=Lax`
    }
  }
}

export async function login(data: any) {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data)
  })
  syncAuthSession(res)
  return res
}

export async function loginWithGoogle(credential: string, refCode?: string) {
  const res = await apiFetch('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential, refCode })
  })
  syncAuthSession(res)
  return res
}

export interface RegisterData {
  email: string
  password: string
  fullName: string
  role?: string
  grade?: string
  voucherCode?: string
  termsAgreedAt?: string
}

export async function registerUser(data: RegisterData) {
  const res = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data)
  })
  return res
}

export async function verifyEmail(token: string) {
  const res = await apiFetch('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token })
  })
  return res
}

export async function updateGrade(grade: number | string) {
  const res = await apiFetch('/users/me/grade', {
    method: 'PUT',
    body: JSON.stringify({ grade: String(grade) })
  })
  if (typeof window !== 'undefined') {
    document.cookie = `userGrade=${grade}; path=/; max-age=86400; SameSite=Lax`
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        user.grade = String(grade)
        localStorage.setItem('user', JSON.stringify(user))
      } catch (e) {}
    }
  }
  return res
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const res = await apiFetch('/users/me/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword })
  })
  return res
}

export async function resendVerification(email: string) {
  const res = await apiFetch('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email })
  })
  return res
}

export async function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user')
    document.cookie = 'userRole=; path=/; max-age=0; SameSite=Lax'
    document.cookie = 'userExpiresAt=; path=/; max-age=0; SameSite=Lax'
    document.cookie = 'userGrade=; path=/; max-age=0; SameSite=Lax'
    try {
      await apiFetch('/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error("Logout API failed:", error)
    }
    
    window.location.href = '/login'
  }
}

export async function deductPoints(amount: number) {
  const res = await apiFetch('/users/me/deduct-points', {
    method: 'POST',
    body: JSON.stringify({ amount })
  })
  
  // Update local storage user points if successful
  if (res && res.points !== undefined) {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          user.points = res.points
          localStorage.setItem('user', JSON.stringify(user))
        } catch (e) {}
      }
    }
  }
  return res
}

export async function getUserProfile(token?: string) {
  const headers: any = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await apiFetch('/users/me', {
    method: 'GET',
    headers,
    cache: 'no-store',
  })
  if (res && res.data) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(res.data))
      if (res.data.expiresAt) {
        document.cookie = `userExpiresAt=${res.data.expiresAt}; path=/; max-age=86400; SameSite=Lax`
      } else {
        document.cookie = `userExpiresAt=; path=/; max-age=0; SameSite=Lax`
      }
    }
  }
  return res
}

export async function deleteMyAccount() {
  const res = await apiFetch('/users/me', {
    method: 'DELETE',
  })
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user')
    document.cookie = 'userRole=; path=/; max-age=0; SameSite=Lax'
    document.cookie = 'userExpiresAt=; path=/; max-age=0; SameSite=Lax'
    document.cookie = 'userGrade=; path=/; max-age=0; SameSite=Lax'
  }
  return res
}
