import React from 'react'
import { EditorContent } from '@tiptap/react'
import { BaseEditor, MenuBar } from '@/components/ui/editor/BaseEditor'

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
  rightCustomAction?: React.ReactNode
}

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
  readOnly = false,
  rightCustomAction
}: RichTextEditorProps) {

  const editorClass = `flex-grow focus:outline-none text-sm leading-relaxed max-w-none [&_p]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-1 [&_strong]:font-bold [&_em]:italic [&_s]:line-through [&_li>p]:mb-0 outline-none ${inline ? 'p-0' : 'p-3'} ${inline ? '' : `min-h-[${minHeight}]`}`

  return (
    <BaseEditor
      content={content}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      editorClass={editorClass}
    >
      {(editor) => (
        <div className={`flex flex-col transition-all overflow-hidden ${inline ? 'bg-transparent' : 'border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5'} ${className}`}>
          {!readOnly && !hideToolbar && (
            <MenuBar 
              editor={editor} 
              mathOnlyToolbar={mathOnlyToolbar} 
              smallToolbar={smallToolbar} 
              rightCustomAction={rightCustomAction} 
            />
          )}
          <EditorContent editor={editor} className={`flex-grow flex flex-col overflow-y-auto bg-transparent`} />
        </div>
      )}
    </BaseEditor>
  )
}
