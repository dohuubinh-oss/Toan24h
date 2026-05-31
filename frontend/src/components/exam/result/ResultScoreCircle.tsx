import React from 'react'

interface ResultScoreCircleProps {
  score: number
  maxScore: number
  topPercent?: number
  multipleChoiceScore?: number
  multipleChoiceMax?: number
  essayScore?: number
  essayMax?: number
}

export default function ResultScoreCircle({
  score,
  maxScore,
  topPercent,
  multipleChoiceScore,
  multipleChoiceMax,
  essayScore,
  essayMax,
}: ResultScoreCircleProps) {
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const percent = maxScore > 0 ? (score / maxScore) * 100 : 0
  const dashoffset = circumference - (percent / 100) * circumference

  let comment = 'Cần cố gắng thêm!'
  if (percent >= 80) comment = 'Kết quả xuất sắc!'
  else if (percent >= 65) comment = 'Kết quả khá tốt!'
  else if (percent >= 50) comment = 'Kết quả đạt yêu cầu!'

  return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-8 border border-slate-200/60 dark:border-slate-800 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
      
      <div className="text-center relative">
        <div className="inline-flex items-center justify-center relative mb-4">
          <svg className="w-40 h-40 transform -rotate-90">
            <circle
              className="text-slate-100 dark:text-slate-800"
              cx="80"
              cy="80"
              fill="transparent"
              r="70"
              stroke="currentColor"
              strokeWidth="8"
            ></circle>
            <circle
              className="text-primary transition-all duration-1000 ease-out"
              cx="80"
              cy="80"
              fill="transparent"
              r="70"
              stroke="currentColor"
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
              strokeWidth="8"
            ></circle>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black text-slate-900 dark:text-slate-100">
              {score.toFixed(1)}
            </span>
            <span className="text-slate-400 font-bold text-sm">/ {maxScore}</span>
          </div>
        </div>
        
        <h3 className="text-xl font-bold mb-1">{comment}</h3>
        {topPercent && (
          <p className="text-slate-500 text-sm">Bạn nằm trong top {topPercent}% của lớp.</p>
        )}
      </div>

      {(multipleChoiceMax !== undefined || essayMax !== undefined) && (
        <div className="grid grid-cols-2 gap-4 mt-8">
          {multipleChoiceMax !== undefined && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center border border-slate-100 dark:border-slate-700">
              <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Trắc nghiệm</p>
              <p className="text-xl font-bold text-success">
                {(multipleChoiceScore || 0).toFixed(1)}
                <span className="text-xs text-slate-400">/{multipleChoiceMax.toFixed(1)}</span>
              </p>
            </div>
          )}
          {essayMax !== undefined && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center border border-slate-100 dark:border-slate-700">
              <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Tự luận</p>
              <p className="text-xl font-bold text-warning">
                {(essayScore || 0).toFixed(1)}
                <span className="text-xs text-slate-400">/{essayMax.toFixed(1)}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
