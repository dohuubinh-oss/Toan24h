'use client'

import React, { useState } from 'react'
import { LockKeyhole, Users, Calendar, UserCog, X } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { getAvatarInitial } from '@/lib/utils'

export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: string;
  grade: string;
  joinDate: string;
  status: string; // active, locked, expired
  expiresAt?: string | null;
}

interface UserTableProps {
  users: User[];
  onSoftDelete: (id: string, name: string) => void;
  isAdmin?: boolean;
  onUpdateRole?: (id: string, name: string, newRole: string) => void;
}

export default function UserTable({ users, onSoftDelete, isAdmin = false, onUpdateRole }: UserTableProps) {
  const [now] = React.useState(() => Date.now())
  const [roleModalUser, setRoleModalUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('teacher')

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Hành động này sẽ khóa tài khoản của người dùng. Bạn có chắc chắn muốn khóa người dùng ${name}?`)) {
      onSoftDelete(id, name);
    }
  }

  const handleOpenRoleModal = (user: User) => {
    setRoleModalUser(user)
    setSelectedRole(user.role === 'affiliate' ? 'affiliate' : 'teacher')
  }

  const handleConfirmRoleChange = () => {
    if (roleModalUser && onUpdateRole) {
      onUpdateRole(roleModalUser.id, roleModalUser.name, selectedRole)
      setRoleModalUser(null)
    }
  }

  if (!users || users.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">Không tìm thấy người dùng</h3>
        <p className="text-sm text-slate-500 max-w-sm">
          Không có người dùng nào khớp với bộ lọc hiện tại. Vui lòng thử tìm kiếm với từ khóa hoặc thay đổi bộ lọc khác.
        </p>
      </div>
    );
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Hoạt động', colorClass: 'text-emerald-600', dotClass: 'bg-emerald-500 animate-pulse' };
      case 'locked':
        return { label: 'Bị khóa', colorClass: 'text-rose-600', dotClass: 'bg-rose-500' };
      case 'expired':
        return { label: 'Hết hạn', colorClass: 'text-amber-600', dotClass: 'bg-amber-500' };
      default:
        return { label: status, colorClass: 'text-slate-600', dotClass: 'bg-slate-500' };
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'teacher':
        return (
          <Badge size="sm" className="bg-purple-50 text-purple-700 border border-purple-200 font-medium">
            Giáo viên
          </Badge>
        )
      case 'affiliate':
        return (
          <Badge size="sm" className="bg-amber-50 text-amber-700 border border-amber-200 font-medium">
            Affiliate
          </Badge>
        )
      case 'admin':
        return (
          <Badge size="sm" className="bg-slate-800 text-white font-medium">
            Admin
          </Badge>
        )
      default:
        return (
          <Badge variant="info" size="sm" className="font-medium">
            Học sinh
          </Badge>
        )
    }
  }

  return (
    <div className="p-6 overflow-x-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden min-w-[1000px]">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Họ tên</th>
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Vai trò</th>
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Khối lớp</th>
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Ngày hết hạn</th>
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => {
              const statusInfo = getStatusDisplay(user.status);
              const isExpired = Boolean(user.expiresAt && new Date(user.expiresAt).getTime() < now);
              return (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors group relative border-l-2 border-transparent hover:border-primary">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img alt="Avatar" className="w-9 h-9 rounded-full bg-slate-100 object-cover border border-slate-200" src={user.avatar} />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {getAvatarInitial(user.name)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {getRoleBadge(user.role)}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-700">{user.grade || '—'}</td>
                <td className="px-6 py-4 text-sm font-medium text-slate-700">
                  {user.expiresAt ? (
                    <div className="flex items-center gap-1.5">
                      <Calendar className={`w-3.5 h-3.5 ${isExpired ? 'text-rose-500' : 'text-emerald-500'}`} />
                      <span className={isExpired ? 'text-rose-600 font-semibold' : 'text-slate-800'}>
                        {new Date(user.expiresAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs">Chưa kích hoạt</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`flex items-center gap-1.5 text-xs font-semibold ${statusInfo.colorClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`}></span>
                    {statusInfo.label}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {isAdmin && onUpdateRole && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" 
                        title="Phân quyền (Teacher / Affiliate)"
                        onClick={() => handleOpenRoleModal(user)}
                      >
                        <UserCog className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-100" 
                      title="Khóa tài khoản"
                      onClick={() => handleDelete(user.id, user.name)}
                    >
                      <LockKeyhole className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {/* Role Management Modal */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Phân quyền người dùng</h3>
                <p className="text-xs text-slate-500 mt-0.5">Cập nhật quyền cho {roleModalUser.name}</p>
              </div>
              <button 
                onClick={() => setRoleModalUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <label 
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${selectedRole === 'teacher' ? 'border-purple-500 bg-purple-50/40 ring-1 ring-purple-500' : 'border-slate-200 hover:bg-slate-50'}`}
              >
                <input 
                  type="radio" 
                  name="userRole" 
                  value="teacher" 
                  checked={selectedRole === 'teacher'} 
                  onChange={(e) => setSelectedRole(e.target.value)} 
                  className="mt-1 text-purple-600 focus:ring-purple-500" 
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 text-sm">Giáo viên (Teacher)</span>
                    <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-purple-100 text-purple-700">Hoa hồng 50%</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Có quyền biên soạn câu hỏi, tạo đề thi, bài giảng. Hưởng 50% hoa hồng khi học sinh dùng mã voucher.
                  </p>
                </div>
              </label>

              <label 
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${selectedRole === 'affiliate' ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500' : 'border-slate-200 hover:bg-slate-50'}`}
              >
                <input 
                  type="radio" 
                  name="userRole" 
                  value="affiliate" 
                  checked={selectedRole === 'affiliate'} 
                  onChange={(e) => setSelectedRole(e.target.value)} 
                  className="mt-1 text-amber-600 focus:ring-amber-500" 
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 text-sm">Affiliate (Cộng tác viên)</span>
                    <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-amber-100 text-amber-700">Hoa hồng 30%</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Vai trò giới thiệu học sinh và hưởng 30% hoa hồng khi học sinh đăng ký hoặc nâng cấp.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 p-4 bg-slate-50 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setRoleModalUser(null)}>
                Hủy
              </Button>
              <Button size="sm" onClick={handleConfirmRoleChange}>
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
