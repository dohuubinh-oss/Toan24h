const VIETNAMESE_CHAR_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/i;
const VIETNAMESE_WORD_REGEX = /\b(và|hoặc|với|mọi|thỏa|mãn|nghiệm|điều|kiện|dạng|bài|tập|phương|trình|hệ|số|đa|thức|đơn|thức|kí|hiệu|chú|ý|kết|quả|tìm|tính|chứng|minh|khi|nếu)\b/i;

/**
 * Kiểm tra xem chuỗi có chứa ký tự hoặc từ tiếng Việt hay không
 */
export function containsVietnamese(str: string): boolean {
  if (!str) return false;
  return VIETNAMESE_CHAR_REGEX.test(str) || VIETNAMESE_WORD_REGEX.test(str);
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
 * - `$với mọi x > 0$` => `với mọi $x > 0$`
 */
export function normalizeVietnameseMath(text?: string | null): string {
  if (!text) return '';

  return text.replace(/\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]|\$([^\$]+)\$|\\\(([\s\S]+?)\\\)/g, (match, b1, b2, i1, i2) => {
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
    // Ví dụ: $x = 1 \text{ hoặc } x = -1$ => $x = 1$ hoặc $x = -1$
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

    return match;
  });
}
