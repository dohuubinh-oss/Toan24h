import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, List, ListOrdered, Sigma, ImagePlus, Image as ImageIcon, Video as YoutubeIcon, WrapText, Mic } from 'lucide-react'
import TiptapImage from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import { uploadTempImage } from '@/lib/api'
import { MathExtension } from '@/components/questions/creator/editor/MathExtension'
import { toast } from '@/components/ui/ToastProvider'
import { Node, Mark, mergeAttributes, Extension } from '@tiptap/core'

export const DivNode = Node.create({
  name: 'div',
  group: 'block',
  content: 'block*',
  parseHTML() {
    return [{ tag: 'div' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes), 0]
  },
})

export const SpanMark = Mark.create({
  name: 'span',
  parseHTML() {
    return [{ tag: 'span' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0]
  },
})

export const ClassExtension = Extension.create({
  name: 'classExtension',
  addGlobalAttributes() {
    return [
      {
        types: ['div', 'orderedList', 'bulletList', 'listItem', 'heading', 'paragraph', 'bold', 'span', 'horizontalRule'],
        attributes: {
          class: {
            default: null,
            parseHTML: element => element.getAttribute('class'),
            renderHTML: attributes => {
              if (!attributes.class) return {}
              return { class: attributes.class }
            },
          },
        },
      },
    ]
  },
})

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

export const MenuBar = ({ editor, mathOnlyToolbar, smallToolbar, rightCustomAction }: { editor: any, mathOnlyToolbar?: boolean, smallToolbar?: boolean, rightCustomAction?: React.ReactNode }) => {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  const toggleListening = useCallback(() => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsListening(false)
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói. Vui lòng dùng Chrome hoặc Edge.')
      return
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition()
      recognition.lang = 'vi-VN'
      recognition.continuous = true
      recognition.interimResults = false

      recognition.onresult = (event: any) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          }
        }
        if (finalTranscript) {
          editor.chain().focus().insertContent(finalTranscript + ' ').run()
        }
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }

    try {
      recognitionRef.current.start()
      setIsListening(true)
    } catch (e) {
      console.error(e)
    }
  }, [editor, isListening])

  // Phím tắt Ctrl+M / Cmd+M
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault()
        toggleListening()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleListening])

  if (!editor) return null

  const btnClass = smallToolbar ? "p-1 rounded transition-colors" : "p-1.5 rounded transition-colors"
  const iconClass = smallToolbar ? "w-3 h-3" : "w-4 h-4"

  if (mathOnlyToolbar) {
    return (
      <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 rounded-t-xl overflow-x-auto">
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
    <div className="flex items-center justify-between gap-1 p-1 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 rounded-t-xl overflow-x-auto">
      <div className="flex items-center gap-1">
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
                  toast.error('Tải ảnh thất bại!');
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
        <div className="w-px h-4 bg-slate-300 mx-1 flex-shrink-0"></div>
        <button
          onClick={toggleListening}
          className={`${btnClass} flex items-center justify-center flex-shrink-0 relative ${
            isListening 
              ? 'text-red-500 bg-red-50 hover:bg-red-100' 
              : 'text-slate-600 hover:bg-white'
          }`}
          title="Nhập bằng giọng nói (Ctrl+M)"
        >
          <Mic className={iconClass} />
          {isListening && (
            <span className="absolute top-0 right-0 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
        </button>
      </div>

      {rightCustomAction && (
        <div className="flex items-center ml-auto pl-2 flex-shrink-0">
          {rightCustomAction}
        </div>
      )}
    </div>
  )
}

export interface BaseEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  readOnly?: boolean
  editorClass?: string
  children: (editor: any) => React.ReactNode
}

export function BaseEditor({
  content,
  onChange,
  placeholder = "Nhập nội dung...",
  readOnly = false,
  editorClass = "flex-grow min-h-[200px] focus:outline-none text-sm leading-relaxed p-5 max-w-none [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_strong]:font-bold [&_em]:italic [&_s]:line-through [&_li>p]:mb-0 outline-none",
  children
}: BaseEditorProps) {
  const lastEmittedHTML = useRef(content || '');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processedInitialContent = preprocessMath(content || '');

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const editor = useEditor({
    editable: !readOnly,
    extensions: [
      StarterKit,
      MathExtension,
      DivNode,
      SpanMark,
      ClassExtension,
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
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        lastEmittedHTML.current = html;
        onChange(html);
      }, 500); // Debounce 500ms
    },
    onBlur: ({ editor }) => {
      const html = editor.getHTML();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      lastEmittedHTML.current = html;
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: editorClass,
        'data-placeholder': placeholder,
      },
    },
  })

  // Sync content when it changes from outside
  useEffect(() => {
    if (editor && content !== undefined && content !== lastEmittedHTML.current) {
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
    <>
      {children(editor)}
    </>
  )
}
