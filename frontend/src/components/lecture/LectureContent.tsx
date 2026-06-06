import React from 'react'
import { BookOpen, Microscope, Presentation, Megaphone, TriangleAlert, Zap, Lightbulb } from 'lucide-react'

interface LectureContentProps {
  hideConceptExplanation?: boolean;
}

export default function LectureContent({ hideConceptExplanation = false }: LectureContentProps) {
  return (
    <div className="space-y-8">
      {/* Concept Explanation */}
      {!hideConceptExplanation && (
        <section className="card-premium">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="text-primary" size={32} />
            <h2 className="text-xl font-bold">1. Giải thích khái niệm</h2>
          </div>
          <div className="prose max-w-none space-y-4 leading-relaxed">
            <p>Thể tích của một khối chóp bất kỳ bằng một phần ba tích của diện tích mặt đáy và chiều cao tương ứng của nó. Đây là nền tảng quan trọng trong hình học không gian.</p>
            <div className="bg-primary/5 border-l-4 border-primary p-6 rounded-r-lg my-6">
              <p className="text-lg font-medium text-center latex-font">
                V = <span className="inline-block px-1">1</span>/<span className="inline-block px-1">3</span> . B . h
              </p>
              <p className="text-sm text-slate-500 mt-4 italic text-center">Trong đó: B là diện tích đáy, h là chiều cao khối chóp.</p>
            </div>
            <p>Đối với khối chóp đều, việc tính toán trở nên đơn giản hơn nhờ các tính chất đối xứng, trong đó hình chiếu của đỉnh trùng với tâm của đa giác đáy.</p>
          </div>
        </section>
      )}

      {/* Exercise Analysis */}
      <section className="card-premium">
        <div className="flex items-center gap-3 mb-6">
          <Microscope className="text-primary" size={32} />
          <h2 className="text-xl font-bold">2. Phân tích bài tập mẫu</h2>
        </div>
        
        <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 mb-6">
          <p className="font-bold mb-2">Đề bài:</p>
          <p className="italic">Cho khối chóp S.ABC có đáy ABC là tam giác đều cạnh a. Cạnh bên SA vuông góc với đáy và SA = a√3. Tính thể tích khối chóp S.ABC.</p>
        </div>

        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-none flex flex-col items-center">
              <div className="size-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">1</div>
              <div className="w-0.5 h-full bg-slate-200 my-1"></div>
            </div>
            <div className="pb-6">
              <h4 className="font-bold text-ink">Tính diện tích đáy B (Tam giác ABC)</h4>
              <p className="text-slate-600 mt-1">Vì ABC là tam giác đều cạnh a nên diện tích đáy được tính theo công thức:</p>
              <p className="mt-2 latex-font text-primary font-bold">B = S<sub>ABC</sub> = (a²√3) / 4</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-none flex flex-col items-center">
              <div className="size-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">2</div>
              <div className="w-0.5 h-full bg-slate-200 my-1"></div>
            </div>
            <div className="pb-6">
              <h4 className="font-bold text-ink">Xác định chiều cao h</h4>
              <p className="text-slate-600 mt-1">Theo giả thiết SA ⊥ (ABC), suy ra chiều cao h = SA = a√3.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-none flex flex-col items-center">
              <div className="size-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">3</div>
            </div>
            <div>
              <h4 className="font-bold text-ink">Áp dụng công thức tính thể tích</h4>
              <p className="text-slate-600 mt-1">V = 1/3 . B . h = 1/3 . (a²√3 / 4) . a√3 = a³/4.</p>
              <p className="mt-3 font-bold text-green-600">Kết luận: Thể tích khối chóp là a³/4.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Graphic Illustration */}
      <section className="card-premium">
        <div className="flex items-center gap-3 mb-6">
          <Presentation className="text-primary" size={32} />
          <h2 className="text-xl font-bold">3. Ví dụ minh họa hình vẽ</h2>
        </div>
        <div className="aspect-video w-full rounded-xl bg-slate-100 overflow-hidden border border-slate-200 flex flex-col items-center justify-center group relative">
          <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-200 relative flex items-center justify-center">
            <div className="text-center space-y-4">
              <Presentation className="mx-auto text-slate-300" size={64} />
              <p className="text-slate-400 text-sm font-medium italic">Sơ đồ khối chóp S.ABC trong không gian 3D</p>
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 flex-col gap-2">
              <button className="bg-white/90 px-4 py-2 rounded-lg text-xs font-bold shadow-sm flex items-center gap-2 text-ink">
                Phóng to hình vẽ
              </button>
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-500 mt-4 text-center">Hình 1.1: Mô tả trực quan khối chóp có cạnh bên vuông góc với đáy.</p>
      </section>

      {/* Teacher's Notes Section */}
      <section className="bg-blue-50/50 p-6 md:p-8 rounded-2xl border-2 border-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 text-primary/10 select-none">
          <Megaphone size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <Megaphone className="text-primary" size={32} />
            <h2 className="text-2xl font-black text-ink uppercase tracking-tight">DẶN DÒ CỦA GIÁO VIÊN</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl border border-primary/10 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-red-500">
                <TriangleAlert size={20} />
                <h3 className="font-bold">Lưu ý khi làm bài</h3>
              </div>
              <ul className="text-sm space-y-2 text-slate-600 list-disc pl-4">
                <li>Cẩn thận nhầm lẫn giữa công thức diện tích và thể tích.</li>
                <li>Quên nhân hệ số 1/3 là lỗi phổ biến nhất.</li>
              </ul>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-primary/10 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-amber-500">
                <Zap size={20} />
                <h3 className="font-bold">Kinh nghiệm thi</h3>
              </div>
              <ul className="text-sm space-y-2 text-slate-600 list-disc pl-4">
                <li>Sử dụng phương pháp loại trừ cho các bài trắc nghiệm.</li>
                <li>Học thuộc các bộ số diện tích đặc biệt để tính nhanh.</li>
              </ul>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-primary/10 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-primary">
                <Lightbulb size={20} />
                <h3 className="font-bold">Lời khuyên học tập</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed italic">
                &quot;Toán học không chỉ là công thức, hãy cố gắng hình dung khối hình trong đầu để không bị phụ thuộc vào đề bài.&quot;
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
