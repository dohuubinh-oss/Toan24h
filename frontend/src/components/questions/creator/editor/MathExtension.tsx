import { mergeAttributes, Node, nodeInputRule, nodePasteRule } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import MathInput from '../../../ui/MathInput'
import MathText from '../../../ui/MathText'
import MathKeyboardModal from '../../../ui/MathKeyboardModal'
import React, { useState, useEffect } from 'react'

const MathNodeView = ({ node, updateAttributes, selected, deleteNode, editor, getPos }: any) => {
  const [isEditing, setIsEditing] = useState(false)

  // Auto-edit when newly inserted and empty
  useEffect(() => {
    if (node.attrs.latex === '') {
      setIsEditing(true)
    }
  }, [])

  const handleSave = (latex: string) => {
    updateAttributes({ latex })
    setIsEditing(false)
    
    // Automatically focus back to the editor after saving
    if (typeof getPos === 'function') {
      const pos = getPos() + node.nodeSize
      editor.chain().focus().setTextSelection(pos).run()
    } else {
      editor.commands.focus()
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (node.attrs.latex === '') {
      deleteNode()
      editor.commands.focus()
    } else {
      if (typeof getPos === 'function') {
        const pos = getPos() + node.nodeSize
        editor.chain().focus().setTextSelection(pos).run()
      } else {
        editor.commands.focus()
      }
    }
  }

  return (
    <NodeViewWrapper as="span" className="inline-block relative align-middle mx-1">
      {isEditing && (
        <MathKeyboardModal 
          initialValue={node.attrs.latex} 
          onSave={handleSave} 
          onCancel={handleCancel} 
        />
      )}
      
      <span 
        className={`cursor-pointer inline-block rounded px-1.5 py-0.5 transition-all hover:bg-slate-100`}
        onClick={() => setIsEditing(true)}
      >
        <MathText content={`$${node.attrs.latex || '\\text{nhập công thức...}'}$`} />
      </span>
    </NodeViewWrapper>
  )
}

export const MathExtension = Node.create({
  name: 'math',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      latex: { default: '' }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'math-inline',
        getAttrs: (node: any) => ({
          latex: node.getAttribute('data-latex') || ''
        })
      },
      {
        tag: 'span[data-type="math"]',
        getAttrs: (node: any) => ({
          latex: node.getAttribute('data-latex') || ''
        })
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['math-inline', mergeAttributes(HTMLAttributes), `$${HTMLAttributes.latex}$`]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathNodeView)
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: /\$([^$]+)\$$/,
        type: this.type,
        getAttributes: match => {
          return { latex: match[1] }
        }
      }),
      nodeInputRule({
        find: /\$\$$/,
        type: this.type,
        getAttributes: () => {
          return { latex: '' }
        }
      })
    ]
  },

  addPasteRules() {
    return [
      nodePasteRule({
        find: /(?:\s|^)\$([^$]+)\$/g,
        type: this.type,
        getAttributes: match => {
          return { latex: match[1] }
        }
      }),
      nodePasteRule({
        find: /\$\$([^$]*)\$\$/g,
        type: this.type,
        getAttributes: match => {
          return { latex: match[1] }
        }
      })
    ]
  }
})
