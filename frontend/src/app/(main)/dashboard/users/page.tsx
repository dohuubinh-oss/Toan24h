'use client'

import React, { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import UserHeader from '@/components/users/UserHeader'
import UserTable, { User } from '@/components/users/UserTable'
import { toast } from '@/components/ui/ToastProvider'
import { Pagination } from '@/components/ui/Pagination'
import { apiFetch } from '@/lib/api'

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

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (q) queryParams.append('q', q);
      if (role) queryParams.append('role', role);
      
      const res = await apiFetch(`/users?${queryParams.toString()}`);
      
      const apiUsers = (Array.isArray(res) ? res : []).map((u: any) => ({
        id: u.id,
        name: u.fullName,
        email: u.email,
        role: u.role,
        grade: u.grade,
        joinDate: new Date(u.createdAt).toLocaleDateString('vi-VN'),
        status: u.status,
        expiresAt: u.expiresAt
      }));
      setUsers(apiUsers);
    } catch (err: any) {
      toast.error('Lỗi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, [q, role]);

  const handleSoftDelete = async (id: string, name: string) => {
    try {
      await apiFetch(`/users/${id}/status`, { 
        method: 'PUT',
        body: JSON.stringify({ status: 'locked' })
      });
      toast.success(`Đã khóa tài khoản ${name}`);
      fetchUsers();
    } catch (err: any) {
      toast.error(`Lỗi khóa tài khoản: ${err.message}`);
    }
  }

  const handleRecharge = async (id: string, name: string, months: number) => {
    try {
      await apiFetch(`/users/${id}/recharge`, {
        method: 'POST',
        body: JSON.stringify({ months })
      });
      toast.success(`Đã gia hạn thêm ${months} tháng cho ${name}`);
      fetchUsers();
    } catch (err: any) {
      toast.error(`Lỗi nạp tiền: ${err.message}`);
    }
  }

  // Paginate locally for now (can be moved to server-side if needed)
  const itemsPerPage = 10
  const totalItems = users.length
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const paginatedUsers = users.slice(startIndex, endIndex)

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto relative pb-20">
      <UserHeader totalUsers={totalItems} />
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>
        ) : (
          <UserTable users={paginatedUsers} onSoftDelete={handleSoftDelete} onRecharge={handleRecharge} />
        )}
        
        {!loading && totalItems > 0 && (
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
