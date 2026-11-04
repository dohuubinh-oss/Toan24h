'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Loader2, MessageSquareWarning, Check, X, AlertTriangle, Edit, 
  ChevronRight, RefreshCw, AlertCircle, CheckCircle2,
  ChevronDown, ChevronUp, Sparkles, BookOpen
} from 'lucide-react'
import MathText from '@/components/ui/MathText'
import { toast } from '@/components/ui/ToastProvider'
import { Button } from '@/components/ui/Button'
import { 
  getPendingAppeals, resolveAppeal, getReportedQuestions, 
  resolveReportedQuestion 
} from '@/lib/api'

export default function AppealsPage() {
  const [activeTab, setActiveTab] = useState<'appeals' | 'reports'>('appeals')
  
  const [appeals, setAppeals] = useState<any[]>([])
  const [reportedQuestions, setReportedQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedAppeal, setSelectedAppeal] = useState<any>(null)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [expandedReportIds, setExpandedReportIds] = useState<Set<string>>(new Set())

  const toggleExpandReport = (id: string) => {
    setExpandedReportIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }
  
  // Resolve states
  const [resolveStatus, setResolveStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED')
  const [newScore, setNewScore] = useState<number>(0)
  const [feedback, setFeedback] = useState('')
  const [reportFeedback, setReportFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!selectedAppeal && !selectedReportId) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedAppeal(null)
        setSelectedReportId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedAppeal, selectedReportId])

  const fetchData = async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const [appealsData, reportsData] = await Promise.all([
        getPendingAppeals(),
        getReportedQuestions()
      ])
      setAppeals(appealsData || [])
      setReportedQuestions(reportsData || [])
      if (isManual) {
        toast.success('Đã cập nhật danh sách mới nhất!')
      }
    } catch (e: any) {
      setError(e?.message || 'Lỗi khi tải dữ liệu phản hồi')
      toast.error('Lỗi khi tải dữ liệu phản hồi')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openResolveReportModal = (questionId: string) => {
    setSelectedReportId(questionId)
    setReportFeedback('')
  }

  const handleResolveReportSubmit = async () => {
    if (!selectedReportId) return
    setIsSubmitting(true)
    try {
      const success = await resolveReportedQuestion(selectedReportId, reportFeedback)
      if (success) {
        toast.success('Đã đánh dấu xử lý xong lỗi đề thi!')
        fetchData(false)
        setSelectedReportId(null)
      } else {
        toast.error('Lỗi khi cập nhật trạng thái báo cáo')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Lỗi khi cập nhật trạng thái báo cáo')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openResolveModal = (appeal: any) => {
    setSelectedAppeal(appeal)
    setResolveStatus('APPROVED')
    setNewScore(appeal.score || 0)
    setFeedback('')
  }

  const handleResolve = async () => {
    if (!selectedAppeal) return
    setIsSubmitting(true)
    try {
      const payload = {
        detailId: selectedAppeal.detailId,
        status: resolveStatus,
        newScore: Number(newScore),
        teacherFeedback: feedback
      }
      await resolveAppeal(selectedAppeal.resultId, payload)
      toast.success('Đã duyệt kháng cáo thành công!')
      setSelectedAppeal(null)
      fetchData(false)
    } catch (e: any) {
      toast.error(e?.message || 'Lỗi khi duyệt kháng cáo')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-primary" />
        <p className="text-sm text-slate-500 font-medium">Đang tải dữ liệu phản hồi...</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <Link href="/dashboard" className="hover:text-primary cursor-pointer transition-colors">Trang chủ</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary font-bold">Báo lỗi & Kháng cáo</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <MessageSquareWarning className="w-7 h-7 text-primary" />
            Quản lý Báo lỗi & Kháng cáo
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Duyệt khiếu nại điểm thi AI và xử lý phản ánh lỗi đề bài trong hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={loading || isRefreshing}
            className="flex items-center gap-2 text-slate-700 hover:text-primary min-h-[40px] px-3.5"
            aria-label="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* Error Recovery State */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center max-w-lg mx-auto">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-rose-700 font-medium mb-3">Đã xảy ra lỗi khi tải dữ liệu: {error}</p>
          <Button
            variant="danger"
            size="sm"
            onClick={() => fetchData()}
            className="min-h-[40px] px-4"
          >
            Thử lại
          </Button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('appeals')}
          className={`flex items-center gap-2 py-3 px-5 font-semibold text-sm border-b-2 transition-all whitespace-nowrap min-h-[44px] ${
            activeTab === 'appeals'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquareWarning className="w-4 h-4" />
          <span>Kháng cáo</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            activeTab === 'appeals'
              ? 'bg-primary/10 text-primary'
              : 'bg-slate-100 text-slate-600'
          }`}>
            {appeals.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 py-3 px-5 font-semibold text-sm border-b-2 transition-all whitespace-nowrap min-h-[44px] ${
            activeTab === 'reports'
              ? 'border-rose-500 text-rose-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Báo cáo lỗi câu hỏi</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            activeTab === 'reports'
              ? 'bg-rose-100 text-rose-700'
              : 'bg-slate-100 text-slate-600'
          }`}>
            {reportedQuestions.length}
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {activeTab === 'appeals' ? (
          appeals.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Không có kháng cáo chờ xử lý</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Hiện tại không có học sinh nào gửi yêu cầu phúc khảo điểm thi hoặc câu hỏi.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[950px]">
                <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Bài thực hành</th>
                    <th className="px-6 py-4">Học sinh</th>
                    <th className="px-6 py-4">Câu hỏi</th>
                    <th className="px-6 py-4">Bài làm học sinh</th>
                    <th className="px-6 py-4">Điểm AI</th>
                    <th className="px-6 py-4">Lý do kháng cáo</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appeals.map((appeal) => (
                    <tr key={appeal.detailId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        <div>{appeal.examName}</div>
                        {appeal.submittedAt && (
                          <div className="text-xs text-slate-400 font-normal mt-0.5">
                            {new Date(appeal.submittedAt).toLocaleString('vi-VN')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-semibold text-slate-800">{appeal.studentName || 'Học sinh'}</div>
                        {appeal.studentEmail && (
                          <div className="text-xs text-slate-400">{appeal.studentEmail}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="line-clamp-2 max-w-xs text-slate-700">
                          <MathText content={appeal.question} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="line-clamp-2 max-w-xs text-primary font-medium">
                          <MathText content={appeal.studentAnswer || '(Không có)'} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {appeal.score} / {appeal.maxScore}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-rose-600 italic max-w-xs">
                        &quot;{appeal.appealMessage}&quot;
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => openResolveModal(appeal)}
                          className="min-h-[38px] px-4 font-semibold shadow-sm"
                          aria-label={`Duyệt kháng cáo cho đề ${appeal.examName}`}
                        >
                          Duyệt
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          reportedQuestions.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Không có báo cáo lỗi câu hỏi</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Tất cả các câu hỏi trong ngân hàng đều đang hoạt động tốt và không có khiếu nại lỗi.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Mã câu hỏi</th>
                    <th className="px-6 py-4">Nội dung câu hỏi</th>
                    <th className="px-6 py-4">Thông báo lỗi</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportedQuestions.map((q) => (
                    <React.Fragment key={q.id}>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-slate-500">
                        {q.id.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="line-clamp-3 max-w-md text-slate-700">
                          <MathText content={q.content} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-rose-600 italic max-w-xs font-medium">
                        &quot;{q.reportMessage}&quot;
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => toggleExpandReport(q.id)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors min-h-[38px]"
                            aria-label={expandedReportIds.has(q.id) ? `Ẩn đáp án câu hỏi ${q.id}` : `Xem đáp án câu hỏi ${q.id}`}
                          >
                            {expandedReportIds.has(q.id) ? (
                              <>
                                <ChevronUp className="w-4 h-4" />
                                <span>Ẩn đáp án</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4" />
                                <span>Xem đáp án</span>
                              </>
                            )}
                          </button>
                          <Link
                            href={`/dashboard/questions/create?id=${q.id}`}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-semibold transition-colors min-h-[38px]"
                            aria-label={`Sửa câu hỏi ${q.id}`}
                          >
                            <Edit className="w-4 h-4" />
                            Sửa
                          </Link>
                          <button
                            onClick={() => openResolveReportModal(q.id)}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-semibold transition-colors min-h-[38px]"
                            aria-label={`Đã xử lý xong câu hỏi ${q.id}`}
                          >
                            <Check className="w-4 h-4" />
                            Đã xử lý
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedReportIds.has(q.id) && (
                      <tr className="bg-slate-50/70 border-b border-slate-100 animate-in fade-in duration-150">
                        <td colSpan={4} className="px-6 py-4">
                          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                            {q.options && Array.isArray(q.options) && q.options.length > 0 && (
                              <div>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                                  Các phương án lựa chọn:
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {q.options.map((opt: any, optIdx: number) => {
                                    const optLetter = String.fromCharCode(65 + optIdx)
                                    const isCorrect = (q.correct_answer || q.correctAnswer) === opt || (q.correct_answer || q.correctAnswer) === optLetter
                                    return (
                                      <div 
                                        key={optIdx} 
                                        className={`p-2.5 rounded-lg border text-sm flex items-start gap-2 ${
                                          isCorrect 
                                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold' 
                                            : 'bg-slate-50 border-slate-200/70 text-slate-700'
                                        }`}
                                      >
                                        <span className="font-bold text-slate-500">{optLetter}.</span>
                                        <div className="flex-1">
                                          <MathText content={typeof opt === 'string' ? opt : (opt.content || '')} />
                                        </div>
                                        {isCorrect && (
                                          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider shrink-0">
                                            (Đáp án đúng)
                                          </span>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-2 text-sm flex-wrap">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Đáp án chính xác:
                              </span>
                              <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                                <MathText content={q.correct_answer || q.correctAnswer || '(Không có)'} />
                              </span>
                            </div>

                            {(q.solution_guide || q.solutionGuide) && (
                              <div>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                  Lời giải chi tiết:
                                </span>
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-700">
                                  <MathText content={q.solution_guide || q.solutionGuide} />
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Resolve Appeal Modal */}
      {selectedAppeal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="appeal-modal-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans"
        >
          <div className="fixed inset-0" onClick={() => !isSubmitting && setSelectedAppeal(null)} aria-hidden="true" />
          <div className="relative bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200/90 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 id="appeal-modal-title" className="text-xl font-bold text-slate-900">Duyệt Kháng Cáo</h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                  <span>Bài thi: <strong className="text-slate-700">{selectedAppeal.examName}</strong></span>
                  {selectedAppeal.studentName && (
                    <>
                      <span>•</span>
                      <span>Học sinh: <strong className="text-slate-700">{selectedAppeal.studentName}</strong> {selectedAppeal.studentEmail && `(${selectedAppeal.studentEmail})`}</span>
                    </>
                  )}
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedAppeal(null)} 
                className="min-w-[40px] min-h-[40px] p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Đóng cửa sổ"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-600">Nội dung câu hỏi</p>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl prose prose-sm max-w-none text-slate-800">
                    <MathText content={selectedAppeal.question} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-600">Bài làm học sinh</p>
                    <div className="p-4 bg-blue-50/60 border border-blue-100 text-blue-900 rounded-xl font-medium">
                      <MathText content={selectedAppeal.studentAnswer || '(Không có)'} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-600">Lời giải AI & Điểm</p>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                      <p className="font-bold text-slate-800 mb-2">
                        Điểm hiện tại: <span className="text-primary">{selectedAppeal.score}</span> / {selectedAppeal.maxScore}
                      </p>
                      <div className="prose prose-sm max-w-none text-slate-600">
                        <MathText content={selectedAppeal.aiExplanation || ''} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-600">Lý do kháng cáo của học sinh</p>
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl italic">
                  &quot;{selectedAppeal.appealMessage}&quot;
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="space-y-4">
                <h3 className="font-bold text-slate-800">Quyết định của giáo viên</h3>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    type="button"
                    onClick={() => setResolveStatus('APPROVED')}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 font-semibold transition-all min-h-[44px] ${
                      resolveStatus === 'APPROVED' 
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500' 
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Check className="w-5 h-5 text-emerald-600" />
                    Chấp thuận & Đổi điểm
                  </button>
                  <button 
                    type="button"
                    onClick={() => setResolveStatus('REJECTED')}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 font-semibold transition-all min-h-[44px] ${
                      resolveStatus === 'REJECTED' 
                        ? 'border-rose-500 bg-rose-50 text-rose-700 ring-1 ring-rose-500' 
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <X className="w-5 h-5 text-rose-600" />
                    Từ chối
                  </button>
                </div>

                {resolveStatus === 'APPROVED' && (
                  <div className="space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-slate-700">
                        Điểm mới (Tối đa: {selectedAppeal.maxScore})
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setNewScore(selectedAppeal.maxScore)}
                          className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors"
                        >
                          Tối đa ({selectedAppeal.maxScore})
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewScore(Math.min(selectedAppeal.maxScore, Math.round(((selectedAppeal.score || 0) + 0.5) * 100) / 100))}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
                        >
                          +0.5đ
                        </button>
                      </div>
                    </div>
                    <input 
                      type="number"
                      step="0.25"
                      min="0"
                      max={selectedAppeal.maxScore}
                      value={newScore}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value)
                        if (!isNaN(val)) {
                          setNewScore(Math.max(0, Math.min(selectedAppeal.maxScore, val)))
                        } else {
                          setNewScore(0)
                        }
                      }}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700">
                      Lời nhắn / Nhận xét phản hồi <span className="text-rose-500">*</span>
                    </label>
                  </div>

                  {/* Quick Feedback Chips */}
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    <span className="text-xs font-medium text-slate-400 self-center mr-1">Gợi ý nhanh:</span>
                    {(resolveStatus === 'APPROVED' ? [
                      'Đã cộng điểm câu này, cách giải của em hoàn toàn chính xác.',
                      'Thầy/Cô đã kiểm tra lại và chấp thuận kết quả của em.',
                      'Đồng ý, phương pháp giải hợp lệ và rõ ràng.'
                    ] : [
                      'Kết quả chấm của hệ thống là chính xác, em xem lại lời giải chi tiết nhé.',
                      'Bước tính toán chưa chính xác, không đủ điều kiện cộng điểm.',
                      'Lập luận còn thiếu căn cứ, em chú ý thêm ở bài sau.'
                    ]).map((template, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFeedback(template)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-primary/10 hover:text-primary text-slate-600 transition-colors text-left"
                      >
                        {template.length > 35 ? `${template.slice(0, 35)}...` : template}
                      </button>
                    ))}
                  </div>

                  <textarea 
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Giải thích lý do chấp thuận hoặc từ chối để học sinh hiểu rõ..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none text-sm"
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setSelectedAppeal(null)}
                disabled={isSubmitting}
                className="min-h-[40px] px-5 rounded-xl"
              >
                Hủy
              </Button>
              <Button 
                onClick={handleResolve}
                disabled={isSubmitting || !feedback.trim()}
                className="min-h-[40px] px-6 font-semibold flex items-center gap-2 rounded-xl active:scale-98"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Xác nhận
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Report Modal */}
      {selectedReportId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-resolve-modal-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans"
        >
          <div className="fixed inset-0" onClick={() => !isSubmitting && setSelectedReportId(null)} aria-hidden="true" />
          <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200/90 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 id="report-resolve-modal-title" className="text-xl font-bold text-slate-900">Xử lý báo lỗi</h2>
                <p className="text-xs text-slate-500 mt-0.5">Xác nhận đã khắc phục nội dung câu hỏi</p>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedReportId(null)} 
                className="min-w-[40px] min-h-[40px] p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Đóng cửa sổ"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Lời nhắn / Nhận xét phản hồi (Tùy chọn)</label>
                <textarea 
                  rows={4}
                  value={reportFeedback}
                  onChange={(e) => setReportFeedback(e.target.value)}
                  placeholder="Ghi chú nội dung đã chỉnh sửa hoặc lời cảm ơn học sinh đã phát hiện lỗi..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none text-sm text-slate-800"
                ></textarea>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setSelectedReportId(null)}
                disabled={isSubmitting}
                className="min-h-[40px] px-5 rounded-xl"
              >
                Hủy
              </Button>
              <Button 
                onClick={handleResolveReportSubmit}
                disabled={isSubmitting}
                className="min-h-[40px] px-6 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 rounded-xl active:scale-98"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Xác nhận đã xử lý
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
