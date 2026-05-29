import React from 'react'
import UserFilters from '../../../components/users/UserFilters'
import UserHeader from '../../../components/users/UserHeader'
import UserTable from '../../../components/users/UserTable'
import UserPagination from '../../../components/users/UserPagination'
import { HelpCircle } from 'lucide-react'

export default function UsersPage() {
  return (
    <div className="flex h-full min-h-screen bg-slate-50">
      {/* Sidebar Filter Panel */}
      <aside className="w-72 bg-white border-r border-slate-200 h-[calc(100vh-theme(spacing.16))] sticky top-0 flex flex-col overflow-y-auto hidden lg:flex">
        <div className="p-6 flex-grow">
          <UserFilters />
        </div>
        <div className="p-6 border-t border-slate-100 mt-auto">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Admin" className="w-10 h-10 rounded-full border-2 border-primary/20" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSiY2O7iKTG4l6tuD0WodQE7yILfQSD4w8d3XKe9gSHiW3aEurQAHbNAMKyLKNQYlXq5LpNRzzPXq7ngamHaJ0mGqITxdNVpFcweVeqLU2MZ-GMoi7jEh6K_Y0B4_c1Gnel9UPZ8RbSer2pQeEMNBqzGewaLA66kbXuLp_ZtSN0fLXzOhcH6UnzyhH5YwZnoBB6vly-sZVr0aI3dmbvbLIhgjk9mUrqhTPcALFp1snZxU2OdC3pWkv2y2twlWIC5q2NCl6L-TUmKqm" />
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate text-slate-900">Admin MathEd</p>
              <p className="text-xs text-slate-500 truncate">admin@mathed.vn</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-[calc(100vh-theme(spacing.16))] overflow-y-auto">
        <UserHeader />
        <div className="flex-1 flex flex-col">
          <UserTable />
          <UserPagination />
        </div>

        {/* Feedback & Help */}
        <div className="mt-auto p-6 flex justify-end">
          <button className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">
            <HelpCircle className="w-5 h-5" />
            Hỗ trợ kỹ thuật
          </button>
        </div>
      </main>
    </div>
  )
}
