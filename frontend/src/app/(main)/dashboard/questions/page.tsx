'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import QuestionCard from '@/components/questions/QuestionCard';
import ContentQuestion from '@/components/questions/ContentQuestion';
import QuestionSkeleton from '@/components/questions/QuestionSkeleton';
import FloatingActionBar from '@/components/questions/FloatingActionBar';
import { Pagination } from '@/components/ui/Pagination';
import { ChevronRight, Search, Plus } from 'lucide-react';
import Link from 'next/link';
import { getQuestions } from '@/lib/api';
import { Question } from '@/types/question';
export default function QuestionsPage() {
  return (
    <Suspense fallback={<div className="p-8">Đang tải dữ liệu...</div>}>
      <QuestionsPageContent />
    </Suspense>
  );
}

function QuestionsPageContent() {
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isFiltering, setIsFiltering] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalVisible, setTotalVisible] = useState(0);

  useEffect(() => {
    async function loadQuestions() {
      setIsFiltering(true);
      try {
        const page = parseInt(searchParams.get('page') || '1');
        const response = await getQuestions(page, 10);
        
        // Cần lọc theo filter ở Frontend hoặc truyền xuống Backend.
        // Tạm thời hiển thị kết quả trả về từ Backend.
        let filtered = response.data;
        const currentGrade = searchParams.get('grade');
        const currentType = searchParams.get('type');
        const currentDiff = searchParams.get('difficulty');
        const q = searchParams.get('q') || '';

        if (currentGrade) {
          filtered = filtered.filter(q => q.grade?.toString() === currentGrade.replace(/\D/g, ''));
        }
        if (currentType) {
          filtered = filtered.filter(q => {
            if (currentType === 'Câu hỏi chùm') return q.type_question === 'group';
            if (currentType === 'Câu đơn') return q.type_question === 'single';
            
            if (q.type_question === 'group' && q.subQuestions) {
              return q.subQuestions.some((sub: any) => sub.type === currentType);
            }
            return q.type === currentType;
          });
        }
        if (currentDiff) {
          filtered = filtered.filter(q => q.difficulty_level === currentDiff);
        }
        if (q) {
          filtered = filtered.filter(item => item.content.toLowerCase().includes(q.toLowerCase()));
        }

        setQuestions(filtered);
        setTotalVisible(response.total);
      } catch (error) {
        console.error("Failed to load questions:", error);
        setQuestions([]);
        setTotalVisible(0);
      } finally {
        setIsFiltering(false);
      }
    }

    loadQuestions();
  }, [searchParams]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const clearSelection = () => setSelectedIds([]);

  return (
    <>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto relative pb-20">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                <span className="hover:text-primary cursor-pointer transition-colors">Trang chủ</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-primary font-bold">Ngân hàng câu hỏi</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Danh sách Câu hỏi <span className="text-slate-500 font-normal text-lg">( {totalVisible} câu hỏi )</span></h1>
            </div>
            
            <Link 
              href="/dashboard/questions/create" 
              className="px-4 py-2 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus size={18} />
              Thêm câu hỏi
            </Link>
          </div>

          {/* Question List */}
          <div className="space-y-4">
            {isFiltering ? (
              <>
                <QuestionSkeleton />
                <QuestionSkeleton />
                <QuestionSkeleton />
              </>
            ) : (
              <>
                {questions.map((q) => (
                  <QuestionCard 
                    key={q.id}
                    id={q.id || ""}
                    isSelected={selectedIds.includes(q.id || "")}
                    onToggle={() => toggleSelection(q.id || "")}
                    grade={Number(q.grade) || 0}
                    topic={q.topic}
                    difficulty={q.difficulty_level}
                    typeQuestion={q.type_question}
                    type={q.type}
                  >
                    <ContentQuestion 
                      content={q.type_question === 'single' ? q.content : undefined}
                      sharedContext={q.type_question === 'group' ? q.content : undefined}
                      options={q.options?.length > 0 ? q.options : undefined}
                      correctAnswer={q.correct_answer}
                      solution={q.solution_guide}
                      isEssay={q.type === 'Tự luận'}
                      subQuestions={
                        q.type_question === 'group' && q.subQuestions 
                          ? q.subQuestions.map(sub => ({
                              content: sub.content,
                              options: sub.options?.length > 0 ? sub.options : undefined,
                              correctAnswer: sub.correct_answer,
                              solution: sub.solution_guide,
                              isEssay: sub.type === 'Tự luận'
                            }))
                          : undefined
                      }
                    />
                  </QuestionCard>
                ))}
            
            {questions.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200/60 p-16 flex flex-col items-center justify-center text-slate-500 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-base font-semibold text-slate-700">Không tìm thấy câu hỏi</p>
                <p className="text-sm mt-1">Hãy thử thay đổi bộ lọc hoặc từ khoá tìm kiếm.</p>
              </div>
            )}
          </>
          )}
        </div>

        {/* Pagination */}
        {totalVisible > 0 && (
          <div className="pt-0">
            <Pagination 
              currentPage={parseInt(searchParams.get('page') || '1')} 
              totalPages={Math.ceil(totalVisible / 10) || 1} 
              totalItems={totalVisible} 
              startIndex={(parseInt(searchParams.get('page') || '1') - 1) * 10 + (totalVisible > 0 ? 1 : 0)} 
              endIndex={Math.min(parseInt(searchParams.get('page') || '1') * 10, totalVisible)} 
              itemName="câu hỏi"
            />
          </div>
        )}
        </div>

      {/* Floating Action Bar */}
      <FloatingActionBar selectedIds={selectedIds} onClose={clearSelection} />
    </>
  );
}
