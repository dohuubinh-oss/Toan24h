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

export function decodeMathEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&le;/gi, '\\le ')
    .replace(/&ge;/gi, '\\ge ')
    .replace(/&ne;/gi, '\\ne ')
    .replace(/&plusmn;/gi, '\\pm ')
    .replace(/&times;/gi, '\\times ')
    .replace(/&divide;/gi, '\\div ')
    .replace(/&hellip;/gi, '\\dots ')
    .replace(/&sim;/gi, '\\sim ')
    .replace(/&approx;/gi, '\\approx ')
    .replace(/&isin;/gi, '\\in ')
    .replace(/&infin;/gi, '\\infty ')
    .replace(/&radic;/gi, '\\sqrt ')
    .replace(/&empty;/gi, '\\emptyset ')
    .replace(/&nabla;/gi, '\\nabla ')
    .replace(/&minus;/gi, '-')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

const LATEX_COMMANDS = 'dfrac|frac|cfrac|sqrt|root|int|iint|iiint|oint|sum|prod|coprod|lim|limsup|liminf|alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|theta|vartheta|iota|kappa|lambda|mu|nu|xi|pi|varpi|rho|varrho|sigma|varsigma|tau|upsilon|phi|varphi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|infty|partial|nabla|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|begin|end|vec|overrightarrow|overleftarrow|overline|underline|cdot|pm|mp|times|div|leq|geq|le|ge|neq|ne|approx|sim|simeq|equiv|cong|in|notin|ni|subset|supset|subseteq|supseteq|cup|cap|setminus|widehat|hat|tilde|widetilde|degree|dots|ldots|cdots|vdots|ddots|to|rightarrow|leftarrow|Rightarrow|Leftarrow|Leftrightarrow|iff|implies|angle|measuredangle|parallel|perp|text|mathrm|mathbf|mathit|mathbb|mathcal|left|right';

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

  // Kiểm tra xem chuỗi có chứa thẻ HTML chuẩn không
  const hasHtml = /<(?:p|div|span|h[1-6]|ul|ol|li|table|tr|td|th|tbody|thead|img|br|strong|b|em|i|u|s|sub|sup|blockquote|code|pre|math-inline)[\s>/]/i.test(textContent);

  const renderedHtml = useMemo(() => {
    if (!hasHtml) return textContent;
    
    // 1. Convert TipTap math tags to latex delimiters with decoded entities
    let processed = textContent
      .replace(/<(?:math-inline|span[^>]*data-type="math")[^>]*(?:data-latex|latex)=["']([^"']*)["'][^>]*>[\s\S]*?<\/(?:math-inline|span)>/gi, (_, latex) => {
        return `$${decodeMathEntities(latex)}$`;
      })
      .replace(/<math-inline[^>]*>([\s\S]*?)<\/math-inline>/gi, (_, inner) => {
        return inner;
      });

    // 2. Replace relative /uploads/ image sources with absolute backend URL for reliable rendering
    const apiBase = typeof window !== 'undefined'
      ? (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '') : 'https://api.toan6789.vn')
      : (process.env.BACKEND_URL || 'https://api.toan6789.vn');

    processed = processed.replace(/<img([^>]+)src=["'](\/uploads\/[^"']+)["']/gi, (match, before, srcPath) => {
      const fullUrl = `${apiBase.replace(/\/+$/, '')}/${srcPath.replace(/^\/+/, '')}`;
      return `<img${before}src="${fullUrl}"`;
    });

    // 3. Thay thế các công thức $$...$$, \[...\], $...$, \(...\) bằng chuỗi HTML của KaTeX
    processed = processed.replace(/\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]|\$([^$]+)\$|\\\(([\s\S]*?)\\\)/g, (match, b1, b2, i1, i2) => {
      const rawMath = b1 || b2 || i1 || i2;
      const isBlock = !!(b1 || b2);
      const math = decodeMathEntities(rawMath);
      try {
        return katex.renderToString(math, { throwOnError: false, displayMode: isBlock });
      } catch (e) {
        return match;
      }
    });

    // 4. Also convert any unwrapped LaTeX commands remaining inside HTML text (e.g. <p>\frac{1}{2}</p>, <p>\hat{A}</p>)
    const unwrappedRegex = new RegExp(`>([^<]*?\\\\(?:${LATEX_COMMANDS})[^<]*?)<`, 'g');
    processed = processed.replace(unwrappedRegex, (match, innerText) => {
      try {
        const decoded = decodeMathEntities(innerText.trim());
        const rendered = katex.renderToString(decoded, { throwOnError: false, displayMode: false });
        if (rendered.includes('katex-error')) {
          return match;
        }
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

  // Hàm đơn giản phân tách text thường và text latex khi không có thẻ HTML
  let processedContent = textContent;
  if (textContent && !/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^$]+\$|\\\([\s\S]*?\\\))/.test(textContent)) {
    if (new RegExp(`\\\\(?:${LATEX_COMMANDS})`).test(textContent)) {
      processedContent = `$${textContent}$`;
    }
  }

  const parts = processedContent.split(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^$]+\$|\\\([\s\S]*?\\\))/g);

  return (
    <div className={`latex-font ${className}`}>
      {parts.map((part, index) => {
        if ((part.startsWith('$$') && part.endsWith('$$')) || (part.startsWith('\\[') && part.endsWith('\\]'))) {
          const math = decodeMathEntities(part.slice(2, -2));
          return <BlockMath math={math} key={index} />;
        }
        if ((part.startsWith('$') && part.endsWith('$')) || (part.startsWith('\\(') && part.endsWith('\\)'))) {
          const math = decodeMathEntities(part.startsWith('$') ? part.slice(1, -1) : part.slice(2, -2));
          return <InlineMath math={math} key={index} />;
        }
        return <span key={index}>{decodeMathEntities(part)}</span>;
      })}
    </div>
  );
}
