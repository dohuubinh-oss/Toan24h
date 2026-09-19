import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Các route cần middleware can thiệp để chuyển hướng
const redirectRoutes = ['/lectures', '/practices']

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Đọc accessToken từ cookies
  const token = request.cookies.get('accessToken')?.value
  const role = request.cookies.get('userRole')?.value
  const grade = request.cookies.get('userGrade')?.value

  if (!token) {
    // Không có token -> redirect về login
    return NextResponse.redirect(new URL('/login', request.url))
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

// Cấu hình matcher để middleware chỉ chạy trên các route cụ thể (tối ưu hiệu suất)
export const config = {
  matcher: ['/lectures/:path*', '/practices/:path*', '/dashboard/:path*'],
}
