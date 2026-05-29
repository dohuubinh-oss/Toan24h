'use client'

import React, { useEffect, useRef } from 'react'

interface MathInputProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
}

export default function MathInput({ value, onChange, placeholder }: MathInputProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mathFieldRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('mathlive').then(({ MathfieldElement }) => {
        if (!containerRef.current) return
        
        // Custom element could be created directly to avoid JSX type issues
        const mfe = new MathfieldElement()
        mfe.value = value
        
        mfe.addEventListener('input', (e) => {
          onChange((e.target as any).value)
        })

        // Style the math field
        mfe.style.width = '100%'
        mfe.style.padding = '12px'
        mfe.style.borderRadius = '8px'
        mfe.style.border = '1px solid #e2e8f0'
        mfe.style.fontSize = '18px'
        mfe.style.minHeight = '100px'

        containerRef.current.innerHTML = ''
        containerRef.current.appendChild(mfe)
        mathFieldRef.current = mfe
      })
    }
  }, []) // Initialize once

  // We intentionally don't update value on every render to avoid cursor jumping,
  // let the math-field manage its own state while propagating changes up.

  return <div ref={containerRef} className="w-full" />
}
