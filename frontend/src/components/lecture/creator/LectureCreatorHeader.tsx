'use client'
import React, { useState } from 'react'
import { ArrowLeft, FileText, Save, Loader2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { toast } from '@/components/ui/ToastProvider'
import { deleteLecture } from '@/lib/api'
import { useLectureCreator } from './LectureCreatorContext'

export default function LectureCreatorHeader() {
  const router = useRouter()
  const { validateAndSubmit, isSubmitting, isEdit, editId } = useLectureCreator()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!editId) return
    setIsDeleting(true)
    try {
      const ok = await deleteLecture(editId)
      if (ok) {
        toast.success('Xóa bài giảng thành công!')
        setIsDeleteModalOpen(false)
        router.push('/dashboard/lectures')
      } else {
        toast.error('Có lỗi xảy ra khi xóa bài giảng.')
      }
    } catch {
      toast.error('Có lỗi xảy ra khi xóa bài giảng.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 w-full">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-800">
              {isEdit ? 'Chỉnh sửa bài giảng' : 'Soạn bài giảng mới'}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {isEdit && (
            <Button
              variant="outline"
              className="flex items-center gap-2 text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={isSubmitting || isDeleting}
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>Xóa bài giảng</span>
            </Button>
          )}

          <Button variant="secondary" className="hidden md:flex items-center gap-2" disabled={isSubmitting || isDeleting}>
            <FileText className="w-4 h-4" />
            Tải file PDF đính kèm
          </Button>
          
          <Button 
            className="px-6 flex items-center gap-2 shadow-sm shadow-primary/20"
            onClick={validateAndSubmit}
            disabled={isSubmitting || isDeleting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEdit ? 'Cập nhật bài giảng' : 'Lưu & Xuất bản'}
              </>
            )}
          </Button>
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Xóa bài giảng"
        description="Bạn có chắc chắn muốn xóa bài giảng này không? Hành động này không thể hoàn tác."
        confirmText={isDeleting ? 'Đang xóa...' : 'Xóa'}
        isDestructive={true}
      />
    </header>
  )
}
