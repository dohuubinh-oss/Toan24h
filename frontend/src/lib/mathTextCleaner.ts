const VIETNAMESE_CHAR_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/i;
const VIETNAMESE_WORD_REGEX = /\b(và|hoặc|với|mọi|thỏa|mãn|nghiệm|điều|kiện|dạng|bài|tập|phương|trình|hệ|số|đa|thức|đơn|thức|kí|hiệu|chú|ý|kết|quả|tìm|tính|chứng|minh|khi|nếu|loại)\b/i;

const LATEX_COMMANDS = 'dfrac|frac|cfrac|sqrt|root|int|iint|iiint|oint|sum|prod|coprod|lim|limsup|liminf|alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|theta|vartheta|iota|kappa|lambda|mu|nu|xi|pi|varpi|rho|varrho|sigma|varsigma|tau|upsilon|phi|varphi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|infty|partial|nabla|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|begin|end|vec|overrightarrow|overleftarrow|overline|underline|cdot|pm|mp|times|div|leq|geq|le|ge|neq|ne|approx|sim|simeq|equiv|cong|in|notin|ni|subset|supset|subseteq|supseteq|cup|cap|setminus|widehat|hat|tilde|widetilde|degree|dots|ldots|cdots|vdots|ddots|to|rightarrow|leftarrow|Rightarrow|Leftarrow|Leftrightarrow|iff|implies|angle|measuredangle|parallel|perp|mathrm|mathbf|mathit|mathbb|mathcal';

/**
 * Kiểm tra xem chuỗi có chứa ký tự hoặc từ tiếng Việt hay không
 */
export function containsVietnamese(str: string): boolean {
  if (!str) return false;
  return VIETNAMESE_CHAR_REGEX.test(str) || VIETNAMESE_WORD_REGEX.test(str);
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
 * Ví dụ:
 * - `$\text{với mọi } x > 0$`  => `với mọi $x > 0$`
 * - `$x > 0 \text{ (thỏa mãn)}$` => `$x > 0$ (thỏa mãn)`
 * - `$x = 1 \text{ hoặc } x = -1$` => `$x = 1$ hoặc $x = -1$`
 * - `$\text{Dạng 1. Nhận biết đơn thức}$` => `Dạng 1. Nhận biết đơn thức`
 * - `$Dạng 2. Sử dụng các kí hiệu \in và \notin$` => `Dạng 2. Sử dụng các kí hiệu $\in$ và $\notin$`
 * - `Dạng 2. Sử dụng các kí hiệu \in và \notin` => `Dạng 2. Sử dụng các kí hiệu $\in$ và $\notin$`
 */
export function normalizeVietnameseMath(text?: string | null): string {
  if (!text) return '';

  // Bọc các lệnh LaTeX độc lập nếu người dùng gõ trực tiếp \in, \notin mà quên gõ dấu $
  let current = wrapStandaloneLatex(text);
  let prev = '';
  let maxLoop = 5;

  while (current !== prev && maxLoop-- > 0) {
    prev = current;
    current = current.replace(/\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]|\$([^\$]+)\$|\\\(([\s\S]+?)\\\)/g, (match, b1, b2, i1, i2) => {
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

      // 3. Phân tách và trích xuất các khối \text{...} có chứa tiếng Việt
      if (inner.includes('\\text{')) {
        const parts = inner.split(/(\\text\{[^}]+\})/g);
        const converted = parts.map(part => {
          const textMatch = part.match(/^\\text\{([^}]+)\}$/);
          if (textMatch && containsVietnamese(textMatch[1])) {
            return ` ${textMatch[1].trim()} `;
          }
          const trimmed = part.trim();
          if (!trimmed) return '';
          return isBlock ? `$$${trimmed}$$` : `$${trimmed}$`;
        }).join('').replace(/\$\$\s*\$\$/g, ' ').replace(/\$\s*\$/g, ' ').replace(/\s{2,}/g, ' ').trim();
        return converted;
      }

      // 4. Trích xuất chữ tiếng Việt ở đầu khối toán (ví dụ: $với mọi x > 0$)
      const leadingMatch = inner.match(/^([^\$=<>+\\^_{}\/]*[\u00C0-\u024F\u1EA0-\u1EF9]+[^\$=<>+\\^_{}\/]*)\s+([a-zA-Z0-9\\].*)$/);
      if (leadingMatch) {
        const delimiter = isBlock ? '$$' : '$';
        return `${leadingMatch[1].trim()} ${delimiter}${leadingMatch[2].trim()}${delimiter}`;
      }

      // 5. Trích xuất chữ tiếng Việt ở cuối khối toán (ví dụ: $x > 0 thỏa mãn$)
      const trailingMatch = inner.match(/^(.*?[a-zA-Z0-9\)\}])\s+([^\$=<>+\\^_{}\/]*[\u00C0-\u024F\u1EA0-\u1EF9]+[^\$=<>+\\^_{}\/]*)$/);
      if (trailingMatch) {
        const delimiter = isBlock ? '$$' : '$';
        return `${delimiter}${trailingMatch[1].trim()}${delimiter} ${trailingMatch[2].trim()}`;
      }

      // 6. Từ tiếng Việt nằm ở giữa ngăn cách hai biểu thức toán (ví dụ: $x \in A và x \notin B$ hoặc $\in và \notin$)
      const middleMatch = inner.match(/^(.*?)\s+([^\$=<>+\\^_{}\/]*[\u00C0-\u024F\u1EA0-\u1EF9]+[^\$=<>+\\^_{}\/]*)\s+(.*)$/);
      if (middleMatch) {
        const delimiter = isBlock ? '$$' : '$';
        return `${delimiter}${middleMatch[1].trim()}${delimiter} ${middleMatch[2].trim()} ${delimiter}${middleMatch[3].trim()}${delimiter}`;
      }

      return match;
    });
  }

  return current;
}
