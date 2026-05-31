import React, { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, Strikethrough, List, ListOrdered, Sigma } from 'lucide-react'
import { MathExtension } from './MathExtension'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  minHeight?: string
  className?: string
  hideToolbar?: boolean
  inline?: boolean
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-50 border-b border-slate-200 rounded-t-xl overflow-x-auto">
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
      <div className="w-px h-4 bg-slate-300 mx-1 flex-shrink-0"></div>
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
      <div className="w-px h-4 bg-slate-300 mx-1 flex-shrink-0"></div>
      <button
        onClick={() => editor.chain().focus().insertContent({ type: 'math', attrs: { latex: '' } }).run()}
        className="p-1.5 rounded transition-colors text-primary font-bold hover:bg-white flex items-center justify-center flex-shrink-0"
        title="Chèn công thức Toán (MathLive)"
      >
        <Sigma className="w-4 h-4" />
      </button>
    </div>
  )
}

export const preprocessMath = (html: string) => {
  if (!html) return '';
  let processed = html;
  const placeholders: string[] = [];
  
  // Protect existing math nodes so we don't double-wrap them
  processed = processed.replace(/<(span|math-inline)[^>]*data-type="math"[^>]*>.*?<\/\1>/g, (match) => {
    placeholders.push(match);
    return `__MATH_PLACEHOLDER_${placeholders.length - 1}__`;
  });
  processed = processed.replace(/<math-inline[^>]*>.*?<\/math-inline>/g, (match) => {
    placeholders.push(match);
    return `__MATH_PLACEHOLDER_${placeholders.length - 1}__`;
  });

  // Replace $$...$$
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, p1) => {
    const escaped = p1.replace(/"/g, '&quot;');
    return `<math-inline data-latex="${escaped}">${match}</math-inline>`;
  });

  // Replace $...$
  processed = processed.replace(/\$([^$]+?)\$/g, (match, p1) => {
    const escaped = p1.replace(/"/g, '&quot;');
    return `<math-inline data-latex="${escaped}">${match}</math-inline>`;
  });

  // Restore placeholders
  placeholders.forEach((placeholder, i) => {
    processed = processed.replace(`__MATH_PLACEHOLDER_${i}__`, placeholder);
  });

  return processed;
};

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Nhập nội dung...",
  minHeight = "100px",
  className = "",
  hideToolbar = false,
  inline = false
}: RichTextEditorProps) {
  const lastEmittedHTML = useRef(content || '');
  const processedInitialContent = preprocessMath(content || '');

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
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: `flex-grow focus:outline-none text-sm leading-relaxed max-w-none [&_p]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-1 [&_strong]:font-bold [&_em]:italic [&_s]:line-through [&_li>p]:mb-0 outline-none ${inline ? 'p-0' : 'p-3'}`,
        'data-placeholder': placeholder,
        style: inline ? '' : `min-height: ${minHeight};`,
      },
    },
  })

  // Sync content when it changes from outside
  useEffect(() => {
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

  return (
    <div className={`flex flex-col transition-all overflow-hidden ${inline ? 'bg-transparent' : 'border border-slate-200 rounded-xl bg-slate-50 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5'} ${className}`}>
      {!hideToolbar && <MenuBar editor={editor} />}
      <EditorContent editor={editor} className={`flex-grow flex flex-col overflow-y-auto ${inline ? 'bg-transparent' : 'bg-white'}`} />
    </div>
  )
}
