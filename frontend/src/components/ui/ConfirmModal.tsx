import React from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  hideCancel?: boolean;
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
  hideCancel = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-50 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <Card className="overflow-hidden bg-white shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h3 className="font-bold text-lg text-slate-800">{title}</h3>
            <button 
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6 text-slate-600">
            <p>{description}</p>
          </div>
          
          <div className="flex items-center justify-end gap-3 p-4 bg-slate-50/50 border-t border-slate-100">
            {!hideCancel && (
              <Button 
                variant="outline" 
                onClick={onClose}
              >
                {cancelText}
              </Button>
            )}
            <Button 
              variant={isDestructive ? 'danger' : 'primary'} 
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmText}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
