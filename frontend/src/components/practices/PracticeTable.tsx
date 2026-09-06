'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PenTool, CheckCircle2, Clock, HelpCircle, Trophy, AlertCircle, PlayCircle, RotateCcw } from 'lucide-react'
import { Practice } from '@/types/practice'
import { Button } from '../ui/Button'

interface PracticeTableProps {
  practices: Practice[]
}

export default function PracticeTable({ practices }: PracticeTableProps) {
  const router = useRouter()

  useEffect(() => {
    router.refresh();
  }, [router]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tên bài luyện tập</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Số câu hỏi</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Thời gian</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Trạng thái</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Kết quả</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {practices.map(practice => {
              const isCompleted = practice.status === 'COMPLETED';
              
              let scoreColor = 'text-slate-400';
              let scoreBg = 'bg-slate-50';
              let ScoreIcon = CheckCircle2;
              let scoreLabel = 'Chưa có';

              if (isCompleted && practice.score !== undefined) {
                const tenPointScore = (practice.score / practice.questionCount) * 10;
                scoreLabel = `${practice.score}/${practice.questionCount}`;
                
                if (tenPointScore < 5) {
                  scoreColor = 'text-rose-600';
                  scoreBg = 'bg-rose-50';
                  ScoreIcon = AlertCircle;
                } else if (tenPointScore < 6.5) {
                  scoreColor = 'text-amber-600';
                  scoreBg = 'bg-amber-50';
                  ScoreIcon = AlertCircle; // Or another icon
                } else {
                  scoreColor = 'text-emerald-600';
                  scoreBg = 'bg-emerald-50';
                  ScoreIcon = Trophy;
                }
              }

              return (
                <tr 
                  key={practice.id} 
                  onClick={() => router.push(`/exam/${practice.id}/take`)}
                  className="hover:bg-slate-50 transition-colors group relative border-l-2 border-transparent hover:border-primary cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                        <PenTool className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 line-clamp-1 group-hover:text-primary transition-colors">{practice.title}</p>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">Thuộc bài: {practice.lectureName}</p>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-100">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">{practice.questionCount}</span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-100">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">{practice.duration}p</span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full">
                        Đã làm
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded-full">
                        Chưa làm
                      </span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    {isCompleted ? (
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${scoreBg} ${scoreColor} font-bold text-sm`}>
                        <ScoreIcon className="w-4 h-4" />
                        <span>{scoreLabel}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400 italic">--</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant={isCompleted ? "outline" : "primary"}
                      className={`h-9 px-4 text-sm font-semibold rounded-lg flex items-center gap-2 ${
                        !isCompleted ? 'shadow-sm' : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/exam/${practice.id}/take`);
                      }}
                    >
                      {isCompleted ? (
                        <>
                          <RotateCcw className="w-4 h-4" /> Làm lại
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-4 h-4" /> Làm bài
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
              )
            })}
            {practices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <PenTool className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-lg font-bold text-slate-700">Chưa có đề luyện tập nào</p>
                    <p className="text-sm mt-1 max-w-md">Vui lòng quay lại sau hoặc kiểm tra khối lớp khác.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
