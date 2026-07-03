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
  const [isFiltering, setIsFiltering] = useState(false);

  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => {
      setIsFiltering(false);
    }, 400); // Giả lập độ trễ API 400ms
    return () => clearTimeout(timer);
  }, [searchParams]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const clearSelection = () => setSelectedIds([]);

  const currentGrade = searchParams.get('grade');
  const currentType = searchParams.get('type');
  const currentDiff = searchParams.get('difficulty');
  const q = searchParams.get('q') || '';
  
  const matchQ1 = !q || "Giải tích".toLowerCase().includes(q.toLowerCase()) || "Cho hàm số".toLowerCase().includes(q.toLowerCase());
  const showCard1 = (!currentGrade || currentGrade === 'Lớp 9') && 
                    (!currentType || currentType === 'Trắc nghiệm') && 
                    (!currentDiff || currentDiff === 'Thông hiểu') &&
                    matchQ1;
                    
  const matchQ2 = !q || "Chuyển động đều".toLowerCase().includes(q.toLowerCase()) || "Một người đi xe máy".toLowerCase().includes(q.toLowerCase());
  const showCard2 = (!currentGrade || currentGrade === 'Lớp 5') && 
                    (!currentType || currentType === 'Câu hỏi chùm') && 
                    (!currentDiff || currentDiff === 'Thông hiểu') &&
                    matchQ2;
                    
  const matchQ3 = !q || "Đại số".toLowerCase().includes(q.toLowerCase()) || "bất phương trình".toLowerCase().includes(q.toLowerCase());
  const showCard3 = (!currentGrade || currentGrade === 'Lớp 7') && 
                    (!currentType || currentType === 'Tự luận') && 
                    (!currentDiff || currentDiff === 'Nhận biết') &&
                    matchQ3;

  const totalVisible = [showCard1, showCard2, showCard3].filter(Boolean).length;

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
                {showCard1 && (
              <QuestionCard 
                id="Q-7721"
                isSelected={selectedIds.includes("Q-7721")}
                onToggle={() => toggleSelection("Q-7721")}
                grade={9}
                topic="Giải tích"
                difficulty="Thông hiểu"
              >
                <ContentQuestion 
                  content="Cho hàm số $f(x) = \frac{x^2 - 4}{x - 2}$. Tính giá trị của giới hạn $\lim_{x \to 2} f(x)$."
                  options={[
                    "$\\lim_{x \\to 2} f(x) = 0$",
                    "$\\lim_{x \\to 2} f(x) = 4$",
                    "$\\lim_{x \\to 2} f(x) = 2$",
                    "Giới hạn không tồn tại"
                  ]}
                  correctAnswer="B"
                  solution="Chữ số 1 nằm ở hàng phần trăm nên có giá trị là 1/100."
                />
              </QuestionCard>
            )}

            {showCard2 && (
              <QuestionCard 
                id="Q-CLUSTER-81"
                isSelected={selectedIds.includes("Q-CLUSTER-81")}
                onToggle={() => toggleSelection("Q-CLUSTER-81")}
                grade={5}
                topic="Chuyển động đều"
                difficulty="Thông hiểu"
              >
                <ContentQuestion
                  sharedContext="Một người đi xe máy từ A đến B với vận tốc 40 km/giờ. Cùng lúc đó, một người đi xe đạp từ B về A với vận tốc 15 km/giờ. Quãng đường AB dài 110 km."
                  subQuestions={[
                    {
                      content: "Tổng vận tốc của hai người là bao nhiêu?",
                      options: ["55 km/giờ", "25 km/giờ", "40 km/giờ", "15 km/giờ"],
                      correctAnswer: "A",
                      solution: "Tổng vận tốc = v1 + v2 = 40 + 15 = 55 (km/giờ)"
                    },
                    {
                      content: "Sau bao lâu thì hai người gặp nhau?",
                      options: ["2 giờ", "2,5 giờ", "3 giờ", "1,5 giờ"],
                      correctAnswer: "A",
                      solution: "Thời gian gặp nhau = Quãng đường / Tổng vận tốc = 110 / 55 = 2 (giờ)"
                    },
                    {
                      content: "Tính quãng đường người đi xe máy đã đi được cho đến lúc gặp.",
                      solution: "Quãng đường = Vận tốc × Thời gian = 40 × 2 = 80 (km)",
                      isEssay: true
                    }
                  ]}
                />
              </QuestionCard>
            )}

            {showCard3 && (
              <QuestionCard 
                id="Q-4491"
                isSelected={selectedIds.includes("Q-4491")}
                onToggle={() => toggleSelection("Q-4491")}
                grade={7}
                topic="Đại số"
                difficulty="Nhận biết"
              >
                <ContentQuestion
                  content="Giải bất phương trình: $x^2 - 5x + 6 > 0$"
                  solution="Ta có $x^2 - 5x + 6 = (x-2)(x-3)$. Để tích dương thì $x < 2$ hoặc $x > 3$."
                  isEssay={true}
                />
              </QuestionCard>
            )}
            
            {(!showCard1 && !showCard2 && !showCard3) && (
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
              currentPage={1} 
              totalPages={Math.ceil(totalVisible / 10) || 1} 
              totalItems={totalVisible} 
              startIndex={totalVisible > 0 ? 1 : 0} 
              endIndex={Math.min(10, totalVisible)} 
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
