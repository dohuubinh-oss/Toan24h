import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

interface MathTextProps {
  content: string;
  className?: string;
}

export default function MathText({ content, className = '' }: MathTextProps) {
  // Hàm đơn giản phân tách text thường và text latex bọc trong $...$
  const parts = content.split(/(\$.*?\$)/g);

  return (
    <div className={`latex-font ${className}`}>
      {parts.map((part, index) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1);
          return <InlineMath math={math} key={index} />;
        }
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
}
