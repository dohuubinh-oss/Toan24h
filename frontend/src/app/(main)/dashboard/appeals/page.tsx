'use client'

import React, { useEffect, useState } from 'react'
import { getPendingAppeals, resolveAppeal, getReportedQuestions, updateQuestion, resolveReportedQuestion } from '@/lib/api'
import { Loader2, MessageSquareWarning, Check, X, Search, AlertTriangle, Edit } from 'lucide-react'
import MathText from '@/components/ui/MathText'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

export default function AppealsPage() {
  const [activeTab, setActiveTab] = useState<'appeals' | 'reports'>('appeals')
  
  const [appeals, setAppeals] = useState<any[]>([])
  const [reportedQuestions, setReportedQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAppeal, setSelectedAppeal] = useState<any>(null)
  
  // Resolve states
  const [resolveStatus, setResolveStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED')
  const [newScore, setNewScore] = useState<number>(0)
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchAppeals = async () => {
    try {
      const data = await getPendingAppeals()
      setAppeals(data)
    } catch (e) {
      toast.error('Lỗi khi tải danh sách kháng cáo')
    }
  }

  const fetchReports = async () => {
    try {
      const data = await getReportedQuestions()
      setReportedQuestions(data)
    } catch (e) {
      toast.error('Lỗi khi tải danh sách báo cáo lỗi')
    }
  }

  const fetchData = async () => {
    setLoading(true)
    await Promise.all([fetchAppeals(), fetchReports()])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleResolveReport = async (questionId: string) => {
    try {
      const success = await resolveReportedQuestion(questionId)
      if (success) {
        toast.success('Đã đánh dấu xử lý xong lỗi đề thi!')
        fetchReports()
      } else {
        toast.error('Lỗi khi cập nhật trạng thái báo cáo')
      }
    } catch (e) {
      toast.error('Lỗi khi cập nhật trạng thái báo cáo')
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
        status: resolveStatus,
        newScore: Number(newScore),
        teacherFeedback: feedback
      }
      await resolveAppeal(selectedAppeal.detailId, payload)
      toast.success('Đã duyệt kháng cáo thành công!')
      setSelectedAppeal(null)
      fetchAppeals()
    } catch (e) {
      toast.error('Lỗi khi duyệt kháng cáo')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <MessageSquareWarning className="w-8 h-8 text-primary" />
            Quản lý Phản hồi
          </h1>
          <p className="text-slate-500 mt-2">Duyệt kháng cáo điểm và xử lý báo cáo lỗi đề thi.</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab('appeals')}
          className={`flex items-center gap-2 py-3 px-6 font-semibold border-b-2 transition-colors ${
            activeTab === 'appeals'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <MessageSquareWarning className="w-5 h-5" />
          Kháng cáo ({appeals.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 py-3 px-6 font-semibold border-b-2 transition-colors ${
            activeTab === 'reports'
              ? 'border-red-500 text-red-500'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
          Báo cáo lỗi ({reportedQuestions.length})
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {activeTab === 'appeals' ? (
          appeals.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              Không có kháng cáo nào đang chờ duyệt.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-sm font-medium">
                  <tr>
                    <th className="px-6 py-4">Đề thi</th>
                    <th className="px-6 py-4">Câu hỏi</th>
                    <th className="px-6 py-4">Bài làm</th>
                    <th className="px-6 py-4">Điểm AI</th>
                    <th className="px-6 py-4">Lý do kháng cáo</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {appeals.map((appeal) => (
                    <tr key={appeal.detailId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                        {appeal.examName}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="line-clamp-2 max-w-xs">
                          <MathText content={appeal.question} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="line-clamp-2 max-w-xs text-blue-600 dark:text-blue-400">
                          <MathText content={appeal.studentAnswer || '(Không có)'} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-300">
                        {appeal.score} / {appeal.maxScore}
                      </td>
                      <td className="px-6 py-4 text-sm text-red-600 dark:text-red-400 italic max-w-xs">
                        {appeal.appealMessage}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openResolveModal(appeal)}
                          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
                        >
                          Duyệt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          reportedQuestions.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              Không có báo cáo lỗi câu hỏi nào.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-sm font-medium">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Nội dung câu hỏi</th>
                    <th className="px-6 py-4">Thông báo lỗi</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {reportedQuestions.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                        {q.id}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="line-clamp-3 max-w-md">
                          <MathText content={q.content} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-red-600 dark:text-red-400 italic max-w-xs">
                        {q.reportMessage}
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <Link
                          href={`/dashboard/questions/create?id=${q.id}`}
                          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-lg text-sm font-semibold transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Sửa
                        </Link>
                        <button
                          onClick={() => handleResolveReport(q.id)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 rounded-lg text-sm font-semibold transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          Đã xử lý
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Resolve Modal */}
      {selectedAppeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Duyệt Kháng Cáo</h2>
              <button onClick={() => setSelectedAppeal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-500">Nội dung câu hỏi</p>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl prose prose-sm max-w-none">
                    <MathText content={selectedAppeal.question} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-500">Bài làm học sinh</p>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl font-medium">
                      <MathText content={selectedAppeal.studentAnswer || '(Không có)'} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-500">Lời giải AI & Điểm</p>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <p className="font-bold text-slate-800 dark:text-slate-200 mb-2">Điểm: {selectedAppeal.score} / {selectedAppeal.maxScore}</p>
                      <div className="prose prose-sm max-w-none">
                        <MathText content={selectedAppeal.aiExplanation || ''} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-500">Lý do kháng cáo</p>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-xl italic">
                  "{selectedAppeal.appealMessage}"
                </div>
              </div>

              <hr className="border-slate-100 dark:border-slate-800" />

              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-white">Quyết định của giáo viên</h3>
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => setResolveStatus('APPROVED')}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 font-semibold transition-all ${resolveStatus === 'APPROVED' ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  >
                    <Check className="w-5 h-5" />
                    Chấp thuận & Đổi điểm
                  </button>
                  <button 
                    onClick={() => setResolveStatus('REJECTED')}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 font-semibold transition-all ${resolveStatus === 'REJECTED' ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  >
                    <X className="w-5 h-5" />
                    Từ chối
                  </button>
                </div>

                {resolveStatus === 'APPROVED' && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Điểm mới (Tối đa: {selectedAppeal.maxScore})</label>
                    <input 
                      type="number"
                      step="0.25"
                      min="0"
                      max={selectedAppeal.maxScore}
                      value={newScore}
                      onChange={(e) => setNewScore(Number(e.target.value))}
                      className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Lời nhắn / Nhận xét (Bắt buộc)</label>
                  <textarea 
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Giải thích vì sao chấp thuận hoặc từ chối..."
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedAppeal(null)}
                className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button 
                onClick={handleResolve}
                disabled={isSubmitting || !feedback.trim()}
                className="px-6 py-2.5 rounded-xl font-semibold bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
