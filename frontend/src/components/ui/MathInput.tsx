'use client'

import React, { useEffect, useRef } from 'react'

export interface MathInputProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
}

export interface MathInputHandle {
  insertSnippet: (snippet: string) => void
  focus: () => void
}

const MathInput = React.forwardRef<MathInputHandle, MathInputProps>(function MathInput(
  { value, onChange, placeholder, className = "" },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mathFieldRef = useRef<any>(null)

  React.useImperativeHandle(ref, () => ({
    insertSnippet: (snippet: string) => {
      if (mathFieldRef.current) {
        mathFieldRef.current.executeCommand(['insert', snippet])
        mathFieldRef.current.focus()
      }
    },
    focus: () => {
      if (mathFieldRef.current) {
        mathFieldRef.current.focus()
      }
    }
  }))

  useEffect(() => {
    let mfeInstance: any = null;

    if (typeof window !== 'undefined') {
      import('mathlive').then(({ MathfieldElement }) => {
        if (!containerRef.current) return
        
        // Tiêu chuẩn Việt Nam: Phân cách số thập phân bằng dấu phẩy
        MathfieldElement.decimalSeparator = ',';

        // Tùy biến bàn phím ảo MathLive theo chuẩn Việt Nam
        if (window.mathVirtualKeyboard) {
          // 1. Phím phân cách thập phân là dấu phẩy
          window.mathVirtualKeyboard.setKeycap('[.]', {
            label: ',',
            command: 'performWithFeedback(insertDecimalSeparator)',
            shift: '.',
            class: 'big-op hide-shift',
            variants: [',', '.']
          });

          // 2. Phím chia hai chấm ':' theo chuẩn sách giáo khoa Việt Nam, nhãn phân số hiển thị là a/b
          window.mathVirtualKeyboard.setKeycap('[/]', {
            class: 'big-op hide-shift',
            shift: { class: '', latex: '\\frac{#@}{#?}', label: 'a/b' },
            variants: [':', { latex: '\\frac{#@}{#?}', label: 'a/b' }, '\\div', '/'],
            latex: ' : ',
            label: ':'
          });

          // 3. Phím nhân dấu chấm '·' (\cdot) theo chuẩn THCS/THPT Việt Nam (tránh nhầm với ẩn số x)
          window.mathVirtualKeyboard.setKeycap('[*]', {
            class: 'big-op hide-shift',
            label: '·',
            latex: ' \\cdot ',
            shift: { latex: ' \\cdot ', label: '·' },
            variants: ['\\cdot', ' : ']
          });
        }

        // Custom element could be created directly to avoid JSX type issues
        const mfe = new MathfieldElement()
        mfeInstance = mfe;
        mfe.value = value
        
        mfe.addEventListener('input', (e) => {
          onChange((e.target as any).value)
        })

        // Style the math field
        mfe.style.width = '100%'
        mfe.style.padding = '16px 48px 16px 16px' // Extra right padding for menu icon
        mfe.style.fontSize = '20px'
        mfe.style.outline = 'none'
        mfe.style.minHeight = '60px'
        mfe.style.backgroundColor = 'transparent'
        
        // Phím tắt và phím cứng cho chuẩn Việt Nam (dấu phẩy thập phân, chia hai chấm :, và nhân dấu chấm ·)
        try {
          mfe.keybindings = [
            ...(mfe.keybindings || []),
            { key: '.', command: ['insert', ','] },
            { key: '[NumpadDecimal]', command: ['insert', ','] },
            { key: ':', command: ['insert', ' : '] },
            { key: '*', command: ['insert', ' \\cdot '] },
            { key: '[NumpadMultiply]', command: ['insert', ' \\cdot '] }
          ];

          mfe.inlineShortcuts = {
            ...(mfe.inlineShortcuts || {}),
            ':': ' : ',
            'chia': ' : ',
            'div': ' : ',
            'a/b': '\\frac{#@}{#?}',
            '*': ' \\cdot ',
            '**': ' \\cdot ',
            'nhan': ' \\cdot ',
            'times': ' \\cdot ',
            'cdot': ' \\cdot ',
            '..': ' \\dots '
          };
        } catch (err) {
          console.warn('Failed to attach keybindings to mathfield', err)
        }

        // Setup Virtual Keyboard
        mfe.mathVirtualKeyboardPolicy = 'manual';
        mfe.addEventListener('focusin', () => {
          if (window.mathVirtualKeyboard) {
            window.mathVirtualKeyboard.show();
          }
        });

        containerRef.current.innerHTML = ''
        containerRef.current.appendChild(mfe)
        mathFieldRef.current = mfe

        // Automatically focus the field so the virtual keyboard pops up
        setTimeout(() => {
          mfe.focus()
        }, 100)
      })
    }

    // Hide virtual keyboard when this input unmounts (e.g. user clicks "Xong" or clicks away)
    return () => {
      if (typeof window !== 'undefined' && window.mathVirtualKeyboard) {
        window.mathVirtualKeyboard.hide();
      }
    }
  }, []) // Initialize once

  return (
    <div 
      ref={containerRef} 
      className={`w-full bg-white rounded-2xl border border-slate-200 shadow-sm focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 transition-all overflow-hidden ${className}`} 
    />
  )
})

export default MathInput

