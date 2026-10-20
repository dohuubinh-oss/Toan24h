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

  it('renders pure math equations like x = 2; x = 3 as KaTeX', () => {
    const { container } = render(<MathText content="x = 2; x = 3" />);
    const katexElement = container.querySelector('.katex');
    expect(katexElement).toBeInTheDocument();
  });

  it('renders pure math equations like S = 6 as KaTeX', () => {
    const { container } = render(<MathText content="S = 6" />);
    const katexElement = container.querySelector('.katex');
    expect(katexElement).toBeInTheDocument();
  });

  it('renders HTML paragraph with pure math equations as KaTeX', () => {
    const { container } = render(<MathText content="<p>x = 2; x = 3</p>" />);
    const katexElement = container.querySelector('.katex');
    expect(katexElement).toBeInTheDocument();
  });
});
