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

  if (!token) {
    // Không có token -> redirect về login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Giải mã JWT payload.
    // Lưu ý: Môi trường Edge không dùng được `jsonwebtoken`. 
    // Nếu dùng token thật, cần dùng package `jose` để verify, hoặc chỉ decode base64.
    // Ở đây ta decode chuỗi base64 giả lập được tạo từ LoginForm.
    const payloadBase64 = token.split('.')[1] || token
    const payloadString = atob(payloadBase64)
    const payload = JSON.parse(payloadString)

    const role = payload.role
    const grade = payload.grade || '9'

    if (role === 'admin') {
      if (path === '/lectures') {
        return NextResponse.redirect(new URL('/dashboard/lectures', request.url))
      }
      if (path === '/practices') {
        // Tạm thời cũng chuyển practices của admin về một trang dashboard tương tự
        return NextResponse.redirect(new URL('/dashboard/practices', request.url))
      }
    } else if (role === 'student') {
      if (path === '/lectures') {
        return NextResponse.redirect(new URL(`/lectures/lop/${grade}`, request.url))
      }
      if (path === '/practices') {
        return NextResponse.redirect(new URL(`/practices/lop/${grade}`, request.url))
      }
    }
  } catch (error) {
    console.error('Lỗi khi parse token trong middleware:', error)
    // Nếu token lỗi hoặc hết hạn, đẩy về login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

// Cấu hình matcher để middleware chỉ chạy trên các route cụ thể (tối ưu hiệu suất)
export const config = {
  matcher: ['/lectures', '/practices'],
}
