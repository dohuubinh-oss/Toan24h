import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Các route cần middleware can thiệp để chuyển hướng
const redirectRoutes = ['/lectures', '/practices']

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Kiểm tra xem đường dẫn hiện tại có nằm trong redirectRoutes không
  const isRedirectRoute = redirectRoutes.includes(path)

  if (!isRedirectRoute) {
    return NextResponse.next()
  }

  // Đọc accessToken từ cookies
  const token = request.cookies.get('accessToken')?.value
  const role = request.cookies.get('userRole')?.value
  const grade = request.cookies.get('userGrade')?.value

  if (!token) {
    // Không có token -> redirect về login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (role === 'admin') {
    if (path === '/lectures' || path.startsWith('/lectures/lop')) {
      return NextResponse.redirect(new URL('/dashboard/lectures', request.url))
    }
    if (path === '/practices' || path.startsWith('/practices/lop')) {
      // Tạm thời cũng chuyển practices của admin về một trang dashboard tương tự
      return NextResponse.redirect(new URL('/dashboard/practices', request.url))
    }
  } else if (role === 'student') {
    // Ngăn học sinh vào admin dashboard
    if (path.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/student', request.url))
    }

    if (path === '/lectures') {
      if (grade) {
        return NextResponse.redirect(new URL(`/lectures/lop/${grade}`, request.url))
      }
      // If no grade, let it pass (modal will show on page)
    } else if (path.startsWith('/lectures/lop/')) {
      // Bắt buộc URL phải khớp với lớp
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

// Cấu hình matcher để middleware chỉ chạy trên các route cụ thể (tối ưu hiệu suất)
export const config = {
  matcher: ['/lectures/:path*', '/practices/:path*', '/dashboard/:path*'],
}
