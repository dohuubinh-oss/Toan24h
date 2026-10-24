import React, { useMemo } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import katex from 'katex';
import DOMPurify from 'isomorphic-dompurify';
import { formatSolutionGuide } from '../questions/creator/utils/questionTextFormatter';

interface MathTextProps {
  content: any;
  className?: string;
}

export default function MathText({ content, className = '' }: MathTextProps) {
  // Tự động nhận diện nếu content là object hoặc JSON string của lời giải chi tiết (solution_guide)
  let rawText = content;
  if (typeof rawText === 'object' && rawText !== null) {
    rawText = formatSolutionGuide(rawText);
  } else if (typeof rawText === 'string') {
    const trimmed = rawText.trim();
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}') && (trimmed.includes('"steps"') || trimmed.includes('"Steps"') || trimmed.includes('"problem"') || trimmed.includes('"conclusion"') || trimmed.includes('"analysis"'))) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']') && trimmed.includes('"step"'))
    ) {
      rawText = formatSolutionGuide(trimmed);
    }
  }

  // Đảm bảo rawText luôn là string
  const textContent = typeof rawText === 'string' ? rawText : '';

  // Kiểm tra xem chuỗi có chứa thẻ HTML không
  const hasHtml = /<[a-z][\s\S]*>/i.test(textContent);

  const renderedHtml = useMemo(() => {
    if (!hasHtml) return textContent;
    
    // Convert TipTap math tags to latex delimiters
    let processed = textContent
      .replace(/<math-inline[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*?<\/math-inline>/gi, '$$$1$$')
      .replace(/<math-inline[^>]*latex="([^"]*)"[^>]*>[\s\S]*?<\/math-inline>/gi, '$$$1$$')
      .replace(/<span[^>]*data-type="math"[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*?<\/span>/gi, '$$$1$$')
      .replace(/<span[^>]*data-type="math"[^>]*latex="([^"]*)"[^>]*>[\s\S]*?<\/span>/gi, '$$$1$$');

    // Replace relative /uploads/ image sources with absolute backend URL for reliable rendering
    const apiBase = typeof window !== 'undefined'
      ? (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '') : 'https://api.toan6789.vn')
      : (process.env.BACKEND_URL || 'https://api.toan6789.vn');

    processed = processed.replace(/<img([^>]+)src=["'](\/uploads\/[^"']+)["']/gi, (match, before, srcPath) => {
      const fullUrl = `${apiBase.replace(/\/+$/, '')}/${srcPath.replace(/^\/+/, '')}`;
      return `<img${before}src="${fullUrl}"`;
    });

    // Thay thế các công thức $$...$$, \[...\], $...$, \(...\) bằng chuỗi HTML của KaTeX
    processed = processed.replace(/\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]|\$([^$]+)\$|\\\(([\s\S]*?)\\\)/g, (match, b1, b2, i1, i2) => {
      const math = b1 || b2 || i1 || i2;
      const isBlock = !!(b1 || b2);
      try {
        return katex.renderToString(math, { throwOnError: false, displayMode: isBlock });
      } catch (e) {
        return match;
      }
    });

    // Also convert any unwrapped LaTeX commands remaining inside HTML text (e.g. <p>\frac{1}{2}</p>, <p>\hat{A}</p>)
    processed = processed.replace(/>([^<]*?\\(?:dfrac|frac|sqrt|int|sum|lim|alpha|beta|gamma|delta|pi|theta|infty|matrix|begin|vec|overline|cdot|pm|times|div|leq|geq|neq|approx|in|subset|cup|cap|widehat|hat|degree)[^<]*?)</g, (match, textContent) => {
      try {
        const rendered = katex.renderToString(textContent.trim(), { throwOnError: false, displayMode: false });
        return `>${rendered}<`;
      } catch {
        return match;
      }
    });

    return processed;
  }, [textContent, hasHtml]);

  if (hasHtml) {
    const cleanHtml = DOMPurify.sanitize(renderedHtml);
    return (
      <div 
        className={`latex-font ${className}`}
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    );
  }

  // Hàm đơn giản phân tách text thường và text latex
  let processedContent = textContent;
  // Nếu chuỗi chứa lệnh latex phổ biến (\dfrac, \frac, \sqrt, \int, \sum...) mà chưa được bọc $, $$, \(, \[
  if (textContent && !/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^$]+\$|\\\([\s\S]*?\\\))/.test(textContent)) {
    if (/\\(dfrac|frac|sqrt|int|sum|lim|alpha|beta|gamma|delta|pi|theta|infty|matrix|begin|vec|overline|cdot|pm|times|div|leq|geq|neq|approx|in|subset|cup|cap|widehat|degree)/.test(textContent)) {
      processedContent = `$${textContent}$`;
    }
  }

  const parts = processedContent.split(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^$]+\$|\\\([\s\S]*?\\\))/g);

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
