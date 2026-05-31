import React, { useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, Strikethrough, List, ListOrdered, ImagePlus, Sigma } from 'lucide-react'
import { MathExtension } from './MathExtension'

import Placeholder from '@tiptap/extension-placeholder'
import { preprocessMath } from './RichTextEditor'

interface SharedEditorCardProps {
  title: string
  icon: React.ReactNode
  content: string
  imageUrl?: string | null
  onContentChange: (content: string) => void
  onImageChange: (image: string | null) => void
  imageLabel?: string
  placeholder?: string
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null

  return (
    <div className="flex items-center gap-1 pr-3 border-r border-slate-300">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('bold') ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-white'}`}
        title="In đậm"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('italic') ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-white'}`}
        title="In nghiêng"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('strike') ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-white'}`}
        title="Gạch ngang"
      >
        <Strikethrough className="w-4 h-4" />
      </button>
      <div className="w-px h-4 bg-slate-300 mx-1"></div>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('bulletList') ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-white'}`}
        title="Danh sách"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('orderedList') ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-white'}`}
        title="Danh sách số"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <div className="w-px h-4 bg-slate-300 mx-1"></div>
      <button
        onClick={() => editor.chain().focus().insertContent({ type: 'math', attrs: { latex: '' } }).run()}
        className="p-1.5 rounded transition-colors text-primary font-bold hover:bg-white flex items-center justify-center"
        title="Chèn công thức Toán (MathLive)"
      >
        <Sigma className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function SharedEditorCard({
  title,
  icon,
  content,
  imageUrl,
  onContentChange,
  onImageChange,
  imageLabel = "Kéo thả hoặc Tải ảnh",
  placeholder = "Nhập nội dung..."
}: SharedEditorCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastEmittedHTML = useRef(content || '');
  
  const processedInitialContent = preprocessMath(content || '')

  const editor = useEditor({
    extensions: [
      StarterKit,
      MathExtension,
      Placeholder.configure({
        placeholder: placeholder,
        emptyEditorClass: 'is-editor-empty before:content-[attr(data-placeholder)] before:text-slate-400 before:float-left before:pointer-events-none before:h-0',
      })
    ],
    content: processedInitialContent,
    onBlur: ({ editor }) => {
      const html = editor.getHTML();
      lastEmittedHTML.current = html;
      onContentChange(html);
    },
    editorProps: {
      attributes: {
        class: 'flex-grow min-h-[200px] focus:outline-none text-sm leading-relaxed p-5 max-w-none [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_strong]:font-bold [&_em]:italic [&_s]:line-through [&_li>p]:mb-0 outline-none',
        'data-placeholder': placeholder,
      },
    },
  })

  // Sync content when it changes from outside (e.g. switching between questions)
  React.useEffect(() => {
    if (editor && content !== lastEmittedHTML.current) {
      const processed = preprocessMath(content || '');
      if (processed !== editor.getHTML()) {
        // Use setTimeout to avoid "flushSync was called from inside a lifecycle method" in React 18+
        setTimeout(() => {
          if (editor.isDestroyed) return;
          editor.commands.setContent(processed);
          lastEmittedHTML.current = editor.getHTML();
        }, 0);
      }
    }
  }, [content, editor])

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      onImageChange(url)
    }
  }

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    onImageChange(null)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between">
        <div className="flex items-center gap-2 px-2">
          {icon}
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <MenuBar editor={editor} />
        </div>
      </div>
      <div className="p-8 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch h-full">
          <div className="flex flex-col gap-4">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
            />
            <div 
              onClick={handleImageClick}
              className={`relative group border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center min-h-[250px] hover:border-primary/50 transition-colors cursor-pointer overflow-hidden ${imageUrl ? 'bg-white' : 'bg-slate-50/50'}`}
            >
              {imageUrl ? (
                <>
                  <img src={imageUrl} alt="Uploaded" className="w-full h-full object-contain p-2" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={handleRemoveImage}
                      className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors text-sm"
                    >
                      Xóa ảnh
                    </button>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="text-center">
                    <ImagePlus className="w-12 h-12 mx-auto text-slate-300 group-hover:text-primary transition-colors" />
                    <p className="mt-3 text-xs text-slate-500 font-bold uppercase tracking-widest">{imageLabel}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col h-full">
            <div className="flex-grow rounded-xl border border-slate-200 bg-slate-50/30 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/5 overflow-y-auto min-h-[250px] flex flex-col">
              <EditorContent editor={editor} className="flex-grow flex flex-col" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
