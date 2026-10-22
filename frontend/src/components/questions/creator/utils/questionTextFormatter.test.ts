import { describe, it, expect } from 'vitest'
import {
  cleanCitations,
  formatTextToHtml,
  formatQuestionContent,
  formatSolutionGuide,
  ensureMathDelimiters
} from './questionTextFormatter'

describe('questionTextFormatter utility', () => {
  describe('cleanCitations', () => {
    it('removes [cite: ...] annotations', () => {
      const input = 'Phương trình bậc hai [cite: 1] có nghiệm $x = 1$ [cite: 2, 3]'
      expect(cleanCitations(input)).toBe('Phương trình bậc hai có nghiệm $x = 1$')
    })

    it('returns empty string for null or empty input', () => {
      expect(cleanCitations('')).toBe('')
      expect(cleanCitations(null as any)).toBe('')
    })
  })

  describe('formatTextToHtml', () => {
    it('returns empty string for empty input', () => {
      expect(formatTextToHtml('')).toBe('')
    })

    it('preserves existing block HTML without wrapping extra tags', () => {
      const html = '<p>Nội dung câu hỏi</p>'
      expect(formatTextToHtml(html)).toBe(html)

      const tableHtml = '<table><tr><td>1</td></tr></table>'
      expect(formatTextToHtml(tableHtml)).toBe(tableHtml)
    })

    it('converts single newlines into <p> with <br/> tags', () => {
      const input = 'Cho hàm số $y = 2x^2$.\nTìm giá trị của y khi $x = 1$.'
      const formatted = formatTextToHtml(input)
      expect(formatted).toBe('<p>Cho hàm số $y = 2x^2$.<br/>Tìm giá trị của y khi $x = 1$.</p>')
    })

    it('converts double newlines into multiple <p> paragraphs', () => {
      const input = 'Đoạn 1.\n\nĐoạn 2.'
      const formatted = formatTextToHtml(input)
      expect(formatted).toBe('<p>Đoạn 1.</p><p>Đoạn 2.</p>')
    })

    it('converts bullet points into <ul><li> lists', () => {
      const input = '- Điểm A(1; 2)\n- Điểm B(3; 4)'
      const formatted = formatTextToHtml(input)
      expect(formatted).toBe('<ul><li>Điểm A(1; 2)</li><li>Điểm B(3; 4)</li></ul>')
    })

    it('converts numbered items into <ol><li> lists', () => {
      const input = '1. Bước thứ nhất\n2. Bước thứ hai'
      const formatted = formatTextToHtml(input)
      expect(formatted).toBe('<ol><li>Bước thứ nhất</li><li>Bước thứ hai</li></ol>')
    })

    it('preserves LaTeX formulas accurately inside formatted paragraphs', () => {
      const input = 'Giải phương trình:\n$ax^2 + bx + c = 0$\nVới $a \\ne 0$.'
      const formatted = formatTextToHtml(input)
      expect(formatted).toContain('$ax^2 + bx + c = 0$')
      expect(formatted).toContain('$a \\ne 0$.')
      expect(formatted).toContain('<br/>')
    })
  })

  describe('formatQuestionContent', () => {
    it('cleans citations and formats text to html', () => {
      const input = 'Tính chu vi hình tròn [cite: 1]:\nBán kính $R = 5\\text{ cm}$.'
      const result = formatQuestionContent(input)
      expect(result).toBe('<p>Tính chu vi hình tròn:<br/>Bán kính $R = 5\\text{ cm}$.</p>')
    })
  })

  describe('formatSolutionGuide', () => {
    it('formats plain text solution guide with line breaks', () => {
      const textGuide = 'Lời giải:\nÁp dụng công thức Viète ta có:\n$x_1 + x_2 = -\\frac{b}{a}$'
      const result = formatSolutionGuide(textGuide)
      expect(result).toContain('<br/>')
      expect(result).toContain('$x_1 + x_2 = -\\frac{b}{a}$')
    })

    it('formats object solution guide with steps and formulas into timeline HTML', () => {
      const objGuide = {
        problem: 'Giải phương trình $x^2 - 4 = 0$',
        steps: [
          {
            step: 1,
            title: 'Biến đổi',
            content: 'Chuyển vế hằng số tự do sang phải\nTa được phương trình tương đương',
            formula: 'x^2 = 4'
          },
          {
            step: 2,
            title: 'Khai căn',
            content: 'Lấy căn bậc hai hai vế',
            formula: 'x = \\pm 2'
          }
        ],
        conclusion: 'Vậy phương trình có 2 nghiệm $x = 2$ hoặc $x = -2$'
      }

      const result = formatSolutionGuide(objGuide)
      expect(result).toContain('exercise-content')
      expect(result).toContain('Giải phương trình $x^2 - 4 = 0$')
      expect(result).toContain('Biến đổi')
      expect(result).toContain('$$x^2 = 4$$')
      expect(result).toContain('$$x = \\pm 2$$')
      expect(result).toContain('Kết luận')
    })

    it('renders step point badge when point is specified in step', () => {
      const guideWithPoints = {
        steps: [
          { step: 1, title: 'Bước 1: Tìm x', content: 'Tính giá trị x', point: 0.5 },
          { step: 2, title: 'Bước 2: Tìm y', content: 'Tính giá trị y', point: 1 }
        ],
        conclusion: 'Vậy đáp số là $(x, y)$'
      }
      const html = formatSolutionGuide(guideWithPoints)
      expect(html).toContain('0.5 điểm')
      expect(html).toContain('1 điểm')
    })

    it('does not render point badge when point is missing or zero', () => {
      const guideWithoutPoints = {
        steps: [
          { step: 1, title: 'Bước 1', content: 'Nội dung', point: null },
          { step: 2, title: 'Bước 2', content: 'Nội dung' }
        ]
      }
      const html = formatSolutionGuide(guideWithoutPoints)
      expect(html).not.toContain('điểm</span>')
    })
  })

  describe('ensureMathDelimiters', () => {
    it('wraps equations and solutions in $...$', () => {
      expect(ensureMathDelimiters('x = 2; x = 3')).toBe('$x = 2; x = 3$')
      expect(ensureMathDelimiters('x = \\pm 2')).toBe('$x = \\pm 2$')
      expect(ensureMathDelimiters('x = ±2')).toBe('$x = ±2$')
      expect(ensureMathDelimiters('S = 6')).toBe('$S = 6$')
      expect(ensureMathDelimiters('m > 1')).toBe('$m > 1$')
      expect(ensureMathDelimiters('2')).toBe('$2$')
      expect(ensureMathDelimiters('-5')).toBe('$-5$')
      expect(ensureMathDelimiters('\\frac{1}{2}')).toBe('$\\frac{1}{2}$')
      expect(ensureMathDelimiters('1/2')).toBe('$1/2$')
    })

    it('keeps strings already wrapped in $ as is', () => {
      expect(ensureMathDelimiters('$x = 2$')).toBe('$x = 2$')
      expect(ensureMathDelimiters('$$x = 2$$')).toBe('$$x = 2$$')
    })

    it('does not wrap non-math Vietnamese text', () => {
      expect(ensureMathDelimiters('Vô nghiệm')).toBe('Vô nghiệm')
      expect(ensureMathDelimiters('Vô số nghiệm')).toBe('Vô số nghiệm')
      expect(ensureMathDelimiters('Đúng')).toBe('Đúng')
      expect(ensureMathDelimiters('Sai')).toBe('Sai')
    })

    it('wraps math inside <p> tag correctly', () => {
      expect(ensureMathDelimiters('<p>x = 2; x = 3</p>')).toBe('<p>$x = 2; x = 3$</p>')
    })
  })
})
