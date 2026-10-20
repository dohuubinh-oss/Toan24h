import React, { useMemo } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import katex from 'katex';
import DOMPurify from 'isomorphic-dompurify';



const LATEX_COMMANDS = [
  'dfrac', 'frac', 'cfrac', 'sqrt', 'int', 'iint', 'iiint', 'oint', 'sum', 'prod', 'coprod', 'lim', 'limsup', 'liminf',
  'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon', 'zeta', 'eta', 'theta', 'vartheta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'pi', 'varpi', 'rho', 'sigma', 'varsigma', 'tau', 'upsilon', 'phi', 'varphi', 'chi', 'psi', 'omega',
  'Delta', 'Gamma', 'Theta', 'Lambda', 'Xi', 'Pi', 'Sigma', 'Phi', 'Psi', 'Omega',
  'infty', 'matrix', 'pmatrix', 'bmatrix', 'vmatrix', 'Vmatrix', 'cases', 'begin', 'end',
  'vec', 'overline', 'underline', 'widehat', 'widetilde', 'dot', 'ddot', 'cdot', 'cdots', 'ldots', 'ddots', 'vdots',
  'pm', 'mp', 'times', 'div', 'ast', 'star', 'circ', 'bullet',
  'leq', 'geq', 'le', 'ge', 'neq', 'ne', 'approx', 'sim', 'simeq', 'cong', 'equiv', 'propto',
  'in', 'notin', 'ni', 'subset', 'supset', 'subseteq', 'supseteq', 'cup', 'cap', 'setminus', 'emptyset', 'varnothing',
  'forall', 'exists', 'nexists', 'degree', 'angle', 'measuredangle', 'sphericalangle', 'perp', 'parallel', 'left', 'right',
  'rightarrow', 'to', 'leftarrow', 'gets', 'leftrightarrow', 'Rightarrow', 'Leftarrow', 'Leftrightarrow', 'iff', 'implies', 'mapsto',
  'partial', 'nabla', 'log', 'ln', 'lg', 'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan',
  'sinh', 'cosh', 'tanh', 'coth', 'max', 'min', 'sup', 'inf', 'arg', 'det', 'dim', 'gcd', 'hom', 'ker', 'Pr',
  'text', 'textrm', 'textbf', 'textit', 'mathrm', 'mathbf', 'mathit', 'mathbb', 'mathcal', 'mathscr', 'mathfrak', 'operatorname'
];

const LATEX_REGEX = new RegExp('\\\\(?:' + LATEX_COMMANDS.join('|') + ')\\b', 'i');

const isPureMath = (str: string): boolean => {
  const trimmed = str.trim();
  if (!trimmed) return false;
  // If contains Vietnamese accents, not pure math formula
  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(trimmed)) {
    return false;
  }
  // Ignore English sentence words
  if (/\b(or|and|where|with|for|if|then|else|the|is|are)\b/i.test(trimmed)) {
    return false;
  }
  // Must contain math indicators like =, <, >, ^, _, +, -, *, /, or semicolon separated equations
  const hasMathIndicator = /[=<>^_]|;|\b[a-zA-Z]\b\s*[\+\-\*\/]/.test(trimmed);
  if (!hasMathIndicator) return false;
  return /^[a-zA-Z0-9\s\+\-\*\/\=\<\>\^\_\(\)\[\]\{\}\;\,\:\.\'\"]+$/.test(trimmed);
};

const hasLatexCommands = (str: string): boolean => LATEX_REGEX.test(str);

interface MathTextProps {
  content: string;
  className?: string;
}

export default function MathText({ content, className = '' }: MathTextProps) {
  if (!content) return null;

  // Kiểm tra xem chuỗi có chứa thẻ HTML không
  const hasHtml = /<[a-z][\s\S]*>/i.test(content);

  const renderedHtml = useMemo(() => {
    if (!hasHtml) return content;
    
    // Convert TipTap math tags to latex delimiters
    let processed = content
      .replace(/<math-inline[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*?<\/math-inline>/gi, (_, latex) => {
        const decoded = latex.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        return `$${decoded}$`;
      })
      .replace(/<math-inline[^>]*latex="([^"]*)"[^>]*>[\s\S]*?<\/math-inline>/gi, (_, latex) => {
        const decoded = latex.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        return `$${decoded}$`;
      })
      .replace(/<span[^>]*data-type="math"[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*?<\/span>/gi, (_, latex) => {
        const decoded = latex.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        return `$${decoded}$`;
      })
      .replace(/<span[^>]*data-type="math"[^>]*latex="([^"]*)"[^>]*>[\s\S]*?<\/span>/gi, (_, latex) => {
        const decoded = latex.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        return `$${decoded}$`;
      });

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
      } catch {
        return match;
      }
    });

    // Also convert any unwrapped LaTeX commands or pure math equations remaining inside HTML text (e.g. <p>\frac{1}{2}</p> or <p>x = \pm 2</p> or <p>x = 2; x = 3</p>)
    processed = processed.replace(/>([^<]+)(<)/g, (match, textContent, closingBracket) => {
      const trimmed = textContent.trim();
      if (!trimmed) return match;
      if (hasLatexCommands(trimmed) || isPureMath(trimmed)) {
        try {
          const rendered = katex.renderToString(trimmed, { throwOnError: false, displayMode: false });
          return `>${rendered}${closingBracket}`;
        } catch {
          return match;
        }
      }
      return match;
    });

    return processed;
  }, [content, hasHtml]);

  if (hasHtml) {
    const cleanHtml = DOMPurify.sanitize(renderedHtml);
    return (
      <div 
        className={`latex-font ${className}`}
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    );
  }

  // Phân tách text thường và text latex khi không có HTML
  let processedContent = content;

  // Nếu chuỗi chưa có ký hiệu bọc $, $$, \(, \[
  if (!/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^$]+\$|\\\([\s\S]*?\\\))/.test(content)) {
    if (isPureMath(content) || (hasLatexCommands(content) && !/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(content))) {
      processedContent = `$${content.trim()}$`;
    } else if (hasLatexCommands(content)) {
      // Mixed text with unwrapped LaTeX, e.g. "Đáp án: x = \pm 2"
      processedContent = content.replace(/([a-zA-Z0-9_\^\{\}\+\-\=\/\(\)\,\;\s]*\\[a-zA-Z]+[a-zA-Z0-9_\^\{\}\+\-\=\/\(\)\,\;\s\\]*)/g, (m) => `$${m.trim()}$`);
    }
  }

  const parts = processedContent.split(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^$]+\$|\\\([\s\S]*?\\\))/g);

  return (
    <div className={`latex-font ${className}`}>
      {parts.map((part, index) => {
        if (!part) return null;
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
