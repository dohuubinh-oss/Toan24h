import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Đọc accessToken từ cookies
  const token = request.cookies.get('accessToken')?.value
  const role = request.cookies.get('userRole')?.value
  const grade = request.cookies.get('userGrade')?.value
  const expiresAt = request.cookies.get('userExpiresAt')?.value

  if (!token) {
    // Không có token -> redirect về login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Kiểm tra hạn sử dụng: ngoại trừ admin và teacher, nếu expiresAt < hiện tại thì chuyển hướng sang /upgrade
  if (role !== 'admin' && role !== 'teacher') {
    if (expiresAt) {
      const expiresTime = new Date(expiresAt).getTime()
      if (!isNaN(expiresTime) && expiresTime < Date.now()) {
        if (path !== '/' && path !== '/upgrade' && !path.startsWith('/login') && !path.startsWith('/register')) {
          return NextResponse.redirect(new URL('/upgrade', request.url))
        }
      }
    }
  }

  if (role === 'admin' || role === 'teacher') {
    // Admin và Teacher truy cập /lectures sẽ được đưa về trang chọn lớp dashboard
    if (path === '/lectures') {
      return NextResponse.redirect(new URL('/dashboard/lectures', request.url))
    }
  } else if (role === 'student') {
    // Ngăn học sinh vào admin/teacher dashboard -> chuyển thẳng tới bài giảng theo lớp của học sinh
    if (path.startsWith('/dashboard')) {
      if (grade) {
        return NextResponse.redirect(new URL(`/lectures/lop/${grade}`, request.url))
      }
      return NextResponse.redirect(new URL('/student', request.url))
    }

    if (path === '/lectures') {
      if (grade) {
        return NextResponse.redirect(new URL(`/lectures/lop/${grade}`, request.url))
      }
      // Nếu chưa có grade, cho phép vào để hiển thị modal chọn lớp
    } else if (path.startsWith('/lectures/lop/')) {
      // Bắt buộc URL phải khớp với lớp của học sinh
      const urlGrade = path.split('/')[3]
      if (grade && urlGrade !== grade && urlGrade !== undefined) {
        return NextResponse.redirect(new URL(`/lectures/lop/${grade}`, request.url))
      }
    }

    if (path === '/practices') {
      if (grade) {
        return NextResponse.redirect(new URL(`/practices/lop/${grade}`, request.url))
      }
    } else if (path.startsWith('/practices/lop/')) {
      const urlGrade = path.split('/')[3]
      if (grade && urlGrade !== grade && urlGrade !== undefined) {
        return NextResponse.redirect(new URL(`/practices/lop/${grade}`, request.url))
      }
    }
  }

  return NextResponse.next()
}

// Cấu hình matcher để middleware kiểm tra trên các route học tập & quản lý
export const config = {
  matcher: [
    '/lectures/:path*',
    '/practices/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    '/exams/:path*',
    '/student/:path*',
  ],
}
