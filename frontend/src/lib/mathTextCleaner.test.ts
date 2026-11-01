import { describe, it, expect } from 'vitest';
import { normalizeVietnameseMath, containsVietnamese, wrapStandaloneLatex } from './mathTextCleaner';

describe('mathTextCleaner', () => {
  it('correctly identifies Vietnamese text', () => {
    expect(containsVietnamese('hệ số')).toBe(true);
    expect(containsVietnamese('với mọi x')).toBe(true);
    expect(containsVietnamese('x^2 + 1')).toBe(false);
    expect(containsVietnamese('\\frac{1}{2}')).toBe(false);
  });

  it('wraps standalone LaTeX commands with dollar delimiters', () => {
    expect(wrapStandaloneLatex('Dạng 2. Sử dụng các kí hiệu \\in và \\notin')).toBe(
      'Dạng 2. Sử dụng các kí hiệu $\\in$ và $\\notin$'
    );
    expect(wrapStandaloneLatex('Biểu thức P = \\frac{1}{x} + \\sqrt{x}')).toBe(
      'Biểu thức P = $\\frac{1}{x}$ + $\\sqrt{x}$'
    );
    // Does not double-wrap if already wrapped
    expect(wrapStandaloneLatex('Cho $x \\in \\mathbb{R}$ và $\\alpha$')).toBe(
      'Cho $x \\in \\mathbb{R}$ và $\\alpha$'
    );
  });

  it('strips math delimiters from pure Vietnamese text', () => {
    expect(normalizeVietnameseMath('$\\text{Dạng 1. Nhận biết đơn thức}$')).toBe('Dạng 1. Nhận biết đơn thức');
    expect(normalizeVietnameseMath('$Nhận biết đa thức bậc hai$')).toBe('Nhận biết đa thức bậc hai');
  });

  it('extracts leading Vietnamese text out of math mode', () => {
    expect(normalizeVietnameseMath('$\\text{với mọi } x > 0$')).toBe('với mọi $x > 0$');
    expect(normalizeVietnameseMath('$với mọi x > 0$')).toBe('với mọi $x > 0$');
    expect(normalizeVietnameseMath('$\\text{hệ số } a$')).toBe('hệ số $a$');
  });

  it('extracts trailing Vietnamese text out of math mode', () => {
    expect(normalizeVietnameseMath('$x > 0 \\text{ (thỏa mãn)}$')).toBe('$x > 0$ (thỏa mãn)');
    expect(normalizeVietnameseMath('$x > 0 thỏa mãn$')).toBe('$x > 0$ thỏa mãn');
    expect(normalizeVietnameseMath('$x = 2 \\text{ (loại)}$')).toBe('$x = 2$ (loại)');
  });

  it('splits middle Vietnamese text and wraps math parts cleanly', () => {
    expect(normalizeVietnameseMath('$x = 1 \\text{ hoặc } x = -1$')).toBe('$x = 1$ hoặc $x = -1$');
    expect(normalizeVietnameseMath('$x \\in A \\text{ và } x \\notin B$')).toBe('$x \\in A$ và $x \\notin B$');
  });

  it('handles mixed Vietnamese and LaTeX commands in a single string', () => {
    expect(normalizeVietnameseMath('$Dạng 2. Sử dụng các kí hiệu \\in và \\notin$')).toBe(
      'Dạng 2. Sử dụng các kí hiệu $\\in$ và $\\notin$'
    );
    expect(normalizeVietnameseMath('Dạng 2. Sử dụng các kí hiệu \\in và \\notin')).toBe(
      'Dạng 2. Sử dụng các kí hiệu $\\in$ và $\\notin$'
    );
  });

  it('keeps standard math expressions untouched', () => {
    expect(normalizeVietnameseMath('$P(x) = x^2 + 2x + 1$')).toBe('$P(x) = x^2 + 2x + 1$');
    expect(normalizeVietnameseMath('Cho biểu thức $A = \\sqrt{x} > 0$')).toBe('Cho biểu thức $A = \\sqrt{x} > 0$');
  });

  it('handles empty or null inputs gracefully', () => {
    expect(normalizeVietnameseMath('')).toBe('');
    expect(normalizeVietnameseMath(null)).toBe('');
    expect(normalizeVietnameseMath(undefined)).toBe('');
  });
});
