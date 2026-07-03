import React, { useMemo } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
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
    
    // Thay thế các công thức $$...$$ hoặc $...$ bằng chuỗi HTML của KaTeX
    return content.replace(/\$\$([\s\S]*?)\$\$|\$([^$]+)\$/g, (match, math1, math2) => {
      const math = math1 || math2;
      const isBlock = !!math1;
      try {
        return katex.renderToString(math, { throwOnError: false, displayMode: isBlock });
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

  // Hàm đơn giản phân tách text thường và text latex bọc trong $$...$$ hoặc $...$
  const parts = content.split(/(\$\$[\s\S]*?\$\$|\$.*?\$)/g);

  return (
    <div className={`latex-font ${className}`}>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2);
          return <BlockMath math={math} key={index} />;
        }
        if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1);
          return <InlineMath math={math} key={index} />;
        }
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
}
