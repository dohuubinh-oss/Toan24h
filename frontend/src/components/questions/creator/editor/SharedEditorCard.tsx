import React from 'react'
import { EditorContent } from '@tiptap/react'
import { BaseEditor, MenuBar } from '@/components/ui/editor/BaseEditor'

interface SharedEditorCardProps {
  title: string
  icon: React.ReactNode
  content: string
  onContentChange: (content: string) => void
  placeholder?: string
  headerRightExtra?: React.ReactNode
}

export default function SharedEditorCard({
  title,
  icon,
  content,
  onContentChange,
  placeholder = "Nhập nội dung...",
  headerRightExtra,
}: SharedEditorCardProps) {
  
  const editorClass = 'flex-grow min-h-[200px] focus:outline-none text-sm leading-relaxed p-5 max-w-none [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_strong]:font-bold [&_em]:italic [&_s]:line-through [&_li>p]:mb-0 outline-none [&_.exercise-content]:!bg-transparent [&_.rounded-full]:!m-0 [&_h4]:!mt-0'

  return (
    <BaseEditor
      content={content}
      onChange={onContentChange}
      placeholder={placeholder}
      editorClass={editorClass}
    >
      {(editor) => (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 bg-white flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 px-2">
              {icon}
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">{title}</h2>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              {headerRightExtra}
              <MenuBar editor={editor} />
            </div>
          </div>
          <div className="p-8 flex-grow">
            <div className="flex flex-col h-full">
              <div className="flex-grow rounded-xl border border-slate-200 bg-slate-50 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/5 overflow-y-auto min-h-[250px] flex flex-col">
                <EditorContent editor={editor} className="flex-grow flex flex-col" />
              </div>
            </div>
          </div>
        </div>
      )}
    </BaseEditor>
  )
}
