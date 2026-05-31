import React, { useMemo } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import katex from 'katex';

interface MathTextProps {
  content: string;
  className?: string;
}

export default function MathText({ content, className = '' }: MathTextProps) {
  // Kiểm tra xem chuỗi có chứa thẻ HTML không
  const hasHtml = /<[a-z][\s\S]*>/i.test(content);

  const renderedHtml = useMemo(() => {
    if (!hasHtml) return content;
    
    // Thay thế các công thức $...$ bằng chuỗi HTML của KaTeX
    // Dùng try-catch ẩn qua throwOnError: false để tránh sập app nếu công thức lỗi
    return content.replace(/\$([^$]+)\$/g, (match, math) => {
      try {
        return katex.renderToString(math, { throwOnError: false });
      } catch (e) {
        return match;
      }
    });
  }, [content, hasHtml]);

  if (hasHtml) {
    return (
      <div 
        className={`latex-font ${className}`}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    );
  }

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
