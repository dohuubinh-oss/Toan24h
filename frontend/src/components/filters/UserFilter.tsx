'use client'

import React from 'react';
import { ChevronDown, Users } from 'lucide-react';
import { FilterWrapper } from './FilterWrapper';
import { useSidebarFilter } from '@/hooks/useSidebarFilter';

export function UserFilter() {
  const { currentRole, setFilter } = useSidebarFilter();
  const roles = [
    { label: 'Học sinh', value: 'student' },
    { label: 'Giáo viên', value: 'teacher' },
    { label: 'Affiliate', value: 'affiliate' },
  ];

  return (
    <FilterWrapper searchPlaceholder="Tìm kiếm theo tên, email...">
      <details className="group px-3" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold py-1 hover:text-primary transition-colors list-none">
          <div className="flex items-center gap-2 text-slate-700">
            <Users className="w-5 h-5" />
            <span>Vai trò</span>
          </div>
          <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
        </summary>
        <div className="mt-3 space-y-2 pl-6">
          {roles.map(role => (
            <label key={role.value} className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 cursor-pointer hover:text-primary transition-colors py-1">
              <input 
                className="text-primary focus:ring-primary h-4 w-4 cursor-pointer" 
                type="radio" 
                name="filter_role"
                checked={currentRole === role.value}
                onChange={() => setFilter('role', role.value)}
                onClick={() => {
                  if (currentRole === role.value) {
                    setFilter('role', role.value);
                  }
                }}
              /> {role.label}
            </label>
          ))}
        </div>
      </details>
    </FilterWrapper>
  );
}
