'use client'

import React, { useEffect, useRef } from 'react'

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

interface TelegramLoginWidgetProps {
  botName: string
  buttonSize?: 'large' | 'medium' | 'small'
  cornerRadius?: number
  requestAccess?: string
  usePic?: boolean
  onAuthCallback: (user: TelegramUser) => void
}

declare global {
  interface Window {
    onTelegramAuth: (user: TelegramUser) => void
  }
}

export default function TelegramLoginWidget({
  botName,
  buttonSize = 'large',
  cornerRadius = 8,
  requestAccess = 'write',
  usePic = true,
  onAuthCallback,
}: TelegramLoginWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onAuthCallbackRef = useRef(onAuthCallback)

  useEffect(() => {
    onAuthCallbackRef.current = onAuthCallback
  }, [onAuthCallback])

  useEffect(() => {
    window.onTelegramAuth = (user) => {
      if (onAuthCallbackRef.current) {
        onAuthCallbackRef.current(user)
      }
    }

    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', botName)
    script.setAttribute('data-size', buttonSize)
    if (cornerRadius !== undefined) {
      script.setAttribute('data-radius', cornerRadius.toString())
    }
    script.setAttribute('data-request-access', requestAccess)
    script.setAttribute('data-userpic', usePic.toString())
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    script.async = true

    const currentContainer = containerRef.current
    if (currentContainer) {
      currentContainer.appendChild(script)
    }

    return () => {
      if (currentContainer) {
        currentContainer.innerHTML = ''
      }
    }
  }, [botName, buttonSize, cornerRadius, requestAccess, usePic])

  return (
    <div className="flex justify-center w-full my-2" ref={containerRef}></div>
  )
}
