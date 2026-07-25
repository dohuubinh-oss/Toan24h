import { apiFetch } from "./api"

export async function login(data: any) {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data)
  })
  if (res.accessToken && res.refreshToken) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', res.accessToken)
      localStorage.setItem('refreshToken', res.refreshToken)
      localStorage.setItem('user', JSON.stringify(res.user))
    }
  }
  return res
}

export async function registerUser(data: any) {
  const res = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data)
  })
  return res
}

export async function updateGrade(grade: string) {
  const res = await apiFetch('/users/me/grade', {
    method: 'PUT',
    body: JSON.stringify({ grade }),
  })
  return res
}

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    document.cookie = 'accessToken=; path=/; max-age=0'
    document.cookie = 'userRole=; path=/; max-age=0'
    document.cookie = 'userGrade=; path=/; max-age=0'
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

