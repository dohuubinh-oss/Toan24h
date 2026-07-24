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
    
    // Thay thế các công thức $$...$$, \[...\], $...$, \(...\) bằng chuỗi HTML của KaTeX
    return content.replace(/\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]|\$([^$]+)\$|\\\(([\s\S]*?)\\\)/g, (match, b1, b2, i1, i2) => {
      const math = b1 || b2 || i1 || i2;
      const isBlock = !!(b1 || b2);
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

  // Hàm đơn giản phân tách text thường và text latex
  const parts = content.split(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^$]+\$|\\\([\s\S]*?\\\))/g);

  return (
    <div className={`latex-font ${className}`}>
      {parts.map((part, index) => {
        if ((part.startsWith('$$') && part.endsWith('$$')) || (part.startsWith('\\[') && part.endsWith('\\]'))) {
          const math = part.startsWith('$$') ? part.slice(2, -2) : part.slice(2, -2);
          return <BlockMath math={math} key={index} />;
        }
        if ((part.startsWith('$') && part.endsWith('$')) || (part.startsWith('\\(') && part.endsWith('\\)'))) {
          const math = part.startsWith('$') ? part.slice(1, -1) : part.slice(2, -2);
          return <InlineMath math={math} key={index} />;
        }
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
}
