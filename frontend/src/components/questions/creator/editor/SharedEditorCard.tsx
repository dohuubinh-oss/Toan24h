import React, { useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TiptapImage from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import { Bold, Italic, Strikethrough, List, ListOrdered, ImagePlus, Sigma, Image as ImageIcon, Video as YoutubeIcon } from 'lucide-react'
import { MathExtension } from './MathExtension'
import { uploadTempImage } from '@/lib/api'

import Placeholder from '@tiptap/extension-placeholder'
import { preprocessMath } from './RichTextEditor'

interface SharedEditorCardProps {
  title: string
  icon: React.ReactNode
  content: string
  onContentChange: (content: string) => void
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
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = async (e: any) => {
            const file = e.target.files?.[0];
            if (file) {
              try {
                const url = await uploadTempImage(file);
                editor.chain().focus().setImage({ src: url }).run();
              } catch (err) {
                alert('Tải ảnh thất bại!');
              }
            }
          };
          input.click();
        }}
        className="p-1.5 rounded transition-colors text-slate-600 hover:bg-white"
        title="Chèn ảnh"
      >
        <ImageIcon className="w-4 h-4" />
      </button>
      <button
        onClick={() => {
          const url = window.prompt('Nhập đường dẫn YouTube:');
          if (url) {
            editor.chain().focus().setYoutubeVideo({ src: url }).run();
          }
        }}
        className="p-1.5 rounded transition-colors text-red-500 hover:bg-white"
        title="Chèn YouTube"
      >
        <YoutubeIcon className="w-4 h-4" />
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
  onContentChange,
  placeholder = "Nhập nội dung...",
}: SharedEditorCardProps) {
  const lastEmittedHTML = useRef(content || '');
  
  const processedInitialContent = preprocessMath(content || '')

  const editor = useEditor({
    extensions: [
      StarterKit,
      MathExtension,
      TiptapImage.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full my-2 object-contain mx-auto',
        },
      }),
      Youtube.configure({
        controls: false,
        nocookie: true,
        HTMLAttributes: {
          class: 'w-full aspect-video rounded-xl my-4 shadow-sm border border-slate-200',
        },
      }),
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
    if (editor && content !== undefined) {
      if (content !== lastEmittedHTML.current) {
        editor.commands.setContent(content)
      }
    }
  }, [content, editor])

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
        <div className="flex flex-col h-full">
          <div className="flex-grow rounded-xl border border-slate-200 bg-slate-50/30 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/5 overflow-y-auto min-h-[250px] flex flex-col">
            <EditorContent editor={editor} className="flex-grow flex flex-col" />
          </div>
        </div>
      </div>
    </div>
  )
}
