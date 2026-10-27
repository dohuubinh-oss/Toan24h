/**
 * Chuyển đổi cú pháp Markdown cơ bản (Headings, Bold, Italic, Lists, Code, Linebreaks)
 * sang HTML có định dạng chuẩn theo thiết kế Modern Academic của Toan6789,
 * đồng thời BẢO VỆ 100% các khối công thức Toán học KaTeX ($...$, $$...$$, \[...\], \(...\)).
 */

export function parseInlineMarkdown(text: string): string {
  if (!text) return ''

  // Bảo vệ an toàn các khối công thức toán học để không bị replace nhầm markdown bên trong
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^$]+\$|\\\([\s\S]*?\\\))/g)

  return parts
    .map((part) => {
      // Nếu là công thức toán thì giữ nguyên hoàn toàn
      if (
        (part.startsWith('$$') && part.endsWith('$$')) ||
        (part.startsWith('\\[') && part.endsWith('\\]')) ||
        (part.startsWith('$') && part.endsWith('$')) ||
        (part.startsWith('\\(') && part.endsWith('\\)'))
      ) {
        return part
      }

      // Xử lý các định dạng markdown inline
      return part
        .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
        .replace(/__([^_]+)__/g, '<strong class="font-bold text-slate-900">$1</strong>')
        .replace(/(^|[^*])\*([^*]+)\*([^*]|$)/g, '$1<em class="italic">$2</em>$3')
        .replace(/(^|[^_])_([^_]+)_([^_]|$)/g, '$1<em class="italic">$2</em>$3')
        .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded-md bg-slate-100 text-primary font-mono text-xs">$1</code>')
    })
    .join('')
}

export function markdownToHtml(text?: string | null): string {
  if (!text) return ''
  const trimmed = text.trim()
  if (!trimmed) return ''

  // Nếu chuỗi đã chứa sẵn các thẻ HTML khối (p, div, ul, ol, table, h1-h6, blockquote, img) thì giữ nguyên
  if (/<(?:p|div|ul|ol|table|h[1-6]|blockquote|article|section)[\s>]/i.test(trimmed)) {
    return trimmed
  }

  // Tách văn bản thành các khối (paragraph) qua 2 dấu xuống dòng liên tiếp
  const rawBlocks = trimmed.split(/\n\s*\n/)
  const htmlBlocks: string[] = []

  for (const block of rawBlocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) continue

    let currentBulletList: string[] = []
    let currentNumberedList: string[] = []
    let currentTextLines: string[] = []

    const flush = () => {
      if (currentTextLines.length > 0) {
        htmlBlocks.push(`<p class="my-2 leading-relaxed text-slate-800">${currentTextLines.map(parseInlineMarkdown).join('<br/>')}</p>`)
        currentTextLines = []
      }
      if (currentBulletList.length > 0) {
        htmlBlocks.push(`<ul class="list-disc pl-5 my-2.5 space-y-1.5 text-slate-800">${currentBulletList.map((l) => `<li>${parseInlineMarkdown(l)}</li>`).join('')}</ul>`)
        currentBulletList = []
      }
      if (currentNumberedList.length > 0) {
        htmlBlocks.push(`<ol class="list-decimal pl-5 my-2.5 space-y-1.5 text-slate-800">${currentNumberedList.map((l) => `<li>${parseInlineMarkdown(l)}</li>`).join('')}</ol>`)
        currentNumberedList = []
      }
    }

    for (const line of lines) {
      // 1. Heading: # , ## , ### , ####
      const hMatch = line.match(/^(#{1,6})\s+(.+)$/)
      if (hMatch) {
        flush()
        const level = hMatch[1].length
        const headingClasses: Record<number, string> = {
          1: 'text-xl sm:text-2xl font-black text-slate-900 mt-5 mb-2.5 border-b border-slate-100 pb-1.5',
          2: 'text-lg sm:text-xl font-extrabold text-slate-900 mt-4 mb-2',
          3: 'text-base sm:text-lg font-bold text-slate-800 mt-3.5 mb-1.5 text-primary',
          4: 'text-sm sm:text-base font-bold text-slate-800 mt-3 mb-1',
          5: 'text-xs sm:text-sm font-bold text-slate-700 mt-2 mb-1',
          6: 'text-xs font-bold text-slate-600 mt-2 mb-1 uppercase tracking-wider',
        }
        const cls = headingClasses[level] || headingClasses[3]
        htmlBlocks.push(`<h${level} class="${cls}">${parseInlineMarkdown(hMatch[2])}</h${level}>`)
        continue
      }

      // 2. Bullet list item: - item or * item
      if (/^[-*•]\s+/.test(line)) {
        if (currentTextLines.length > 0 || currentNumberedList.length > 0) flush()
        currentBulletList.push(line.replace(/^[-*•]\s+/, ''))
        continue
      }

      // 3. Numbered list item: 1. item, 2. item
      if (/^\d+[\.\)]\s+/.test(line)) {
        if (currentTextLines.length > 0 || currentBulletList.length > 0) flush()
        currentNumberedList.push(line.replace(/^\d+[\.\)]\s+/, ''))
        continue
      }

      // 4. Regular line
      if (currentBulletList.length > 0 || currentNumberedList.length > 0) flush()
      currentTextLines.push(line)
    }
    flush()
  }

  return htmlBlocks.join('\n')
}
