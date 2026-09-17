'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import QuestionCard from '@/components/questions/QuestionCard';
import ContentQuestion from '@/components/questions/ContentQuestion';
import QuestionSkeleton from '@/components/questions/QuestionSkeleton';
import FloatingActionBar from '@/components/questions/FloatingActionBar';
import { Pagination } from '@/components/ui/Pagination';
import { ChevronRight, Search, Plus } from 'lucide-react';
import Link from 'next/link';
import { getQuestions, deleteQuestion } from '@/lib/api';
import { Question } from '@/types/question';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
export default function QuestionsPage() {
  return (
    <Suspense fallback={<div className="p-8">Đang tải dữ liệu...</div>}>
      <QuestionsPageContent />
    </Suspense>
  );
}

function QuestionsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isFiltering, setIsFiltering] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalVisible, setTotalVisible] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const loadQuestions = async () => {
    setIsFiltering(true);
    try {
      const page = parseInt(searchParams.get('page') || '1');
      const currentGrade = searchParams.get('grade') || undefined;
      const currentTopic = searchParams.get('topic') || undefined;

      const currentType = searchParams.get('type') || undefined;
      const currentDiff = searchParams.get('difficulty') || undefined;
      const q = searchParams.get('q') || undefined;

      const response = await getQuestions(page, 10, {
        grade: currentGrade,
        topic: currentTopic,

        type: currentType,
        difficulty: currentDiff,
        q: q
      });

      setQuestions(response.data || []);
      setTotalVisible(response.total || 0);
    } catch (error) {
      console.error("Failed to load questions:", error);
      setQuestions([]);
      setTotalVisible(0);
    } finally {
        setIsFiltering(false);
      }
  };

  useEffect(() => {
    loadQuestions();
  }, [searchParams]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const success = await deleteQuestion(deleteId);
    if (success) {
      loadQuestions();
    }
    setDeleteId(null);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const clearSelection = () => setSelectedIds([]);

  const handleSelectAllOnPage = () => {
    const pageIds = questions.map(q => q.id);
    setSelectedIds(prev => {
      const newIds = new Set(prev);
      pageIds.forEach(id => newIds.add(id));
      return Array.from(newIds);
    });
  };

  const swapFrom = searchParams.get('swapFrom');
  const qidsParam = searchParams.get('qids');
  const examIdParam = searchParams.get('id');

  const handleSelectReplacement = (newQuestionId: string) => {
    const currentQids = qidsParam ? qidsParam.split(',').filter(Boolean) : [];
    let updatedQids: string[];
    if (swapFrom && currentQids.includes(swapFrom)) {
      updatedQids = currentQids.map(qid => qid === swapFrom ? newQuestionId : qid);
    } else {
      updatedQids = [...currentQids, newQuestionId];
    }

    const params = new URLSearchParams();
    if (updatedQids.length > 0) {
      params.set('qids', updatedQids.join(','));
    }
    if (examIdParam) {
      params.set('id', examIdParam);
    }
    router.push(`/dashboard/exams/create?${params.toString()}`);
  };

  const handleCancelSwap = () => {
    const params = new URLSearchParams();
    if (qidsParam) params.set('qids', qidsParam);
    if (examIdParam) params.set('id', examIdParam);
    router.push(`/dashboard/exams/create?${params.toString()}`);
  };

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

          {/* Swap Question Banner */}
          {swapFrom && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-center justify-between gap-4 shadow-sm">
              <div>
                <p className="font-bold text-amber-900 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                  Đang trong chế độ đổi câu hỏi
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Vui lòng chọn 1 câu hỏi từ danh sách bên dưới để thay thế cho câu hỏi đang có ID: <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-bold">{swapFrom}</code>
                </p>
              </div>
              <button 
                onClick={handleCancelSwap}
                className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold text-xs rounded-lg transition-colors whitespace-nowrap"
              >
                Hủy đổi câu hỏi
              </button>
            </div>
          )}

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
                {questions.map((q) => {
                  const isCurrentInExam = qidsParam?.split(',').includes(q.id || '');
                  return (
                    <QuestionCard 
                      key={q.id}
                      id={q.id || ""}
                      isSelected={selectedIds.includes(q.id || "")}
                      onToggle={() => {
                        if (!q.id) return;
                        setSelectedIds(prev => 
                          prev.includes(q.id!) 
                            ? prev.filter(id => id !== q.id)
                            : [...prev, q.id!]
                        )
                      }}
                      onEdit={() => router.push(`/dashboard/questions/create?id=${q.id}`)}
                      onDelete={() => setDeleteId(q.id || null)}
                      grade={Number(q.grade) || (q.type_question === 'group' && q.subQuestions?.[0]?.grade ? Number(q.subQuestions[0].grade) : 0)}
                      topic={q.topic || (q.type_question === 'group' && q.subQuestions?.[0]?.topic) || ''}
                      difficulty={q.difficulty_level || (q.type_question === 'group' && q.subQuestions?.[0]?.difficulty_level) || ''}
                      typeQuestion={q.type_question}
                      type={q.type || (q.type_question === 'group' && q.subQuestions?.[0]?.type) || ''}
                    >
                      {swapFrom && (
                        <div className="mb-4 pb-3 border-b border-slate-100 flex justify-end">
                          <button
                            onClick={() => q.id && handleSelectReplacement(q.id)}
                            disabled={isCurrentInExam}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm ${
                              isCurrentInExam
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                            }`}
                          >
                            {isCurrentInExam ? 'Đã có trong đề thi này' : '✓ Chọn câu hỏi này để thay thế'}
                          </button>
                        </div>
                      )}
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
                  );
                })}
            
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
              onPageChange={(page) => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('page', page.toString());
                router.push(`?${params.toString()}`, { scroll: true });
              }}
            />
          </div>
        )}
        </div>

      {/* Floating Action Bar */}
      <FloatingActionBar 
        selectedIds={selectedIds} 
        onClose={clearSelection} 
        onSelectAll={questions.length > 0 ? handleSelectAllOnPage : undefined}
      />

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xóa câu hỏi"
        description="Bạn có chắc chắn muốn xóa câu hỏi này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        isDestructive={true}
      />
    </>
  );
}
