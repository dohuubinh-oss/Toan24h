import React from 'react'
import { LockKeyhole, Edit2, Trash2 } from 'lucide-react'

export default function UserTable() {
  return (
    <div className="p-6 overflow-x-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden min-w-[1000px]">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Họ tên & Avatar</th>
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Vai trò</th>
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Khối lớp</th>
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Ngày tham gia</th>
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* User Row 1 */}
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="Avatar" className="w-9 h-9 rounded-full bg-slate-100" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjkU3uLAVacqKFDVSrWvAchNgIwXaxak9xuK4XVCf4BYXd9yH9d5P8WTFxPrzYvQgBh_9qphd6ey_bGrjXTTvavr8JNB3vCobxaF9Xnu7IvK4VFNxuaHA4sBdKhkV4px-7l66gTHKkXV6JbFCAgoshfCRI_u_a7UoVbYZU2G0QB2fhUFkWf_Ea-gA28mwNyWwwlPzlJdnksvCWGRE1RuXYR8BtSFOwwMc7MqY06FeLavosHXYkcFJwvmkTCDgAUZPKTv2_h97XL5Eq" />
                  <div>
                    <p className="font-medium text-slate-900">Nguyễn Văn An</p>
                    <p className="text-xs text-slate-500">an.nguyen@student.edu.vn</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">Học sinh</span>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">Lớp 10A1</td>
              <td className="px-6 py-4 text-sm text-slate-600">12/05/2023</td>
              <td className="px-6 py-4">
                <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Hoạt động
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="Đổi mật khẩu">
                    <LockKeyhole className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-100 rounded-lg transition-all" title="Chỉnh sửa">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-all" title="Xóa">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>

            {/* User Row 2 */}
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="Avatar" className="w-9 h-9 rounded-full bg-slate-100" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAOSjyIOZUILgfSFoipgpCmU0_sWtprapzUJJbdqDkjn993pE4NB53mid5rZJs6Jh8Glcwp-qtxU6OaXb4BP_Cp-2_G1axysKkjGbI_O8BIJ6xt2qN68UnWmJSvhIPK2Hm5ueRAmwQ4moMCUf9w6mH4X4A8Gt6c_l0l7tkcRP7j621vsKcoOapXa267OGqnkHgCHwu5-JpeunIpBaM3rMA82lpuZUBBqU3qNe-hNSuq8RzNuZ0gGZ-t5mDQIvdt4HXX5YfwHSMK7Syx" />
                  <div>
                    <p className="font-medium text-slate-900">Trần Thị Bình</p>
                    <p className="text-xs text-slate-500">binh.tt@mathed.vn</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">Giáo viên</span>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">Toán học</td>
              <td className="px-6 py-4 text-sm text-slate-600">02/01/2023</td>
              <td className="px-6 py-4">
                <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Hoạt động
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="Đổi mật khẩu">
                    <LockKeyhole className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-100 rounded-lg transition-all" title="Chỉnh sửa">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-all" title="Xóa">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>

            {/* User Row 3 */}
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="Avatar" className="w-9 h-9 rounded-full bg-slate-100" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0aPR0dT5v8nP-PM-39UXExh0YeHX4p-P5Yf-fTYseqh2z9e3ZVSZMuv6eJnZN98htW8MRDJX63P3A4kucTPhhRV2ijpuVeFWJdHypoGE_htNsXcrpgMtxm_w6ozo7vEzbPpgu2tyXge9TCd81g4DBX1006t5TrxBbUpKtOOklo7mtncO4MkvljV-9fV9ybu6IS9TtgXS6Bu_7Ad6D8HZzFLLDlXDYMVJ3_ZyCt7Oh_u9UYmXDQfuNQfrD7QnsbSeJcV1C9BFqHoBQ" />
                  <div>
                    <p className="font-medium text-slate-900">Lê Công Danh</p>
                    <p className="text-xs text-slate-500">danh.lc@student.edu.vn</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">Học sinh</span>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">Lớp 11B2</td>
              <td className="px-6 py-4 text-sm text-slate-600">15/08/2023</td>
              <td className="px-6 py-4">
                <span className="flex items-center gap-1.5 text-rose-600 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  Bị khóa
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="Đổi mật khẩu">
                    <LockKeyhole className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-100 rounded-lg transition-all" title="Chỉnh sửa">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-all" title="Xóa">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>

            {/* User Row 4 */}
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="Avatar" className="w-9 h-9 rounded-full bg-slate-100" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNJnqcgvB5CNg7alyy7McDAcMORJkg4mVGwQI6nCEmf6ecmSnfDCq1d7AaQ0nTTpEPUmsorr7TLX-VqkYh2-I0_Kg1wEYfgu-PVkJjJ4-WdKdevaJOHu3QPA1wXCPpQs-ruYP3ZTdhCQ4tw9o7QsWh_TYrmzVof7lY2xg_jD6UsGKAxM1HviTCLqlYjv11sWvC5Uav3Opt4b_y0e-Tv3-0LmPJwcokU8SkRlrRWkU6RfmYcWbOsiNf2GOZAQydxg10zspoI0TNepWW" />
                  <div>
                    <p className="font-medium text-slate-900">Phạm Minh Đức</p>
                    <p className="text-xs text-slate-500">duc.pm@mathed.vn</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">Quản trị viên</span>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">—</td>
              <td className="px-6 py-4 text-sm text-slate-600">20/12/2022</td>
              <td className="px-6 py-4">
                <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Hoạt động
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="Đổi mật khẩu">
                    <LockKeyhole className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-100 rounded-lg transition-all" title="Chỉnh sửa">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-all" title="Xóa">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
