'use client'
import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, Strikethrough, List, ListOrdered, Image as ImageIcon, UploadCloud } from 'lucide-react'

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-200 bg-slate-50 rounded-t-xl">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-1.5 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-slate-200 text-ink' : 'text-slate-500 hover:bg-slate-100'}`}
        type="button"
      >
        <Bold size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-slate-200 text-ink' : 'text-slate-500 hover:bg-slate-100'}`}
        type="button"
      >
        <Italic size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded-lg transition-colors ${editor.isActive('strike') ? 'bg-slate-200 text-ink' : 'text-slate-500 hover:bg-slate-100'}`}
        type="button"
      >
        <Strikethrough size={18} />
      </button>
      <div className="w-px h-6 bg-slate-300 mx-1"></div>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-slate-200 text-ink' : 'text-slate-500 hover:bg-slate-100'}`}
        type="button"
      >
        <List size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded-lg transition-colors ${editor.isActive('orderedList') ? 'bg-slate-200 text-ink' : 'text-slate-500 hover:bg-slate-100'}`}
        type="button"
      >
        <ListOrdered size={18} />
      </button>
    </div>
  )
}

const RichTextEditor = ({ content }: { content: string }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none p-4 min-h-[120px] text-ink',
      },
    },
  })

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

export default function LectureContentEditor() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
        <div className="p-4 border-b border-slate-100 flex gap-3 items-center bg-slate-50">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white font-bold text-sm">1</span>
          <h3 className="font-bold text-ink">Khái niệm cơ bản</h3>
        </div>
        <div className="p-5">
          <RichTextEditor content="<p>Nhập khái niệm cơ bản tại đây...</p>" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
        <div className="p-4 border-b border-slate-100 flex gap-3 items-center bg-slate-50">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white font-bold text-sm">2</span>
          <h3 className="font-bold text-ink">Phân tích bài tập mẫu</h3>
        </div>
        <div className="p-5">
          <RichTextEditor content="<p>Phân tích các dạng bài tập mẫu...</p>" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
        <div className="p-4 border-b border-slate-100 flex gap-3 items-center bg-slate-50">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white font-bold text-sm">3</span>
          <h3 className="font-bold text-ink">Hình vẽ minh hoạ</h3>
        </div>
        <div className="p-5">
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3">
              <UploadCloud size={24} />
            </div>
            <p className="font-semibold text-ink mb-1">Kéo thả ảnh hoặc click để tải lên</p>
            <p className="text-xs text-slate-500">Hỗ trợ JPG, PNG, GIF (Tối đa 5MB)</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
        <div className="p-4 border-b border-slate-100 flex gap-3 items-center bg-slate-50">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white font-bold text-sm">4</span>
          <h3 className="font-bold text-ink">Dặn dò của giáo viên</h3>
        </div>
        <div className="p-5">
          <RichTextEditor content="<p>Nhập lời khuyên, dặn dò cho học sinh...</p>" />
        </div>
      </div>
    </div>
  )
}
