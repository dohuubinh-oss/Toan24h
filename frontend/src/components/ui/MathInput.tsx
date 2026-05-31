'use client'

import React, { useEffect, useRef } from 'react'

interface MathInputProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
}

export default function MathInput({ value, onChange, placeholder, className = "" }: MathInputProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mathFieldRef = useRef<any>(null)

  useEffect(() => {
    let mfeInstance: any = null;

    if (typeof window !== 'undefined') {
      import('mathlive').then(({ MathfieldElement }) => {
        if (!containerRef.current) return
        
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

  // We intentionally don't update value on every render to avoid cursor jumping,
  // let the math-field manage its own state while propagating changes up.

  return (
    <div 
      ref={containerRef} 
      className={`w-full bg-white rounded-2xl border border-slate-200 shadow-sm focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 transition-all overflow-hidden ${className}`} 
    />
  )
}
