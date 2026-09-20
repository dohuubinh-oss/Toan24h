'use client'

import React from 'react'
import { LockKeyhole, Users, Calendar } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

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
}

export default function UserTable({ users, onSoftDelete }: UserTableProps) {
  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Hành động này sẽ khóa tài khoản của người dùng. Bạn có chắc chắn muốn khóa người dùng ${name}?`)) {
      onSoftDelete(id, name);
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
              const isExpired = user.expiresAt && new Date(user.expiresAt).getTime() < Date.now();

              return (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors group relative border-l-2 border-transparent hover:border-primary">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img alt="Avatar" className="w-9 h-9 rounded-full bg-slate-100 object-cover border border-slate-200" src={user.avatar} />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                        <Users className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge 
                    variant={user.role === 'student' ? 'info' : user.role === 'admin' ? 'default' : 'default'}
                    className={user.role === 'teacher' ? 'bg-purple-50 text-purple-600 border border-purple-200' : ''}
                    size="sm"
                  >
                    {user.role === 'student' ? 'Học sinh' : user.role === 'teacher' ? 'Giáo viên' : 'Admin'}
                  </Badge>
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
                  <div className="flex items-center justify-end gap-2">
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
    </div>
  )
}
