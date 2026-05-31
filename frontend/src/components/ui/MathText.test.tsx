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
});
