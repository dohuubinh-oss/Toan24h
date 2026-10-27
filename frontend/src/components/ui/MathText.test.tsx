import React from 'react';
import { render } from '@testing-library/react';
import MathText from './MathText';
import { describe, it, expect } from 'vitest';

describe('MathText', () => {
  it('renders plain text correctly', () => {
    const { getByText } = render(<MathText content="Hello world" />);
    expect(getByText('Hello world')).toBeInTheDocument();
  });

  it('renders inline math wrapped in $', () => {
    const { container } = render(<MathText content="Math $x = 1$ test" />);
    // When math is rendered by KaTeX, it typically creates elements with 'katex' class
    const katexElement = container.querySelector('.katex');
    expect(katexElement).toBeInTheDocument();
    expect(container.textContent).toContain('Math ');
    expect(container.textContent).toContain(' test');
  });

  it('renders HTML content correctly without escaping tags', () => {
    const { container } = render(<MathText content="<p><strong>Bold</strong> Math $x = 1$ test</p>" />);
    
    // The strong tag should be rendered as HTML, not as text
    const strongElement = container.querySelector('strong');
    expect(strongElement).toBeInTheDocument();
    expect(strongElement?.textContent).toBe('Bold');
    
    // The p tag should be rendered
    const pElement = container.querySelector('p');
    expect(pElement).toBeInTheDocument();
    
    // Math should still be rendered
    const katexElement = container.querySelector('.katex');
    expect(katexElement).toBeInTheDocument();
  });

  it('renders raw LaTeX commands like \\dfrac without delimiters', () => {
    const { container } = render(<MathText content="\\dfrac{5x^2 - 3x + 1}{x}" />);
    const katexElement = container.querySelector('.katex');
    expect(katexElement).toBeInTheDocument();
  });

  it('renders \\( \\) and \\[ \\] delimiters correctly', () => {
    const { container } = render(<MathText content={'\\(x^2 + 1\\) and \\(\\frac{1}{2}\\)'} />);
    const katexElements = container.querySelectorAll('.katex');
    expect(katexElements.length).toBe(2);
  });

  it('renders unwrapped LaTeX inside HTML tags correctly', () => {
    const { container } = render(<MathText content="<p>-\\dfrac{1}{5} x^4 y^5</p>" />);
    const katexElement = container.querySelector('.katex');
    expect(katexElement).toBeInTheDocument();
  });

  it('renders math-inline tag with latex attribute correctly', () => {
    const { container } = render(<MathText content='<p><math-inline latex="-\dfrac{3}{4} x^3 y + 7x">$-\dfrac{3}{4} x^3 y + 7x$</math-inline></p>' />);
    const katexElement = container.querySelector('.katex');
    expect(katexElement).toBeInTheDocument();
  });

  it('renders unwrapped LaTeX like x = \\pm 2 as KaTeX without delimiters', () => {
    const { container } = render(<MathText content="x = \pm 2" />);
    const katexElement = container.querySelector('.katex');
    expect(katexElement).toBeInTheDocument();
  });

  it('automatically formats structured solution guide JSON string into rich steps', () => {
    const jsonStr = JSON.stringify({
      steps: [
        { step: 1, title: 'Bước 1: Rút gọn', content: 'Ta có $A = 2$' }
      ],
      conclusion: 'Vậy ta có $A = 2$'
    });
    const { container, getByText } = render(<MathText content={jsonStr} />);
    expect(getByText('Bước 1: Rút gọn')).toBeInTheDocument();
    expect(getByText('Kết luận')).toBeInTheDocument();
    expect(container.textContent).not.toContain('{"steps":');
  });

  it('automatically formats structured solution guide object into rich steps', () => {
    const guideObj = {
      steps: [
        { step: 1, title: 'Bước 1: Giải phương trình', content: 'Nghiệm là $x = 1$' }
      ],
      conclusion: 'Vậy nghiệm là $x = 1$'
    };
    const { container, getByText } = render(<MathText content={guideObj} />);
    expect(getByText('Bước 1: Giải phương trình')).toBeInTheDocument();
    expect(container.textContent).not.toContain('[object Object]');
  });

  it('renders math-inline with escaped HTML entities like &lt; and \\dots without error', () => {
    const htmlContent = '<p>b) <math-inline latex="4,3 + 2,1 &lt; \\dots &lt; 8,25" data-latex="4,3 + 2,1 &lt; \\dots &lt; 8,25">$4,3 + 2,1 &lt; \\dots &lt; 8,25$</math-inline></p>';
    const { container } = render(<MathText content={htmlContent} />);
    const katexElement = container.querySelector('.katex');
    expect(katexElement).toBeInTheDocument();
    expect(container.querySelector('.katex-error')).not.toBeInTheDocument();
    expect(container.textContent).toContain('b)');
  });

  it('renders inline math with &lt; and &gt; correctly in plain text without HTML tags', () => {
    const content = 'Điền số: $38,15 &lt; \\dots &lt; 39,02$';
    const { container } = render(<MathText content={content} />);
    const katexElement = container.querySelector('.katex');
    expect(katexElement).toBeInTheDocument();
    expect(container.querySelector('.katex-error')).not.toBeInTheDocument();
  });

  it('renders markdown headers, lists and bold formatting with math', () => {
    const md = `### Tiêu đề bài học
1. Bước 1: Tính $x = 1$
- Chú ý: Bấm **SHIFT** + **FACT**`
    const { container } = render(<MathText content={md} />);
    expect(container.querySelector('h3')).toBeInTheDocument();
    expect(container.querySelector('ol')).toBeInTheDocument();
    expect(container.querySelector('ul')).toBeInTheDocument();
    expect(container.querySelector('strong')).toBeInTheDocument();
    expect(container.querySelector('.katex')).toBeInTheDocument();
  });
});
