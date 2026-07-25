import React, { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, List, ListOrdered, Sigma, ImagePlus, Image as ImageIcon, Video as YoutubeIcon, WrapText } from 'lucide-react'
import TiptapImage from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import { uploadTempImage } from '@/lib/api'
import { MathExtension } from './MathExtension'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  minHeight?: string
  className?: string
  hideToolbar?: boolean
  inline?: boolean
  mathOnlyToolbar?: boolean
  smallToolbar?: boolean
  readOnly?: boolean
}

const MenuBar = ({ editor, mathOnlyToolbar, smallToolbar }: { editor: any, mathOnlyToolbar?: boolean, smallToolbar?: boolean }) => {
  if (!editor) return null

  const btnClass = smallToolbar ? "p-1 rounded transition-colors" : "p-1.5 rounded transition-colors"
  const iconClass = smallToolbar ? "w-3 h-3" : "w-4 h-4"

  if (mathOnlyToolbar) {
    return (
      <div className="flex items-center gap-1 p-1 bg-slate-50 border-b border-slate-200 rounded-t-xl overflow-x-auto">
        <button
          onClick={() => editor.chain().focus().insertContent({ type: 'math', attrs: { latex: '' } }).run()}
          className={`${btnClass} text-primary font-bold hover:bg-white flex items-center justify-center flex-shrink-0`}
          title="Chèn công thức Toán (MathLive)"
        >
          <Sigma className={iconClass} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-50 border-b border-slate-200 rounded-t-xl overflow-x-auto">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`${btnClass} ${editor.isActive('bold') ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-white'}`}
        title="In đậm"
      >
        <Bold className={iconClass} />
      </button>
      <div className="w-px h-4 bg-slate-300 mx-1 flex-shrink-0"></div>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`${btnClass} ${editor.isActive('bulletList') ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-white'}`}
        title="Danh sách"
      >
        <List className={iconClass} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`${btnClass} ${editor.isActive('orderedList') ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-white'}`}
        title="Danh sách số"
      >
        <ListOrdered className={iconClass} />
      </button>
      <div className="w-px h-4 bg-slate-300 mx-1 flex-shrink-0"></div>
      <button
        onClick={() => editor.chain().focus().insertContent({ type: 'math', attrs: { latex: '' } }).run()}
        className={`${btnClass} text-primary font-bold hover:bg-white flex items-center justify-center flex-shrink-0`}
        title="Chèn công thức Toán (MathLive)"
      >
        <Sigma className={iconClass} />
      </button>
      <div className="w-px h-4 bg-slate-300 mx-1 flex-shrink-0"></div>
      <button
        onClick={() => {
          const selection = editor.state.selection;
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = async (e: any) => {
            const file = e.target.files?.[0];
            if (file) {
              try {
                const url = await uploadTempImage(file);
                editor.chain().focus().insertContentAt(selection.to, { type: 'image', attrs: { src: url } }).run();
              } catch (error) {
                console.error("Error uploading image", error);
              }
            }
          };
          input.click();
        }}
        className={`${btnClass} text-slate-600 hover:bg-white flex items-center justify-center flex-shrink-0`}
        title="Chèn ảnh"
      >
        <ImageIcon className={iconClass} />
      </button>
      <button
        onClick={() => {
          const url = prompt('Nhập URL YouTube (VD: https://www.youtube.com/watch?v=...)');
          if (url) {
            editor.commands.setYoutubeVideo({
              src: url,
              width: 640,
              height: 480,
            })
          }
        }}
        className={`${btnClass} text-red-600 hover:bg-white flex items-center justify-center flex-shrink-0`}
        title="Chèn YouTube"
      >
        <YoutubeIcon className={iconClass} />
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

  // Avoid matching across HTML block tags
  const blockTags = 'p|div|h[1-6]|ul|ol|li|br|table|tr|td|th|tbody|thead|math-inline';
  const inlineRegex = new RegExp(`\\$((?:(?!\\$|<\\/?(?:${blockTags})(?:>|\\s|$))[\\s\\S])+?)\\$`, 'gi');
  const blockRegex = new RegExp(`\\$\\$((?:(?!\\$\\$|<\\/?(?:${blockTags})(?:>|\\s|$))[\\s\\S])+?)\\$\\$`, 'gi');

  // Replace $$...$$
  processed = processed.replace(blockRegex, (match, p1) => {
    const escaped = p1.replace(/"/g, '&quot;');
    return `<math-inline data-latex="${escaped}">${match}</math-inline>`;
  });

  // Replace $...$
  processed = processed.replace(inlineRegex, (match, p1) => {
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
  inline = false,
  mathOnlyToolbar = false,
  smallToolbar = false,
  readOnly = false
}: RichTextEditorProps) {
  const lastEmittedHTML = useRef(content || '');
  const processedInitialContent = preprocessMath(content || '');

  const editor = useEditor({
    editable: !readOnly,
    extensions: [
      StarterKit,
      MathExtension,
      TiptapImage.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg w-full my-2 object-contain mx-auto',
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
      {!readOnly && !hideToolbar && <MenuBar editor={editor} mathOnlyToolbar={mathOnlyToolbar} />}
      <EditorContent editor={editor} className={`flex-grow flex flex-col overflow-y-auto bg-transparent`} />
    </div>
  )
}
