import React from 'react';
import { Edit2, Trash2, RefreshCw } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge, BadgeVariant } from '../ui/Badge';
import { Button } from '../ui/Button';
import { DIFFICULTY_BADGE_VARIANTS } from '@/lib/constants';

export interface QuestionCardProps {
  id: string;
  grade: number | string;
  topic: string;
  difficulty: string;
  isSelected?: boolean;
  onToggle?: () => void;
  children?: React.ReactNode;
  index?: number;
  typeQuestion?: 'group' | 'single' | string;
  type?: 'Trắc nghiệm' | 'Tự luận' | string;
  onEdit?: () => void;
  onDelete?: () => void;
  onSwap?: () => void;
}

export default function QuestionCard({
  id, grade, topic, difficulty, isSelected, onToggle, children, index, typeQuestion, type, onEdit, onDelete, onSwap
}: QuestionCardProps) {

  return (
    <Card className={`transition-all group overflow-hidden ${
      isSelected 
        ? 'bg-primary/5 border-primary shadow-sm' 
        : 'bg-white border-slate-200/60 shadow-sm hover:shadow-md hover:border-primary/30'
    }`}>
      <div className="p-4">
        {/* Header Tags */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            {index !== undefined ? (
              <span className="flex items-center justify-center w-auto h-8 px-2.5 rounded-lg bg-primary text-white font-bold text-sm shrink-0">
                Câu {index + 1}
              </span>
            ) : (
              <input 
                className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer mt-0.5" 
                type="checkbox" 
                checked={isSelected}
                onChange={onToggle}
                aria-label={`Chọn câu hỏi ID ${id}`}
              />
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {grade !== undefined && grade !== null && grade !== '' && grade !== 0 && (
                <Badge variant="default" className="text-xs uppercase tracking-wider font-semibold">
                  LỚP {grade}
                </Badge>
              )}
              {topic && (
                <Badge variant="info" className="text-xs uppercase tracking-wider font-semibold">
                  {topic}
                </Badge>
              )}
              {difficulty && (
                <Badge variant={DIFFICULTY_BADGE_VARIANTS[difficulty] || 'info'} className="text-xs uppercase tracking-wider font-semibold">
                  {difficulty}
                </Badge>
              )}
              {typeQuestion && (
                <Badge variant="outline" className="text-xs uppercase tracking-wider font-semibold border-slate-300 text-slate-700 bg-white">
                  {typeQuestion === 'group' ? 'CÂU HỎI CHÙM' : 'CÂU ĐƠN'}
                </Badge>
              )}
              {type && (
                <Badge variant="outline" className="text-xs uppercase tracking-wider font-semibold border-primary/30 text-primary bg-primary/5">
                  {type}
                </Badge>
              )}
              <span className="text-xs text-slate-500 font-mono font-medium uppercase tracking-wider">
                ID: {id}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {onSwap && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="min-w-[44px] min-h-[44px] w-11 h-11 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl" 
                title="Đổi câu hỏi" 
                aria-label={`Đổi câu hỏi ${id}`}
                onClick={onSwap}
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
            )}
            {onEdit && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="min-w-[44px] min-h-[44px] w-11 h-11 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl" 
                title="Chỉnh sửa" 
                aria-label={`Chỉnh sửa câu hỏi ${id}`}
                onClick={onEdit}
              >
                <Edit2 className="w-5 h-5" />
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="min-w-[44px] min-h-[44px] w-11 h-11 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl" 
                title="Xóa" 
                aria-label={`Xóa câu hỏi ${id}`}
                onClick={onDelete}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        {children}
      </div>
    </Card>
  );
}
