'use client'

import React, { useEffect, useState } from 'react'
import { AlertCircle, Clock } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'

export default function SubscriptionBanner({ hideVisuals = false }: { hideVisuals?: boolean }) {
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'student' && user.expiresAt) {
          const expiresDate = new Date(user.expiresAt);
          const now = new Date();
          const diffTime = expiresDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 0) {
            setIsExpired(true);
            setDaysRemaining(0);
          } else if (diffDays <= 3) {
            setDaysRemaining(diffDays);
            setIsExpired(false);
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse user for subscription banner', e);
    }
  }, [pathname]); // Re-check on navigation

  useEffect(() => {
    // Redirect if expired and trying to access any route other than /student
    if (isExpired && pathname !== '/student') {
      router.push('/student');
    }
  }, [isExpired, pathname, router]);

  if (isExpired && !hideVisuals) {
    return (
      <div className="bg-rose-50 border-b border-rose-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-rose-700 text-sm font-medium">
          <AlertCircle className="w-4 h-4" />
          <span>Tài khoản của bạn đã hết hạn. Vui lòng nạp tiền để tiếp tục sử dụng các tính năng học tập và thi nghiệm.</span>
        </div>
      </div>
    );
  }

  if (!hideVisuals && daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 3) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-amber-700 text-sm font-medium">
          <Clock className="w-4 h-4" />
          <span>Tài khoản của bạn sẽ hết hạn sau {daysRemaining} ngày nữa. Vui lòng nạp tiền để không bị gián đoạn học tập.</span>
        </div>
      </div>
    );
  }

  return null;
}
