import { describe, it, expect } from 'vitest';
import {
  normalizeVietnameseMath,
  containsVietnamese,
  wrapStandaloneLatex,
  hasBalancedBraces,
  hasBalancedEnvironments,
  healBrokenMathSplits,
  cleanFormula
} from './mathTextCleaner';

describe('mathTextCleaner', () => {
  it('correctly identifies Vietnamese text', () => {
    expect(containsVietnamese('hệ số')).toBe(true);
    expect(containsVietnamese('với mọi x')).toBe(true);
    expect(containsVietnamese('x^2 + 1')).toBe(false);
    expect(containsVietnamese('\\frac{1}{2}')).toBe(false);
  });

  it('checks brace balancing accurately', () => {
    expect(hasBalancedBraces('x^2 + 1')).toBe(true);
    expect(hasBalancedBraces('\\frac{1}{2}')).toBe(true);
    expect(hasBalancedBraces('\\underbrace{a.a......a}_{n\\text{ thừa số a}}')).toBe(true);
    expect(hasBalancedBraces('a^n = \\underbrace{a.a......a}_{n')).toBe(false);
    expect(hasBalancedBraces('} (n \\in \\mathbb{N}^*)')).toBe(false);
    expect(hasBalancedBraces('\\{x \\mid x > 0\\}')).toBe(true);
  });

  it('checks environment balancing accurately', () => {
    expect(hasBalancedEnvironments('\\begin{cases} x = 1 \\\\ y = 2 \\end{cases}')).toBe(true);
    expect(hasBalancedEnvironments('\\begin{cases} x = 1')).toBe(false);
  });

  it('wraps standalone LaTeX commands with dollar delimiters', () => {
    expect(wrapStandaloneLatex('Dạng 2. Sử dụng các kí hiệu \\in và \\notin')).toBe(
      'Dạng 2. Sử dụng các kí hiệu $\\in$ và $\\notin$'
    );
    expect(wrapStandaloneLatex('Biểu thức P = \\frac{1}{x} + \\sqrt{x}')).toBe(
      'Biểu thức P = $\\frac{1}{x}$ + $\\sqrt{x}$'
    );
    expect(wrapStandaloneLatex('Cho $x \\in \\mathbb{R}$ và $\\alpha$')).toBe(
      'Cho $x \\in \\mathbb{R}$ và $\\alpha$'
    );
  });

  it('strips math delimiters from pure Vietnamese text', () => {
    expect(normalizeVietnameseMath('$\\text{Dạng 1. Nhận biết đơn thức}$')).toBe('Dạng 1. Nhận biết đơn thức');
    expect(normalizeVietnameseMath('$Nhận biết đa thức bậc hai$')).toBe('Nhận biết đa thức bậc hai');
  });

  it('extracts leading Vietnamese text out of math mode at root level', () => {
    expect(normalizeVietnameseMath('$\\text{với mọi } x > 0$')).toBe('với mọi $x > 0$');
    expect(normalizeVietnameseMath('$với mọi x > 0$')).toBe('với mọi $x > 0$');
    expect(normalizeVietnameseMath('$\\text{hệ số } a$')).toBe('hệ số $a$');
  });

  it('extracts trailing Vietnamese text out of math mode at root level', () => {
    expect(normalizeVietnameseMath('$x > 0 \\text{ (thỏa mãn)}$')).toBe('$x > 0$ (thỏa mãn)');
    expect(normalizeVietnameseMath('$x > 0 thỏa mãn$')).toBe('$x > 0$ thỏa mãn');
    expect(normalizeVietnameseMath('$x = 2 \\text{ (loại)}$')).toBe('$x = 2$ (loại)');
  });

  it('splits middle Vietnamese text and wraps math parts cleanly when at root level', () => {
    expect(normalizeVietnameseMath('$x = 1 \\text{ hoặc } x = -1$')).toBe('$x = 1$ hoặc $x = -1$');
    expect(normalizeVietnameseMath('$x \\in A \\text{ và } x \\notin B$')).toBe('$x \\in A$ và $x \\notin B$');
  });

  it('preserves complex LaTeX expressions like underbrace with nested text intact', () => {
    const input = 'Áp dụng công thức $a^n = \\underbrace{a.a......a}_{n\\text{ thừa số a}} (n \\in \\mathbb{N}^*)$ để tính giá trị các lũy thừa';
    const output = normalizeVietnameseMath(input);
    expect(output).toBe('Áp dụng công thức $a^n = \\underbrace{a.a......a}_{n\\text{ thừa số a}} (n \\in \\mathbb{N}^*)$ để tính giá trị các lũy thừa');
  });

  it('preserves environments like cases with nested text intact', () => {
    const input = '$\\begin{cases} x = 1 & \\text{khi } y > 0 \\\\ x = 0 & \\text{khi } y \\le 0 \\end{cases}$';
    const output = normalizeVietnameseMath(input);
    expect(output).toBe(input);
  });

  it('heals previously broken math splits back into an intact formula', () => {
    const broken = 'Áp dụng công thức $a^n = \\underbrace{a.a......a}_{n$ thừa số a $} (n \\in \\mathbb{N}^*)$ để tính giá trị các lũy thừa';
    const healed = normalizeVietnameseMath(broken);
    expect(healed).toContain('\\underbrace{a.a......a}_{n');
    expect(healed).toContain('\\text{ thừa số a }');
    expect(healed).toContain('(n \\in \\mathbb{N}^*)');
    // Ensure no broken dollar delimiters in the middle
    expect(healed).not.toContain('_{n$');
    expect(healed).not.toContain('$}');
  });

  it('handles mixed Vietnamese and LaTeX commands in a single string', () => {
    expect(normalizeVietnameseMath('$Dạng 2. Sử dụng các kí hiệu \\in và \\notin$')).toBe(
      'Dạng 2. Sử dụng các kí hiệu $\\in$ và $\\notin$'
    );
    expect(normalizeVietnameseMath('Dạng 2. Sử dụng các kí hiệu \\in và \\notin')).toBe(
      'Dạng 2. Sử dụng các kí hiệu $\\in$ và $\\notin$'
    );
  });

  it('wraps standalone underbrace command with complete arguments without slicing braces', () => {
    const raw = 'a^n = \\underbrace{a \\cdot a \\dots \\cdot a}_{n \\text{ thừa số } a}';
    const wrapped = wrapStandaloneLatex(raw);
    expect(wrapped).toBe('a^n = $\\underbrace{a \\cdot a \\dots \\cdot a}_{n \\text{ thừa số } a}$');
    expect(hasBalancedBraces(wrapped)).toBe(true);
  });

  it('cleans formula and preserves underbrace as a single intact formula', () => {
    const raw = 'a^n = \\underbrace{a \\cdot a \\dots \\cdot a}_{n \\text{ thừa số } a}';
    const cleaned = cleanFormula(raw);
    expect(cleaned).toBe('$$a^n = \\underbrace{a \\cdot a \\dots \\cdot a}_{n \\text{ thừa số } a}$$');
  });

  it('heals trailing plain text with closing brace from broken underbrace', () => {
    const broken = 'a^n = $\\underbrace{a \\cdot a \\dots \\cdot a}_{n$ \\text{ thừa số } a}';
    const healed = healBrokenMathSplits(broken);
    expect(healed).toBe('$a^n = \\underbrace{a \\cdot a \\dots \\cdot a}_{n \\text{ thừa số } a}$');
    expect(hasBalancedBraces(healed)).toBe(true);
  });

  it('heals trailing plain text with closing brace from broken math-inline underbrace', () => {
    const broken = 'a^n = <math-inline data-latex="\\underbrace{a \\cdot a \\dots \\cdot a}_{n">$\\underbrace{a \\cdot a \\dots \\cdot a}_{n$</math-inline> \\text{ thừa số } a}';
    const healed = healBrokenMathSplits(broken);
    expect(healed).toContain('<math-inline data-latex="a^n = \\underbrace{a \\cdot a \\dots \\cdot a}_{n \\text{ thừa số } a}">');
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
