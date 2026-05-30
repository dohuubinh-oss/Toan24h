import React from 'react';
import { Card } from '../ui/Card';

export default function QuestionSkeleton() {
  return (
    <Card className="animate-pulse">
      <div className="p-4 sm:p-5">
        {/* Header Skeleton */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-slate-200 rounded shrink-0"></div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-16 h-6 bg-slate-200 rounded-full"></div>
              <div className="w-20 h-6 bg-slate-200 rounded-full"></div>
              <div className="w-24 h-6 bg-slate-200 rounded-full"></div>
              <div className="w-14 h-6 bg-slate-200 rounded-full"></div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
            <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="pl-7 mt-4 space-y-3">
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-5/6"></div>
          <div className="h-4 bg-slate-200 rounded w-4/6"></div>
        </div>

        {/* Options Skeleton (if multiple choice) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7 mt-6">
          <div className="h-12 bg-slate-200 rounded-xl"></div>
          <div className="h-12 bg-slate-200 rounded-xl"></div>
          <div className="h-12 bg-slate-200 rounded-xl"></div>
          <div className="h-12 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    </Card>
  );
}
