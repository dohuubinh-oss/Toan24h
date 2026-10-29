'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Loader2, MessageSquareWarning, Check, X, AlertTriangle, Edit, 
  ClipboardList, ChevronRight, RefreshCw, AlertCircle, CheckCircle2 
} from 'lucide-react'
import MathText from '@/components/ui/MathText'
import { toast } from '@/components/ui/ToastProvider'
import { Button } from '@/components/ui/Button'
import { 
  getPendingAppeals, resolveAppeal, getReportedQuestions, 
  resolveReportedQuestion, getNeedsReviewSubmissions 
} from '@/lib/api'

export default function AppealsPage() {
  const [activeTab, setActiveTab] = useState<'appeals' | 'reports' | 'reviews'>('appeals')
  
  const [appeals, setAppeals] = useState<any[]>([])
  const [reportedQuestions, setReportedQuestions] = useState<any[]>([])
  const [needsReviewSubmissions, setNeedsReviewSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedAppeal, setSelectedAppeal] = useState<any>(null)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  
  // Resolve states
  const [resolveStatus, setResolveStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED')
  const [newScore, setNewScore] = useState<number>(0)
  const [feedback, setFeedback] = useState('')
  const [reportFeedback, setReportFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const [appealsData, reportsData, reviewsData] = await Promise.all([
        getPendingAppeals(),
        getReportedQuestions(),
        getNeedsReviewSubmissions()
      ])
      setAppeals(appealsData || [])
      setReportedQuestions(reportsData || [])
      setNeedsReviewSubmissions(reviewsData || [])
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
            Duyệt khiếu nại điểm thi AI, xử lý phản ánh lỗi đề bài và thẩm định bài thi tự luận.
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

        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 py-3 px-5 font-semibold text-sm border-b-2 transition-all whitespace-nowrap min-h-[44px] ${
            activeTab === 'reviews'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Cần duyệt chấm</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            activeTab === 'reviews'
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-slate-100 text-slate-600'
          }`}>
            {needsReviewSubmissions.length}
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {activeTab === 'reviews' ? (
          needsReviewSubmissions.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Không có bài thi cần duyệt chấm</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Tất cả các bài thi tự luận đã được hoàn tất chấm điểm và phản hồi tới học sinh.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Bài thực hành</th>
                    <th className="px-6 py-4">Học sinh</th>
                    <th className="px-6 py-4">Thời gian nộp</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {needsReviewSubmissions.map((sub) => (
                    <tr key={sub.submissionId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {sub.examName}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-semibold text-slate-800">{sub.studentName}</div>
                        <div className="text-xs text-slate-400">{sub.studentEmail}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          Cần duyệt chấm
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/exam/${sub.submissionId}/result?mode=grade`}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors inline-flex items-center gap-1.5 min-h-[38px]"
                          aria-label={`Chấm ngay bài thi của ${sub.studentName}`}
                        >
                          <Edit className="w-4 h-4" />
                          Chấm ngay
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : activeTab === 'appeals' ? (
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
              <table className="w-full text-left min-w-[900px]">
                <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Bài thực hành</th>
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
                        {appeal.examName}
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
                    <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
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
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Resolve Appeal Modal */}
      {selectedAppeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Duyệt Kháng Cáo</h2>
                <p className="text-xs text-slate-500 mt-0.5">Bài thi: {selectedAppeal.examName}</p>
              </div>
              <button 
                onClick={() => setSelectedAppeal(null)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                aria-label="Đóng cửa sổ"
              >
                <X className="w-5 h-5" />
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
                    <label className="text-sm font-semibold text-slate-700">
                      Điểm mới (Tối đa: {selectedAppeal.maxScore})
                    </label>
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
                  <label className="text-sm font-semibold text-slate-700">
                    Lời nhắn / Nhận xét phản hồi <span className="text-rose-500">*</span>
                  </label>
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
                className="min-h-[40px] px-5"
              >
                Hủy
              </Button>
              <Button 
                onClick={handleResolve}
                disabled={isSubmitting || !feedback.trim()}
                className="min-h-[40px] px-6 font-semibold flex items-center gap-2"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Xử lý báo lỗi</h2>
                <p className="text-xs text-slate-500 mt-0.5">Xác nhận đã khắc phục nội dung câu hỏi</p>
              </div>
              <button 
                onClick={() => setSelectedReportId(null)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                aria-label="Đóng cửa sổ"
              >
                <X className="w-5 h-5" />
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
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none text-sm"
                ></textarea>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setSelectedReportId(null)}
                disabled={isSubmitting}
                className="min-h-[40px] px-5"
              >
                Hủy
              </Button>
              <Button 
                onClick={handleResolveReportSubmit}
                disabled={isSubmitting}
                className="min-h-[40px] px-6 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
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
