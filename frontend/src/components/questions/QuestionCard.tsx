import React from 'react';
import { Edit2, Trash2, RefreshCw } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge, BadgeVariant } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface QuestionCardProps {
  id: string;
  grade: number | string;
  topic: string;
  difficulty: string;
  isSelected?: boolean;
  onToggle?: () => void;
  children?: React.ReactNode;
  index?: number;
  onChangeQuestion?: () => void;
}

export default function QuestionCard({
  id, grade, topic, difficulty, isSelected, onToggle, children, index, onChangeQuestion
}: QuestionCardProps) {
  
  const getDifficultyBadgeVariant = (diff: string): BadgeVariant => {
    switch (diff) {
      case 'Nhận biết': return 'success';
      case 'Thông hiểu': return 'warning';
      case 'Vận dụng cao': return 'error';
      default: return 'info';
    }
  };

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
              />
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="default" className="text-[10px] uppercase tracking-wider">
                LỚP {grade}
              </Badge>
              <Badge variant="info" className="text-[10px] uppercase tracking-wider">
                {topic}
              </Badge>
              <Badge variant={getDifficultyBadgeVariant(difficulty)} className="text-[10px] uppercase tracking-wider">
                {difficulty}
              </Badge>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                ID: {id}
              </span>
            </div>
          </div>
          <div className={`flex items-center gap-1 ${onChangeQuestion ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
            {onChangeQuestion ? (
              <button 
                onClick={onChangeQuestion}
                className="flex items-center justify-center gap-1 text-primary hover:bg-primary/5 px-3 min-h-[40px] rounded-lg text-sm font-medium transition-all border border-transparent hover:border-primary/20 shrink-0"
              >
                <RefreshCw className="w-4 h-4" />
                Đổi câu hỏi
              </button>
            ) : (
              <>
                <Button variant="ghost" size="icon" className="w-10 h-10 text-slate-400 hover:text-primary hover:bg-primary/10" title="Chỉnh sửa">
                  <Edit2 className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="w-10 h-10 text-slate-400 hover:text-red-500 hover:bg-red-500/10" title="Xóa">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {children}
      </div>
    </Card>
  );
}
