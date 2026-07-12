'use client'

import React, { Suspense } from 'react'
import { Pagination } from '../../components/ui/Pagination'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/Card'
import { Icon } from '../../components/ui/Icon'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import { RadioOption } from '../../components/ui/RadioOption'
import QuestionCard from '../../components/questions/QuestionCard'
import ContentQuestion from '../../components/questions/ContentQuestion'
import { QuestionFilter } from '../../components/filters/QuestionFilter'
import { LectureConcept, LectureExamples } from '../../components/lecture/LectureContent'
import LectureHeader from '../../components/lecture/LectureHeader'

const sampleLectureData = {
  title: "Chuyên đề: Thể tích khối chóp và các bài toán thực tế nâng cao",
  grade: "12",
  category: "Hình học",
  createdAt: "2024-05-15T00:00:00Z",
  basicConcept: "<p>Thể tích của một khối chóp bất kỳ bằng một phần ba tích của diện tích mặt đáy và chiều cao tương ứng của nó. Đây là nền tảng quan trọng trong hình học không gian.</p><div class=\"bg-primary/5 border-l-4 border-primary p-6 rounded-r-lg my-6\"><p class=\"text-lg font-medium text-center latex-font\">V = <span class=\"inline-block px-1\">1</span>/<span class=\"inline-block px-1\">3</span> . B . h</p><p class=\"text-sm text-slate-500 mt-4 italic text-center\">Trong đó: B là diện tích đáy, h là chiều cao khối chóp.</p></div><p>Đối với khối chóp đều, việc tính toán trở nên đơn giản hơn nhờ các tính chất đối xứng, trong đó hình chiếu của đỉnh trùng với tâm của đa giác đáy.</p>",
  examples: [
    {
      id: "dt1",
      dangToanName: "Tính thể tích khối chóp",
      methods: [
        {
          id: "m1",
          methodName: "Sử dụng công thức cơ bản",
          methodContent: "Dựa vào công thức V = 1/3 . B . h",
          exercise: {
            problem: "Cho khối chóp S.ABC có đáy ABC là tam giác đều cạnh a. Cạnh bên SA vuông góc với đáy và SA = a√3. Tính thể tích khối chóp S.ABC.",
            conclusion: "Thể tích khối chóp là a³/4.",
            tips: "<ul><li>Cẩn thận nhầm lẫn giữa công thức diện tích và thể tích.</li><li>Quên nhân hệ số 1/3 là lỗi phổ biến nhất.</li></ul>",
            steps: [
              {
                step: 1,
                title: "Tính diện tích đáy B (Tam giác ABC)",
                content: "Vì ABC là tam giác đều cạnh a nên diện tích đáy được tính theo công thức:",
                formula: "B = S_{ABC} = (a^2\\sqrt{3}) / 4"
              },
              {
                step: 2,
                title: "Xác định chiều cao h",
                content: "Theo giả thiết SA ⊥ (ABC), suy ra chiều cao h = SA = a√3.",
                formula: ""
              },
              {
                step: 3,
                title: "Áp dụng công thức tính thể tích",
                content: "V = 1/3 . B . h = 1/3 . (a²√3 / 4) . a√3 = a³/4.",
                formula: ""
              }
            ]
          },
          problemImage: "",
          solutionImage: ""
        }
      ]
    }
  ]
};

export default function UILabPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-5xl mx-auto space-y-16">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">UI Lab</h1>
          <p className="text-slate-500 dark:text-slate-400">Component thư viện cho dự án Toán 24h</p>
        </div>
        
        {/* === 1. BADGE === */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">1. Badge</h2>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Variants</h3>
              <div className="flex flex-wrap gap-4">
                <Badge variant="default">Default</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="error">Error</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="info">Info</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Độ khó (Difficulty)</h3>
              <div className="flex flex-wrap gap-4">
                <Badge variant="diff-nb">Nhận biết</Badge>
                <Badge variant="diff-th">Thông hiểu</Badge>
                <Badge variant="diff-vd">Vận dụng</Badge>
                <Badge variant="diff-vdc">Vận dụng cao</Badge>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Sizes</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Badge size="sm">Small</Badge>
                <Badge size="md">Medium</Badge>
                <Badge size="lg">Large</Badge>
              </div>
            </div>
          </div>
        </section>

        {/* === 2. BUTTON === */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">2. Button</h2>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Variants</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="success">Success</Button>
                <Button variant="warning">Warning</Button>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">States & Sizes</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button size="icon"><Icon name="Plus" size={20} /></Button>
                <Button isLoading>Loading</Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>
          </div>
        </section>

        {/* === 3. ICON === */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">3. Icon (Lucide)</h2>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap gap-6 text-slate-600 dark:text-slate-300">
              <div className="flex flex-col items-center gap-2"><Icon name="Home" /><span className="text-xs">Home</span></div>
              <div className="flex flex-col items-center gap-2"><Icon name="User" /><span className="text-xs">User</span></div>
              <div className="flex flex-col items-center gap-2"><Icon name="Settings" /><span className="text-xs">Settings</span></div>
              <div className="flex flex-col items-center gap-2 text-primary"><Icon name="FunctionSquare" /><span className="text-xs">FunctionSquare</span></div>
              <div className="flex flex-col items-center gap-2 text-success"><Icon name="CheckCircle2" /><span className="text-xs">CheckCircle2</span></div>
              <div className="flex flex-col items-center gap-2 text-error"><Icon name="XCircle" /><span className="text-xs">XCircle</span></div>
            </div>
          </div>
        </section>

        {/* === 4. INPUT & LABEL === */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">4. Input & Label</h2>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="max-w-md space-y-6">
              <div>
                <Label htmlFor="email" required>Email address</Label>
                <Input id="email" type="email" placeholder="Nhập email của bạn" />
              </div>
              <div>
                <Label htmlFor="password" required>Password</Label>
                <Input id="password" type="password" placeholder="••••••••" />
              </div>
              <div>
                <Label htmlFor="error-input">Lỗi xác thực</Label>
                <Input id="error-input" error placeholder="Trường này đang bị lỗi" defaultValue="Dữ liệu sai" />
                <p className="text-red-500 text-xs mt-1 font-medium">Vui lòng kiểm tra lại thông tin</p>
              </div>
              <div>
                <Label htmlFor="disabled-input">Vô hiệu hoá</Label>
                <Input id="disabled-input" disabled placeholder="Không thể nhập" />
              </div>
            </div>
          </div>
        </section>

        {/* === 5. RADIO OPTION === */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">5. Radio Option</h2>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="max-w-xl space-y-4">
              <RadioOption 
                name="demo-radio" 
                value="A" 
                prefixContent="A" 
                label="Hàm số lượng giác" 
                defaultChecked
              />
              <RadioOption 
                name="demo-radio" 
                value="B" 
                prefixContent="B" 
                label="Hàm số mũ và logarit" 
              />
              <RadioOption 
                name="demo-radio-disabled" 
                value="C" 
                prefixContent="C" 
                label="Tích phân (Không khả dụng)" 
                disabled
              />
            </div>
          </div>
        </section>

        {/* === 6. CARD === */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">6. Card</h2>
          <Card className="max-w-2xl">
            <CardHeader>
              <h3 className="text-xl font-bold">Đây là Card Header</h3>
              <p className="text-slate-500 mt-1">Dùng để hiển thị tiêu đề hoặc các action top-level</p>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 dark:text-slate-300">
                Đây là Card Content. Nó chứa nội dung chính của thẻ, ví dụ như câu hỏi trắc nghiệm, biểu đồ, hay các form nhập liệu. Nó có padding chuẩn 24px (sm:32px).
              </p>
            </CardContent>
            <CardFooter className="flex justify-end gap-3">
              <Button variant="ghost">Hủy</Button>
              <Button>Xác nhận</Button>
            </CardFooter>
          </Card>
        </section>

        {/* === 7. PAGINATION === */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">7. Pagination</h2>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <Suspense fallback={<div className="p-4 text-slate-500">Đang tải...</div>}>
              <Pagination 
                currentPage={2}
                totalPages={129}
                totalItems={1284}
                startIndex={11}
                endIndex={20}
              />
            </Suspense>
          </div>
        </section>

        {/* === 8. QUESTION CARD & CONTENT QUESTION === */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">8. Question Card & Content Question</h2>
          <div className="space-y-6">
            
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">A. Câu hỏi trắc nghiệm</h3>
              <QuestionCard 
                id="Q-7721"
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
                  solution="Phân tích $x^2 - 4 = (x-2)(x+2)$, rút gọn ta được $\lim_{x \to 2} (x+2) = 4$."
                />
              </QuestionCard>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">B. Câu hỏi tự luận</h3>
              <QuestionCard 
                id="Q-4491"
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
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">C. Câu hỏi chùm (Nhóm câu hỏi)</h3>
              <QuestionCard 
                id="Q-CLUSTER-81"
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
            </div>

          </div>
        </section>

        {/* === 9. SIDEBAR FILTER === */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">9. Sidebar Filter</h2>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 w-80">
            <Suspense fallback={<div className="p-4 text-slate-500">Đang tải...</div>}>
              <QuestionFilter />
            </Suspense>
          </div>
        </section>

        {/* === 10. LECTURE VIEWER === */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">10. Lecture Detail Viewer</h2>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-8">
            <LectureHeader 
              title={sampleLectureData.title}
              grade={sampleLectureData.grade}
              category={sampleLectureData.category}
              createdAt={sampleLectureData.createdAt}
            />
            <hr className="border-slate-200 dark:border-slate-800" />
            <LectureConcept basicConcept={sampleLectureData.basicConcept} />
            <LectureExamples examples={sampleLectureData.examples as any} />
          </div>
        </section>
        
      </div>
    </div>
  )
}
