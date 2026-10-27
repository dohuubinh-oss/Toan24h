import { describe, it, expect } from 'vitest'
import { markdownToHtml, parseInlineMarkdown } from './markdownUtils'

describe('markdownUtils', () => {
  it('converts markdown headings to HTML headings while keeping math intact', () => {
    const md = '### Mẹo Casio: Tìm $x$ trong $\\int_0^1 f(x)dx$'
    const html = markdownToHtml(md)
    expect(html).toContain('<h3')
    expect(html).toContain('Mẹo Casio:')
    expect(html).toContain('$x$')
    expect(html).toContain('$\\int_0^1 f(x)dx$')
  })

  it('converts numbered and bullet lists to ol and ul HTML structures', () => {
    const md = `
1. Bước 1: Bấm MENU 9
2. Bước 2: Nhập hệ số

- Chú ý 1: Chọn Radian
- Chú ý 2: Thử lại nghiệm
`
    const html = markdownToHtml(md)
    expect(html).toContain('<ol')
    expect(html).toContain('<li>Bước 1: Bấm MENU 9</li>')
    expect(html).toContain('<ul')
    expect(html).toContain('<li>Chú ý 1: Chọn Radian</li>')
  })

  it('converts bold and code inline markdown safely', () => {
    const inline = parseInlineMarkdown('Bấm **SHIFT** + **FACT** với số $1260$')
    expect(inline).toContain('<strong class="font-bold text-slate-900">SHIFT</strong>')
    expect(inline).toContain('$1260$')
  })
})
