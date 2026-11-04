'use client'

import React from 'react'
import { Button } from './Button'
import { AlertTriangle, HelpCircle } from 'lucide-react'
import { Modal } from './Modal'

export interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  hideCancel?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  isDestructive = false,
  hideCancel = false,
}: ConfirmModalProps) {
  const icon = (
    <div
      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs ${
        isDestructive
          ? 'bg-rose-50 text-rose-600 border-rose-100'
          : 'bg-blue-50 text-primary border-blue-100'
      }`}
    >
      {isDestructive ? (
        <AlertTriangle className="w-5 h-5" aria-hidden="true" />
      ) : (
        <HelpCircle className="w-5 h-5" aria-hidden="true" />
      )}
    </div>
  )

  const footer = (
    <div className="flex items-center justify-end gap-3">
      {!hideCancel && (
        <Button
          variant="outline"
          onClick={onClose}
          className="min-h-[44px] rounded-xl font-bold text-sm px-5 py-2.5 active:scale-98 transition-all"
        >
          {cancelText}
        </Button>
      )}
      <Button
        variant={isDestructive ? 'danger' : 'primary'}
        onClick={() => {
          onConfirm()
          onClose()
        }}
        className="min-h-[44px] rounded-xl font-bold text-sm px-5 py-2.5 active:scale-98 transition-all shadow-xs"
      >
        {confirmText}
      </Button>
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={icon}
      maxWidth="md"
      footer={footer}
      contentClassName="p-5 sm:p-6 text-slate-600 text-sm leading-relaxed"
    >
      <p>{description}</p>
    </Modal>
  )
}

export default ConfirmModal
