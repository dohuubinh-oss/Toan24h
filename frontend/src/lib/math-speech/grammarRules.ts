export interface GrammarRule {
  name: string
  pattern: RegExp
  replace: string | ((substring: string, ...args: any[]) => string)
}

export const GRAMMAR_RULES: GrammarRule[] = [
  // 1. Hệ phương trình
  {
    name: 'system_of_equations',
    pattern: /hệ phương trình\s+(.*?)\s+(?:và|phẩy|,)\s+(.*)/gi,
    replace: (_m, eq1, eq2) => `\\begin{cases} ${eq1.trim()} \\\\ ${eq2.trim()} \\end{cases}`,
  },

  // 2. Căn bậc n (ví dụ: căn bậc 3 của 8 -> \sqrt[3]{8}, căn bậc 2 -> \sqrt{...})
  {
    name: 'nth_root',
    pattern: /căn bậc\s+(\d+|[a-zA-Z])\s+của\s+([^+\-=:<>\n]+)/gi,
    replace: (_m, n, expr) => {
      const cleanExpr = expr.trim()
      if (n === '2') {
        return `\\sqrt{${cleanExpr}}`
      }
      return `\\sqrt[${n}]{${cleanExpr}}`
    },
  },

  // 3. Căn bậc hai (ví dụ: căn bậc hai của 3x + 5 -> \sqrt{3x + 5}, căn của x -> \sqrt{x})
  {
    name: 'sqrt',
    pattern: /căn(?: bậc hai)?(?: của)?\s+([^+\-=:<>\n]+)/gi,
    replace: (_m, expr) => `\\sqrt{${expr.trim()}}`,
  },

  // 4. Phân số rõ ràng: "phân số A trên B" hoặc "phân số A phần B"
  {
    name: 'fraction_explicit',
    pattern: /phân số\s+(.*?)\s+(?:trên|phần)\s+([^+\-=:<>\n]+)/gi,
    replace: (_m, num, den) => `\\frac{${num.trim()}}{${den.trim()}}`,
  },

  // 5. Phân số rút gọn: "3 phần 4", "-b trên a"
  {
    name: 'fraction_short',
    pattern: /(-?[a-zA-Z0-9_\^\\]+)\s+(?:phần|trên)\s+([a-zA-Z0-9_\^\\]+)/gi,
    replace: (_m, num, den) => {
      if (num.startsWith('-')) {
        return `-\\frac{${num.slice(1)}}{${den}}`
      }
      return `\\frac{${num}}{${den}}`
    },
  },

  // 6. Hình học: Tam giác (tam giác ABC, tam giác A'B'C')
  {
    name: 'triangle',
    pattern: /tam giác\s+([A-Za-z']{3}|[A-Za-z]\s*'\s*[A-Za-z]\s*'\s*[A-Za-z]\s*')/gi,
    replace: (_m, letters) => `\\Delta ${letters.replace(/\s+/g, '')}`,
  },

  // 7. Hình học: Góc (góc BAC, góc A)
  {
    name: 'angle',
    pattern: /góc\s+([A-Za-z']{1,3})/gi,
    replace: (_m, letters) => `\\widehat{${letters}}`,
  },

  // 8. Hình học: Vectơ (vectơ AB, vectơ 0)
  {
    name: 'vector',
    pattern: /vectơ\s+([A-Za-z]{1,2}|\d)/gi,
    replace: (_m, name) => `\\vec{${name}}`,
  },

  // 9. Lượng giác có lũy thừa (sin bình phương x -> \sin^2 x)
  {
    name: 'trig_power',
    pattern: /(sin|cos|tan|cot)\s+bình(?:\s+phương)?\s+([a-zA-Z0-9\\]+)/gi,
    replace: (_m, trig, arg) => `\\${trig}^2 ${arg}`,
  },

  // 10. Lượng giác cơ bản (sin x -> \sin x)
  {
    name: 'trig_basic',
    pattern: /(sin|cos|tan|cot)\s+([a-zA-Z0-9\\]+)/gi,
    replace: (_m, trig, arg) => `\\${trig} ${arg}`,
  },

  // 11. Lũy thừa bình phương / lập phương / mũ n
  {
    name: 'power_square',
    pattern: /([a-zA-Z0-9\\)\}\]]+)\s+bình(?:\s+phương)?/gi,
    replace: '$1^2',
  },
  {
    name: 'power_cube',
    pattern: /([a-zA-Z0-9\\)\}\]]+)\s+lập(?:\s+phương)?/gi,
    replace: '$1^3',
  },
  {
    name: 'power_n',
    pattern: /([a-zA-Z0-9\\)\}\]]+)\s+mũ\s+([a-zA-Z0-9]+)/gi,
    replace: (_m, base, exp) => (exp.length === 1 ? `${base}^${exp}` : `${base}^{${exp}}`),
  },

  // 12. Chỉ số dưới cho biến đơn lẻ (x 1 -> x_1, d1 -> d_1)
  {
    name: 'subscript',
    pattern: /(^|[\s+\-=:(])([a-zA-Z])\s*(\d+)\b/gi,
    replace: '$1$2_$3',
  },

  // 13. Độ: 60 độ -> 60^\circ (không dùng \b sau độ)
  {
    name: 'degree',
    pattern: /(\d+)\s+độ(?![a-zA-Z0-9_àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ])/gi,
    replace: '$1^\\circ',
  },

  // 14. Từ thừa hình học: "đường thẳng d1" -> "d1"
  {
    name: 'clean_line',
    pattern: /đường thẳng\s+/gi,
    replace: '',
  },

  // 15. Quan hệ hình học & đại số
  { name: 'similar', pattern: /\s+đồng dạng(?:\s+với)?\s+/gi, replace: ' \\sim ' },
  { name: 'parallel', pattern: /\s+song song(?:\s+với)?\s+/gi, replace: ' \\parallel ' },
  { name: 'perpendicular', pattern: /\s+vuông góc(?:\s+với)?\s+/gi, replace: ' \\perp ' },
  { name: 'gte', pattern: /\s+lớn hơn hoặc bằng\s+/gi, replace: ' \\ge ' },
  { name: 'lte', pattern: /\s+nhỏ hơn hoặc bằng\s+/gi, replace: ' \\le ' },
  { name: 'gt', pattern: /\s+lớn hơn\s+/gi, replace: ' > ' },
  { name: 'lt', pattern: /\s+nhỏ hơn\s+/gi, replace: ' < ' },
  { name: 'equal', pattern: /\s+bằng\s+/gi, replace: ' = ' },
  { name: 'plus', pattern: /\s+cộng\s+/gi, replace: ' + ' },
  { name: 'minus', pattern: /\s+trừ\s+/gi, replace: ' - ' },
  { name: 'times', pattern: /\s+nhân\s+/gi, replace: ' \\cdot ' },
  { name: 'divide', pattern: /\s+chia\s+/gi, replace: ' : ' },
]
