'use client'

import React, { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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
  const router = useRouter()
  const q = searchParams.get('q') || ''
  const role = searchParams.get('role') || ''
  const pageParam = searchParams.get('page') || '1'
  const currentPage = parseInt(pageParam, 10) || 1

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )userRole=([^;]*)/);
    const userRole = match ? decodeURIComponent(match[1]) : null;
    if (userRole === 'admin') {
      setIsAdmin(true);
    } else {
      router.replace('/dashboard/questions');
    }
  }, [router]);

  const fetchUsers = async () => {
    const match = document.cookie.match(/(?:^|; )userRole=([^;]*)/);
    const userRole = match ? decodeURIComponent(match[1]) : null;
    if (userRole !== 'admin') {
      setLoading(false);
      router.replace('/dashboard/questions');
      return;
    }

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

  const handleUpdateRole = async (id: string, name: string, newRole: string) => {
    const match = document.cookie.match(/(?:^|; )userRole=([^;]*)/);
    const currentRole = match ? decodeURIComponent(match[1]) : null;
    if (currentRole !== 'admin') {
      toast.error('Chỉ Admin mới có quyền thay đổi vai trò người dùng');
      return;
    }

    try {
      await apiFetch(`/users/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });
      const roleMap: Record<string, string> = {
        teacher: 'Giáo viên',
        affiliate: 'Affiliate',
        student: 'Học sinh',
        admin: 'Admin'
      };
      toast.success(`Đã cập nhật vai trò của ${name} thành ${roleMap[newRole] || newRole}`);
      fetchUsers();
    } catch (err: any) {
      toast.error(`Lỗi cập nhật vai trò: ${err.message}`);
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
          <UserTable 
            users={paginatedUsers} 
            onSoftDelete={handleSoftDelete}
            isAdmin={isAdmin}
            onUpdateRole={handleUpdateRole}
          />
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
              onPageChange={(page) => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('page', page.toString());
                router.push(`?${params.toString()}`, { scroll: true });
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
