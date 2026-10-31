'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Flame, Bell, TrendingUp, Clock, FileText, Users, Play, X } from 'lucide-react'

interface GradeExamInfo {
  grade: number
  badge: string
  title: string
  duration: string
  questionCount: string
  submissions: string
  avgScore: string
  examUrl: string
}

const GRADE_EXAMS: Record<number, GradeExamInfo> = {
  5: {
    grade: 5,
    badge: 'Toán 5 • Luyện thi vào 6 CLC',
    title: 'Đề thi khảo sát năng lực Toán vào Lớp 6 Chất lượng cao',
    duration: '45 phút',
    questionCount: '25 câu',
    submissions: '850+ lượt thi',
    avgScore: '8.4 / 10',
    examUrl: '/lectures/lop/5',
  },
  6: {
    grade: 6,
    badge: 'Toán 6 • Khảo sát định kỳ',
    title: 'Đề kiểm tra chất lượng giữa kì II - Toán 6',
    duration: '60 phút',
    questionCount: '30 câu',
    submissions: '980+ lượt thi',
    avgScore: '8.1 / 10',
    examUrl: '/lectures/lop/6',
  },
  7: {
    grade: 7,
    badge: 'Toán 7 • Khảo sát định kỳ',
    title: 'Đề kiểm tra định kỳ học kỳ II - Toán 7',
    duration: '60 phút',
    questionCount: '35 câu',
    submissions: '1.150+ lượt thi',
    avgScore: '7.9 / 10',
    examUrl: '/lectures/lop/7',
  },
  8: {
    grade: 8,
    badge: 'Toán 8 • Nâng cao điểm số',
    title: 'Đề thi thử học kỳ & phân loại kiến thức - Toán 8',
    duration: '90 phút',
    questionCount: '35 câu',
    submissions: '1.280+ lượt thi',
    avgScore: '7.8 / 10',
    examUrl: '/lectures/lop/8',
  },
  9: {
    grade: 9,
    badge: 'Thi thử vào 10 • Toán 9',
    title: 'Đề thi thử Tuyển sinh vào Lớp 10 (Chuẩn cấu trúc mới)',
    duration: '90 phút',
    questionCount: '40 câu',
    submissions: '1.420+ lượt thi',
    avgScore: '7.6 / 10',
    examUrl: '/lectures/lop/9',
  },
}

export default function HomeHero() {
  const [selectedGrade, setSelectedGrade] = useState<number>(9)
  const [studentName, setStudentName] = useState<string>('Minh')
  const [isVideoOpen, setIsVideoOpen] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          if (user.fullName) {
            const parts = user.fullName.trim().split(/\s+/)
            const firstName = parts[parts.length - 1]
            if (firstName) setStudentName(firstName)
          }
          if (user.grade) {
            const g = parseInt(user.grade, 10)
            if (g >= 5 && g <= 9) {
              setSelectedGrade(g)
            }
          }
        } catch (e) {
          // ignore error
        }
      }
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsVideoOpen(false)
    }
    if (isVideoOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isVideoOpen])

  const currentExam = GRADE_EXAMS[selectedGrade] || GRADE_EXAMS[9]

  return (
    <section className="relative pt-12 pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        <div className="relative z-10">
          <h1 className="text-6xl lg:text-7xl font-bold leading-tight mb-6 text-slate-900">
            Luyện Toán thông minh, bứt phá <span className="text-primary italic">điểm 9+</span>
          </h1>
          <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-lg">
            Chương trình chuẩn Bộ Giáo dục từ lớp 5 đến lớp 9. Cá nhân hóa lộ trình học tập, giúp bạn tiến bộ vượt bậc chỉ sau 30 ngày.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Link
              href="/register"
              className="px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg shadow-xl shadow-primary/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 min-h-[48px] cursor-pointer"
            >
              Bắt đầu <ArrowRight className="w-5 h-5" />
            </Link>
            <button
              type="button"
              onClick={() => setIsVideoOpen(true)}
              className="px-8 py-4 bg-white rounded-xl font-bold text-lg border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-slate-800 min-h-[48px] cursor-pointer shadow-xs active:scale-98"
            >
              <Play className="w-4 h-4 fill-slate-700 text-slate-700" />
              <span>Xem demo</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-4 py-6 border-t border-slate-200">
            <div className="flex -space-x-3">
              <Image
                alt="Student 1"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full border-2 border-white object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkg2j1eQxe8m9S3Yhptdh96e6OUu_RZ-rwmBhDF5piZGVUws4S2-y8OF4EikVbhklBkU9IB6_9GrPb1F8AOblKwxq1FGUtKjOydvTMfYkLsYVL5Ape6mJ27plYyHP47fJpwLrAgtbxy-AcoLBDCdh8xGSsrd7xTjlV0zcF9QaEaTtotCSe8Cy5J_XO3WCCTnMNKNQVrXIEsl5uhPYsnSmcVzYxjUjCdwkDZNfXOkSV9HTD8QvdaxO63ZhfE0ZV4GcHm8pxX3tMEMZm"
              />
              <Image
                alt="Student 2"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full border-2 border-white object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLLhO8u-iBzfHpy648Tt1cNuk7COYKl_yWeI7H15Y31w-DcTYEKRakeXWZPldOxjwFG6-H0FYqimLhGecYjcHLbxvGP1fnwbrHHM45u-7WeBDYBckxr5GSkWUFxLoS7nzWogEP1Ni45cd8_g-alCnQuUDJ6EnB7uPUZkEFT3h1qj10GKXTuylWvrQPEwIuX-g13g_x2YffKW2IwtKt2rI3gPnTIvbqOiTERMeO10H7Rb429QwrhIm1DlRzauvGXW037bu7r-dOYBMn"
              />
              <Image
                alt="Student 3"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full border-2 border-white object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnYWjVSOz64s5rTjt6fGCdrHutCZKy1q7_5jx4c49sXHt8goVaMj6OWXpUwi6ZuHKiJ8QNHjRXAE0DB-NPoGp7rEkKoKmOuhufMb2fWjFXhJ5gFQR53hxiFRuL-GwXxaSVTkQqWaiqmF4_vZbFw0ioWqKnNkQZNkClbgxO3q61rU1zMOUxTlC725DMg8pmvOf5yWd0XAin_obayiDvbShW1z7kIr49gWci08wSSe4ScepETs6bRMDNJCIGGbj5KdTYxKrLty62xdsg"
              />
              <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-600">+100k</div>
            </div>
            <p className="text-sm font-medium text-slate-500">100,000+ Học sinh tin dùng trên toàn quốc</p>
          </div>
        </div>

        <div className="hidden lg:block relative">
          <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-50"></div>
          <div className="relative bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-[0_10px_30px_-10px_rgba(37,99,235,0.12)] border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Chào {studentName}! 👋</h2>
                <p className="text-sm text-slate-500">Tiếp tục giải đề Toán {selectedGrade}</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1 bg-orange-100 px-3 py-1 rounded-full text-orange-800 font-bold">
                  <Flame className="w-4 h-4" />
                  <span>12</span>
                </div>
                <button
                  type="button"
                  aria-label="Xem thông báo"
                  className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <Bell className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <p className="text-xs font-bold text-primary uppercase mb-1">Tiến độ tuần</p>
                <p className="text-2xl font-bold text-slate-900">85%</p>
                <div className="w-full bg-primary/10 h-1.5 rounded-full mt-2">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Huy hiệu</p>
                <div className="flex gap-2">
                  <div className="text-yellow-500">🏆</div>
                  <div className="text-blue-500">✅</div>
                  <div className="text-primary">🧠</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none"></div>

              {/* Grade selector tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-white/10 rounded-xl mb-4">
                {[5, 6, 7, 8, 9].map((gradeNum) => (
                  <button
                    key={gradeNum}
                    type="button"
                    onClick={() => setSelectedGrade(gradeNum)}
                    className={`flex-1 py-2.5 px-2 min-h-[44px] rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedGrade === gradeNum
                        ? 'bg-primary text-white shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Lớp {gradeNum}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  {currentExam.badge}
                </div>
                <span className="text-xs font-medium text-slate-300 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-blue-400" /> {currentExam.submissions}
                </span>
              </div>

              <h3 className="text-base font-bold text-white mb-2 leading-snug">
                {currentExam.title}
              </h3>

              <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-slate-300">
                <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>Thời gian: <strong>{currentExam.duration}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Quy mô: <strong>{currentExam.questionCount}</strong></span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                <div className="flex items-center gap-2">
                  <Link
                    href={currentExam.examUrl}
                    className="px-4 py-2.5 min-h-[44px] bg-primary hover:bg-primary/90 text-white font-bold rounded-xl flex items-center gap-1.5 border border-blue-400/30 transition-all cursor-pointer"
                  >
                    <span>Học ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href={currentExam.examUrl}
                    className="px-3 py-2.5 min-h-[44px] bg-white/5 hover:bg-white/10 text-slate-300 font-semibold rounded-xl border border-white/10 transition-colors flex items-center cursor-pointer"
                  >
                    Xem bài giảng
                  </Link>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-slate-400">Điểm TB</p>
                  <p className="text-xs font-bold text-amber-400">{currentExam.avgScore}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-3 z-20">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-primary font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Tăng 2.5 điểm</p>
              <p className="text-xs text-slate-500">Trung bình sau 2 tuần</p>
            </div>
          </div>
        </div>
      </div>

      {/* YouTube Demo Video Modal */}
      {isVideoOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsVideoOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Video giới thiệu nền tảng toan6789.vn"
        >
          <div
            className="relative w-full max-w-4xl bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-white/15 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-xs sm:text-sm font-semibold text-white truncate">
                  Video giới thiệu toan6789.vn - Nền tảng học Toán Lớp 5 - 9
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsVideoOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Đóng video"
              >
                <X size={20} />
              </button>
            </div>
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src="https://www.youtube-nocookie.com/embed/2wCZ5F6oNz0?autoplay=1&rel=0"
                title="Video giới thiệu toan6789.vn"
                className="absolute inset-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
