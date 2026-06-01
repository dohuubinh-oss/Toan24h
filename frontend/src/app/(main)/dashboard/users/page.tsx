'use client'

import React, { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import UserHeader from '@/components/users/UserHeader'
import UserTable, { User } from '@/components/users/UserTable'
import { Pagination } from '@/components/ui/Pagination'

const INITIAL_MOCK_USERS: User[] = [
  {
    id: 1,
    name: 'Nguyễn Văn An',
    email: 'an.nguyen@student.edu.vn',
    avatar: null, // Test default avatar
    role: 'Học sinh',
    grade: 'Lớp 6',
    joinDate: '12/05/2023',
    status: 'Hoạt động'
  },
  {
    id: 2,
    name: 'Trần Thị Bình',
    email: 'binh.tt@mathed.vn',
    avatar: 'https://ui-avatars.com/api/?name=Trần+Thị+Bình&background=fce7f3&color=db2777',
    role: 'Giáo viên',
    grade: 'Lớp 9',
    joinDate: '02/01/2023',
    status: 'Hoạt động'
  },
  {
    id: 3,
    name: 'Lê Công Danh',
    email: 'danh.lc@student.edu.vn',
    avatar: null, // Test default avatar
    role: 'Học sinh',
    grade: 'Chuyển cấp',
    joinDate: '15/08/2023',
    status: 'Bị khóa'
  },
  {
    id: 4,
    name: 'Phạm Minh Đức',
    email: 'duc.pm@mathed.vn',
    avatar: 'https://ui-avatars.com/api/?name=Phạm+Minh+Đức&background=dcfce7&color=15803d',
    role: 'Admin',
    grade: '—',
    joinDate: '20/12/2022',
    status: 'Hoạt động'
  }
];

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="p-8">Đang tải dữ liệu...</div>}>
      <UsersPageContent />
    </Suspense>
  )
}

function UsersPageContent() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ''
  const role = searchParams.get('role') || ''
  const pageParam = searchParams.get('page') || '1'
  const currentPage = parseInt(pageParam, 10) || 1

  const [users, setUsers] = useState<User[]>(INITIAL_MOCK_USERS)

  const handleSoftDelete = (id: number, name: string) => {
    // API Call simulation
    setUsers(prevUsers => 
      prevUsers.map(u => u.id === id ? { ...u, status: 'Bị khóa' } : u)
    );
    alert(`Đã khóa tài khoản người dùng ${name} thành công!`);
  }
  
  // Filter
  const filteredUsers = users.filter(user => {
    const matchQ = !q || user.name.toLowerCase().includes(q.toLowerCase()) || user.email.toLowerCase().includes(q.toLowerCase())
    const matchRole = !role || user.role === role
    return matchQ && matchRole
  })

  // Paginate
  const itemsPerPage = 10
  const totalItems = filteredUsers.length
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto relative pb-20">
      <UserHeader totalUsers={totalItems} />
      <div className="space-y-4">
        <UserTable users={paginatedUsers} onSoftDelete={handleSoftDelete} />
        
        {totalItems > 0 && (
          <div className="pt-0">
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              totalItems={totalItems} 
              startIndex={startIndex + 1} 
              endIndex={endIndex}
              itemName="người dùng" 
            />
          </div>
        )}
      </div>
    </div>
  )
}
