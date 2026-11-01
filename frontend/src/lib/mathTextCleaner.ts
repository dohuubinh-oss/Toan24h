const VIETNAMESE_CHAR_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/i;
const VIETNAMESE_WORD_REGEX = /\b(và|hoặc|với|mọi|thỏa|mãn|nghiệm|điều|kiện|dạng|bài|tập|phương|trình|hệ|số|đa|thức|đơn|thức|kí|hiệu|chú|ý|kết|quả|tìm|tính|chứng|minh|khi|nếu|loại|thừa)\b/i;

const LATEX_COMMANDS = 'dfrac|frac|cfrac|sqrt|root|int|iint|iiint|oint|sum|prod|coprod|lim|limsup|liminf|alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|theta|vartheta|iota|kappa|lambda|mu|nu|xi|pi|varpi|rho|varrho|sigma|varsigma|tau|upsilon|phi|varphi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|infty|partial|nabla|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|begin|end|vec|overrightarrow|overleftarrow|overline|underline|underbrace|overbrace|cdot|pm|mp|times|div|leq|geq|le|ge|neq|ne|approx|sim|simeq|equiv|cong|in|notin|ni|subset|supset|subseteq|supseteq|cup|cap|setminus|widehat|hat|tilde|widetilde|degree|dots|ldots|cdots|vdots|ddots|to|rightarrow|leftarrow|Rightarrow|Leftarrow|Leftrightarrow|iff|implies|angle|measuredangle|parallel|perp|mathrm|mathbf|mathit|mathbb|mathcal';

/**
 * Kiểm tra xem chuỗi có chứa ký tự hoặc từ tiếng Việt hay không
 */
export function containsVietnamese(str: string): boolean {
  if (!str) return false;
  return VIETNAMESE_CHAR_REGEX.test(str) || VIETNAMESE_WORD_REGEX.test(str);
}

/**
 * Đếm độ sâu dấu ngoặc nhọn { trừ } (bỏ qua dấu ngoặc thoát \{ hoặc \})
 */
export function countBraceDepth(str: string): number {
  if (!str) return 0;
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\\' && i + 1 < str.length) {
      i++;
      continue;
    }
    if (str[i] === '{') {
      depth++;
    } else if (str[i] === '}') {
      depth--;
    }
  }
  return depth;
}

/**
 * Kiểm tra chuỗi có số ngoặc nhọn { và } cân bằng và không bao giờ âm ở giữa chừng
 */
export function hasBalancedBraces(str: string): boolean {
  if (!str) return true;
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\\' && i + 1 < str.length) {
      i++;
      continue;
    }
    if (str[i] === '{') {
      depth++;
    } else if (str[i] === '}') {
      depth--;
      if (depth < 0) return false;
    }
  }
  return depth === 0;
}

/**
 * Kiểm tra các môi trường LaTeX \begin{...} và \end{...} có cân bằng hay không
 */
export function hasBalancedEnvironments(str: string): boolean {
  if (!str) return true;
  const begins = (str.match(/\\begin\{[^}]+\}/g) || []).length;
  const ends = (str.match(/\\end\{[^}]+\}/g) || []).length;
  return begins === ends;
}

/**
 * Tự động hàn gắn các biểu thức toán bị phân tách lỗi ngoặc từ trước.
 * Ví dụ: `$a^n = \underbrace{a.a......a}_{n$ thừa số a $} (n \in \mathbb{N}^*)$`
 * hoặc `<math-inline data-latex="a^n = \underbrace{a.a......a}_{n">...</math-inline> thừa số a <math-inline data-latex="} (n \in \mathbb{N}^*)">...</math-inline>`
 * sẽ được tự động hàn gắn lại thành 1 công thức toán hoàn chỉnh nguyên vẹn.
 */
export function healBrokenMathSplits(text: string): string {
  if (!text) return '';

  let healed = text;

  // 1. Hàn gắn $formula1$ textBetween $formula2$
  healed = healed.replace(/\$([^\$]+)\$([^\$<>\n]+?)\$([^\$]+)\$/g, (fullMatch, f1, textBetween, f2) => {
    const depth1 = countBraceDepth(f1);
    const depth2 = countBraceDepth(f2);

    if (depth1 > 0 && depth2 < 0 && depth1 + depth2 === 0) {
      const cleanText = textBetween.trim();
      const textLatex = cleanText ? `\\text{ ${cleanText} }` : ' ';
      return `$${f1.trim()} ${textLatex} ${f2.trim()}$`;
    }
    return fullMatch;
  });

  // 2. Hàn gắn thẻ <math-inline>...</math-inline> textBetween <math-inline>...</math-inline>
  healed = healed.replace(
    /<math-inline[^>]*?(?:data-latex|latex)="([^"]*)"[^>]*>[\s\S]*?<\/math-inline>([^<>\n]+?)<math-inline[^>]*?(?:data-latex|latex)="([^"]*)"[^>]*>[\s\S]*?<\/math-inline>/gi,
    (fullMatch, f1, textBetween, f2) => {
      const depth1 = countBraceDepth(f1);
      const depth2 = countBraceDepth(f2);

      if (depth1 > 0 && depth2 < 0 && depth1 + depth2 === 0) {
        const cleanText = textBetween.trim();
        const textLatex = cleanText ? `\\text{ ${cleanText} }` : ' ';
        const mergedLatex = `${f1.trim()} ${textLatex} ${f2.trim()}`;
        const escaped = mergedLatex.replace(/"/g, '&quot;');
        return `<math-inline data-latex="${escaped}">$${mergedLatex}$</math-inline>`;
      }
      return fullMatch;
    }
  );

  return healed;
}

interface TextToken {
  type: 'math' | 'text';
  content: string;
}

/**
 * Phân tích và trích xuất các khối \text{...} tiếng Việt CHỈ KHI chúng nằm ở cấp gốc (braceDepth === 0, envDepth === 0).
 * Tuyệt đối không trích xuất \text{...} nếu nó nằm bên trong các cấu trúc toán học lồng nhau như:
 * \underbrace{...}_{n\text{ thừa số a}}, \overbrace{...}^{...}, \frac{...}{...}, \begin{cases}...\end{cases}.
 */
export function splitTopLevelText(inner: string): TextToken[] | null {
  if (!inner.includes('\\text{')) return null;

  const tokens: TextToken[] = [];
  let currentMath = '';
  let braceDepth = 0;
  let envDepth = 0;
  let i = 0;
  let extractedAny = false;

  while (i < inner.length) {
    // Nhận diện \begin{...} và \end{...}
    if (inner.startsWith('\\begin{', i)) {
      envDepth++;
      currentMath += '\\begin{';
      i += 7;
      braceDepth++;
      continue;
    }
    if (inner.startsWith('\\end{', i)) {
      if (envDepth > 0) envDepth--;
      currentMath += '\\end{';
      i += 5;
      braceDepth++;
      continue;
    }

    // Nhận diện \text{ khi đang ở cấp gốc ngoài cùng (braceDepth === 0 && envDepth === 0)
    if (braceDepth === 0 && envDepth === 0 && inner.startsWith('\\text{', i)) {
      let textEnd = -1;
      let textBraceDepth = 0;
      for (let j = i + 5; j < inner.length; j++) {
        if (inner[j] === '\\' && j + 1 < inner.length) {
          j++;
          continue;
        }
        if (inner[j] === '{') textBraceDepth++;
        else if (inner[j] === '}') {
          textBraceDepth--;
          if (textBraceDepth === 0) {
            textEnd = j;
            break;
          }
        }
      }

      if (textEnd !== -1) {
        const textContent = inner.slice(i + 6, textEnd);
        if (containsVietnamese(textContent)) {
          const mathTrimmed = currentMath.trim();
          const isMathSafe = !mathTrimmed || (
            hasBalancedBraces(mathTrimmed) &&
            hasBalancedEnvironments(mathTrimmed) &&
            !/[_^\\|]$/.test(mathTrimmed)
          );

          if (isMathSafe) {
            if (currentMath) {
              tokens.push({ type: 'math', content: currentMath });
              currentMath = '';
            }
            tokens.push({ type: 'text', content: textContent });
            i = textEnd + 1;
            extractedAny = true;
            continue;
          }
        }
      }
    }

    if (inner[i] === '\\' && i + 1 < inner.length) {
      currentMath += inner[i] + inner[i + 1];
      i += 2;
      continue;
    }

    if (inner[i] === '{') {
      braceDepth++;
    } else if (inner[i] === '}') {
      if (braceDepth > 0) braceDepth--;
    }

    currentMath += inner[i];
    i++;
  }

  if (currentMath) {
    tokens.push({ type: 'math', content: currentMath });
  }

  if (!extractedAny) {
    return null;
  }

  // Đảm bảo mọi đoạn math sau khi tách đều có ngoặc nhọn cân bằng
  for (const tok of tokens) {
    if (tok.type === 'math') {
      const trimmed = tok.content.trim();
      if (trimmed) {
        if (!hasBalancedBraces(trimmed) || !hasBalancedEnvironments(trimmed) || /^[_\^]/.test(trimmed)) {
          return null;
        }
      }
    }
  }

  return tokens;
}

/**
 * Tự động bọc các lệnh LaTeX độc lập chưa có dấu $ (ví dụ: \in, \notin, \frac{1}{2}, \sqrt{x})
 * mà không ảnh hưởng đến các công thức đã bọc $ hoặc các thẻ HTML.
 */
export function wrapStandaloneLatex(text: string): string {
  if (!text) return '';

  // 1. Bảo vệ các khối công thức đã có $, $$, \(, \[ và thẻ HTML bằng placeholder
  const placeholders: string[] = [];
  let protectedText = text.replace(/<[^>]+>|\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^$]+\$|\\\([\s\S]*?\\\)/g, (match) => {
    placeholders.push(match);
    return `%%%PROTECTED_${placeholders.length - 1}%%%`;
  });

  // 2. Bọc các lệnh LaTeX đứng riêng lẻ bằng $...$
  const cmdRegex = new RegExp(`\\\\(?:${LATEX_COMMANDS})(?:\\{[^{}]*\\}|\\[[^\\[\\]]*\\])*(?:_[a-zA-Z0-9{}]+|\\^[a-zA-Z0-9{}]+)*`, 'g');
  protectedText = protectedText.replace(cmdRegex, (cmd) => `$${cmd}$`);

  // 3. Khôi phục các placeholder
  return protectedText.replace(/%%%PROTECTED_(\d+)%%%/g, (_, idx) => placeholders[Number(idx)] || '');
}

/**
 * Tự động làm sạch và tách chữ tiếng Việt ra khỏi dấu bọc công thức toán học ($...$ hoặc \(...\))
 * Giúp công thức toán KaTeX hiển thị chuẩn font, còn chữ tiếng Việt hiển thị bằng font web sắc nét.
 *
 * Đồng thời bảo toàn 100% tính toàn vẹn của các biểu thức toán phức tạp như \underbrace, \overbrace, \cases.
 */
export function normalizeVietnameseMath(text?: string | null): string {
  if (!text) return '';

  // 0. Tự động hàn gắn các biểu thức toán bị phân tách lỗi ngoặc từ trước
  let current = healBrokenMathSplits(text);

  // Bọc các lệnh LaTeX độc lập nếu người dùng gõ trực tiếp \in, \notin mà quên gõ dấu $
  current = wrapStandaloneLatex(current);
  let prev = '';
  let maxLoop = 5;

  while (current !== prev && maxLoop-- > 0) {
    prev = current;
    current = current.replace(/\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?\\\])|\$([^\$]+)\$|\\\(([\s\S]+?)\\\)/g, (match, b1, b2, i1, i2) => {
      const raw = b1 || b2 || i1 || i2;
      const isBlock = Boolean(b1 || b2);
      let inner = raw.trim();

      // Nếu không chứa tiếng Việt, giữ nguyên công thức toán
      if (!containsVietnamese(inner)) {
        return match;
      }

      // 1. Trường hợp toàn bộ khối toán là \text{...} tiếng Việt (ví dụ: $\text{Dạng 1. Nhận biết đơn thức}$)
      const pureTextMatch = inner.match(/^\\text\{([^}]+)\}$/);
      if (pureTextMatch && containsVietnamese(pureTextMatch[1])) {
        return pureTextMatch[1].trim();
      }

      // 2. Trường hợp là văn bản tiếng Việt thuần không có toán tử hoặc ký hiệu toán học
      const hasMathSymbols = /[=<>+\\^_{}\/]|\\(?:frac|sqrt|in|notin|le|ge|pm|times|div|cdot)/.test(inner);
      if (!hasMathSymbols && containsVietnamese(inner)) {
        return inner.replace(/\\text\{([^}]+)\}/g, '$1').trim();
      }

      // 3. Phân tách và trích xuất an toàn các khối \text{...} ở cấp gốc (depth === 0)
      const topLevelTokens = splitTopLevelText(inner);
      if (topLevelTokens && topLevelTokens.length > 0) {
        const converted = topLevelTokens.map(tok => {
          if (tok.type === 'text') {
            return ` ${tok.content.trim()} `;
          }
          const trimmed = tok.content.trim();
          if (!trimmed) return '';
          return isBlock ? `$$${trimmed}$$` : `$${trimmed}$`;
        }).join('').replace(/\$\$\s*\$\$/g, ' ').replace(/\$\s*\$/g, ' ').replace(/\s{2,}/g, ' ').trim();
        return converted;
      }

      // Nếu có \text{ mà splitTopLevelText trả về null, nghĩa là \text{ này nằm lồng bên trong cấu trúc
      // như \underbrace, \overbrace, \frac... -> Giữ nguyên công thức toán nguyên vẹn!
      if (inner.includes('\\text{')) {
        return match;
      }

      // 4. Trích xuất chữ tiếng Việt ở đầu khối toán (ví dụ: $với mọi x > 0$)
      const leadingMatch = inner.match(/^([^\$=<>+\\^_{}\/]*[\u00C0-\u024F\u1EA0-\u1EF9]+[^\$=<>+\\^_{}\/]*)\s+([a-zA-Z0-9\\].*)$/);
      if (leadingMatch && hasBalancedBraces(leadingMatch[2]) && hasBalancedEnvironments(leadingMatch[2]) && !/^[_\^]/.test(leadingMatch[2].trim())) {
        const delimiter = isBlock ? '$$' : '$';
        return `${leadingMatch[1].trim()} ${delimiter}${leadingMatch[2].trim()}${delimiter}`;
      }

      // 5. Trích xuất chữ tiếng Việt ở cuối khối toán (ví dụ: $x > 0 thỏa mãn$)
      const trailingMatch = inner.match(/^(.*?[a-zA-Z0-9\)\}])\s+([^\$=<>+\\^_{}\/]*[\u00C0-\u024F\u1EA0-\u1EF9]+[^\$=<>+\\^_{}\/]*)$/);
      if (trailingMatch && hasBalancedBraces(trailingMatch[1]) && hasBalancedEnvironments(trailingMatch[1]) && !/[_^\\|]$/.test(trailingMatch[1].trim())) {
        const delimiter = isBlock ? '$$' : '$';
        return `${delimiter}${trailingMatch[1].trim()}${delimiter} ${trailingMatch[2].trim()}`;
      }

      // 6. Từ tiếng Việt nằm ở giữa ngăn cách hai biểu thức toán (ví dụ: $x \in A và x \notin B$ hoặc $\in và \notin$)
      const middleMatch = inner.match(/^(.*?)\s+([^\$=<>+\\^_{}\/]*[\u00C0-\u024F\u1EA0-\u1EF9]+[^\$=<>+\\^_{}\/]*)\s+(.*)$/);
      if (middleMatch) {
        const m1 = middleMatch[1].trim();
        const m3 = middleMatch[3].trim();
        const text = middleMatch[2].trim();
        if (
          hasBalancedBraces(m1) &&
          hasBalancedBraces(m3) &&
          hasBalancedEnvironments(m1) &&
          hasBalancedEnvironments(m3) &&
          !/[_^\\|]$/.test(m1) &&
          !/^[_\^]/.test(m3)
        ) {
          const delimiter = isBlock ? '$$' : '$';
          return `${delimiter}${m1}${delimiter} ${text} ${delimiter}${m3}${delimiter}`;
        }
      }

      return match;
    });
  }

  return current;
}
