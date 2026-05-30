'use client'

import React from 'react'
import { LockKeyhole, Edit2, Trash2, Users } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

export type User = {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
  role: string;
  grade: string;
  joinDate: string;
  status: string;
}

interface UserTableProps {
  users: User[];
  onSoftDelete: (id: number, name: string) => void;
}

export default function UserTable({ users, onSoftDelete }: UserTableProps) {
  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Hành động này sẽ khóa tài khoản của người dùng. Bạn có chắc chắn muốn xóa (khóa) người dùng ${name}?`)) {
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

  return (
    <div className="p-6 overflow-x-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden min-w-[1000px]">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Họ tên</th>
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Vai trò</th>
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Khối lớp</th>
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Ngày tham gia</th>
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
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
                    variant={user.role === 'Học sinh' ? 'info' : user.role === 'Admin' ? 'default' : 'default'}
                    className={user.role === 'Giáo viên' ? 'bg-purple-50 text-purple-600 border border-purple-200' : ''}
                    size="sm"
                  >
                    {user.role}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-700">{user.grade}</td>
                <td className="px-6 py-4 text-sm font-medium text-slate-700">{user.joinDate}</td>
                <td className="px-6 py-4">
                  <span className={`flex items-center gap-1.5 text-xs font-semibold ${user.status === 'Hoạt động' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Hoạt động' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-100" 
                      title="Xóa"
                      onClick={() => handleDelete(user.id, user.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
