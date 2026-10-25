import { safeJsonParse } from '@/lib/jsonRepair'

/**
 * Kiểm tra xem chuỗi có phải biểu thức hoặc công thức toán học cần bọc $...$ không
 */
export function isMathExpression(s: string): boolean {
  const trimmed = s.trim()
  if (!trimmed) return false
  if (trimmed.includes('$')) return false

  // Chứa ký tự gạch chéo ngược LaTeX: \frac, \sqrt, \pm, \alpha, \le, \ge, \neq, \in, etc.
  if (trimmed.includes('\\')) return true

  // Chứa toán tử so sánh, số mũ hoặc chỉ số dưới
  if (/[=<>^_{}]/.test(trimmed)) return true

  // Chứa ký hiệu toán học đặc biệt unicode: ±, ∓, ≤, ≥, ≠, ≈, ∈
  if (/[±∓≤≥≠≈∈]/.test(trimmed)) return true

  // Là số thực, số nguyên hoặc số âm: 2, -5, 3.14, +2
  if (/^[+-]?\d+(?:\.\d+)?$/.test(trimmed)) return true

  // Là phân số: 1/2, -3/4
  if (/^[+-]?\d+\s*\/\s*\d+$/.test(trimmed)) return true

  // Chứa các toán tử toán học (+, -, *, /, =, <, >, ;, ≤, ≥, ≠)
  if (/[+\-*\/=<>≤≥≠;]/.test(trimmed)) {
    return true
  }

  // Ký tự đơn lẻ là biến toán học (x, y, z, m, a, b...)
  if (/^[a-zA-Z]$/.test(trimmed)) {
    return true
  }

  return false
}

/**
 * Bắt buộc bọc tất cả công thức toán học, biểu thức, phương trình, số trong $...$
 * Không có trường hợp ngoại lệ nào cho biểu thức toán học.
 */
export function ensureMathDelimiters(text?: string | null): string {
  if (!text) return ''
  const trimmed = text.trim()
  if (!trimmed) return ''

  // Nếu đã chứa $ thì giữ nguyên
  if (trimmed.includes('$')) {
    return trimmed
  }

  // Kiểm tra nếu được bọc trong <p>...</p>
  if (trimmed.toLowerCase().startsWith('<p>') && trimmed.toLowerCase().endsWith('</p>')) {
    const inner = trimmed.slice(3, -4).trim()
    if (inner.includes('$')) return trimmed
    if (isMathExpression(inner)) {
      return `<p>$${inner}$</p>`
    }
    return trimmed
  }

  if (isMathExpression(trimmed)) {
    return `$${trimmed}$`
  }

  return trimmed
}

export function cleanCitations(text?: string | null): string {
  if (!text) return ''
  return text
    .replace(/\s*\[cite:\s*[^\]]+\]/gi, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

export function formatTextToHtml(text?: string | null): string {
  if (!text) return ''
  const trimmed = cleanCitations(text).trim()
  if (!trimmed) return ''

  // Nếu chuỗi đã chứa sẵn thẻ khối HTML (p, div, ul, ol, table, h1-h6, blockquote, img) thì giữ nguyên
  if (/<(p|div|ul|ol|table|h[1-6]|blockquote|img)[\s>]/i.test(trimmed)) {
    return trimmed
  }

  // Nếu là chuỗi đơn dòng không có xuống dòng hay gạch đầu dòng, bọc vào <p>
  if (!trimmed.includes('\n') && !/^[-*•]\s+/.test(trimmed)) {
    return `<p>${trimmed}</p>`
  }

  // Tách theo đoạn văn (2 lần xuống dòng liên tiếp trở lên)
  const paragraphs = trimmed.split(/\n\s*\n/)

  const htmlBlocks = paragraphs.map((block) => {
    const rawLines = block.split('\n').map((l) => l.trim()).filter(Boolean)
    if (rawLines.length === 0) return ''

    const subBlocks: string[] = []
    let currentBulletList: string[] = []
    let currentNumberedList: string[] = []
    let currentTextLines: string[] = []

    const flushLists = () => {
      if (currentTextLines.length > 0) {
        subBlocks.push(`<p>${currentTextLines.join('<br/>')}</p>`)
        currentTextLines = []
      }
      if (currentBulletList.length > 0) {
        subBlocks.push(`<ul>${currentBulletList.map((l) => `<li>${l}</li>`).join('')}</ul>`)
        currentBulletList = []
      }
      if (currentNumberedList.length > 0) {
        subBlocks.push(`<ol>${currentNumberedList.map((l) => `<li>${l}</li>`).join('')}</ol>`)
        currentNumberedList = []
      }
    }

    for (const line of rawLines) {
      if (/^[-*•]\s+/.test(line)) {
        if (currentTextLines.length > 0 || currentNumberedList.length > 0) {
          flushLists()
        }
        currentBulletList.push(line.replace(/^[-*•]\s+/, ''))
      } else if (/^\d+[\.\)]\s+/.test(line)) {
        if (currentTextLines.length > 0 || currentBulletList.length > 0) {
          flushLists()
        }
        currentNumberedList.push(line.replace(/^\d+[\.\)]\s+/, ''))
      } else {
        if (currentBulletList.length > 0 || currentNumberedList.length > 0) {
          flushLists()
        }
        currentTextLines.push(line)
      }
    }
    flushLists()

    return subBlocks.join('')
  })

  return htmlBlocks.filter(Boolean).join('')
}

/**
 * Loại bỏ tiền tố đánh số câu hỏi như "Câu 18.", "Câu 1:", "Bài 5.", "**Câu 18.**", "<p>Câu 18.</p>"
 */
export function cleanQuestionPrefix(text?: string | null): string {
  if (!text) return ''
  const trimmed = text.trim()
  if (!trimmed) return ''

  // Có thẻ <p ...> ở đầu
  const rxWithP = /^(<p(?:\s+[^>]*)?>)\s*(?:<strong[^>]*>|<b[^>]*>|\*\*)?\s*(?:câu|bài)\s+\d+(?:[a-zA-Z]|\.[a-zA-Z])?(?:<\/strong>|<\/b>|\*\*)?\s*(?:[\.:\)\-]+\s*(?:<\/strong>|<\/b>|\*\*)?\s*|\s+)/i
  if (rxWithP.test(trimmed)) {
    return trimmed.replace(rxWithP, '$1')
  }

  // Không có thẻ <p>
  const rxWithoutP = /^\s*(?:<strong[^>]*>|<b[^>]*>|\*\*)?\s*(?:câu|bài)\s+\d+(?:[a-zA-Z]|\.[a-zA-Z])?(?:<\/strong>|<\/b>|\*\*)?\s*(?:[\.:\)\-]+\s*(?:<\/strong>|<\/b>|\*\*)?\s*|\s+)/i
  return trimmed.replace(rxWithoutP, '')
}

export function formatQuestionContent(content?: string | null): string {
  if (!content) return ''
  return formatTextToHtml(cleanQuestionPrefix(cleanCitations(content)))
}

export function formatSolutionGuide(guide: any): string {
  if (!guide) return ''

  // Nếu là chuỗi JSON hoặc object được stringify
  if (typeof guide === 'string') {
    const trimmed = guide.trim()
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        const parsed = safeJsonParse(trimmed)
        if (parsed && typeof parsed === 'object') {
          guide = parsed
        }
      } catch (e) {
        // Not valid JSON, continue with string processing
      }
    }
  }

  // Nếu vẫn là chuỗi string thuần (không phải JSON)
  if (typeof guide === 'string') {
    return formatTextToHtml(cleanCitations(guide))
  }

  // Nếu là object có cấu trúc problem / steps / conclusion / tips
  if (typeof guide === 'object' && guide !== null) {
    let html = `<div class="exercise-content bg-transparent p-4">`

    // 0. Hình vẽ minh họa lời giải SVG (nếu có)
    const rawSvg = guide.diagram_svg || guide.diagramSvg || guide.DiagramSVG
    if (rawSvg && typeof rawSvg === 'string' && rawSvg.trim().startsWith('<svg')) {
      const cleanSvg = rawSvg.trim()
      const encodedSvg = `data:image/svg+xml;utf8,${encodeURIComponent(cleanSvg)}`
      html += `<div class="solution-diagram-wrapper my-4 text-center">
        <img src="${encodedSvg}" alt="Hình vẽ minh họa lời giải" class="max-w-[420px] max-h-[320px] w-auto h-auto mx-auto object-contain" />
      </div>`
    }

    if (guide.problem || guide.analysis) {
      const cleanProb = cleanCitations(guide.problem || guide.analysis)
      const formattedProb = formatTextToHtml(cleanProb)
      html += `<div class="bg-slate-50 p-5 rounded-lg border border-slate-200 mb-8">
        <div class="italic text-slate-700 !m-0">${formattedProb}</div>
      </div>`
    }

    const stepsData = Array.isArray(guide) ? guide : (guide.steps || guide.Steps)
    const cleanConclusion = cleanCitations(guide.conclusion || guide.Conclusion)
    const cleanTips = cleanCitations(guide.tips || guide.Tips)
    const hasTimeline = (stepsData && Array.isArray(stepsData) && stepsData.length > 0) || cleanConclusion || cleanTips

    if (!hasTimeline) {
      const rawText = guide.content || guide.solution || guide.explanation || guide.text || guide.guide || guide.solution_guide || ''
      if (rawText && typeof rawText === 'string') {
        html += `<div class="text-slate-700 leading-relaxed">${formatTextToHtml(cleanCitations(rawText))}</div>`
        html += `</div>`
        return html
      }
    }

    if (hasTimeline) {
      const timelineItems: Array<{
        type: 'step' | 'conclusion' | 'tips'
        idx?: number
        title?: string
        content?: string
        formula?: string | null
        point?: number | null
      }> = []

      if (stepsData && Array.isArray(stepsData)) {
        stepsData.forEach((st: any, idx: number) => {
          if (typeof st === 'string') {
            timelineItems.push({
              type: 'step',
              idx: idx + 1,
              title: '',
              content: cleanCitations(st),
              formula: null,
              point: null,
            })
            return
          }
          const rawPoint = st.point !== undefined && st.point !== null ? st.point : st.Point
          const parsedPoint = rawPoint !== undefined && rawPoint !== null && !isNaN(Number(rawPoint)) ? Number(rawPoint) : null

          timelineItems.push({
            type: 'step',
            idx: st.step || idx + 1,
            title: cleanCitations(st.title),
            content: cleanCitations(st.content),
            formula: st.formula ? cleanCitations(st.formula) : null,
            point: parsedPoint,
          })
        })
      }

      if (cleanConclusion) {
        timelineItems.push({
          type: 'conclusion',
          content: cleanConclusion,
        })
      }

      if (cleanTips) {
        timelineItems.push({
          type: 'tips',
          content: cleanTips,
        })
      }

      timelineItems.forEach((item, i) => {
        const isLast = i === timelineItems.length - 1

        html += `<div class="flex gap-4">
          <div class="flex-none flex flex-col items-center">`

        if (item.type === 'step') {
          html += `<p class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm !m-0">${item.idx}</p>`
        } else if (item.type === 'conclusion') {
          html += `<p class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm !m-0">✓</p>`
        } else if (item.type === 'tips') {
          html += `<p class="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm !m-0">💡</p>`
        }

        if (!isLast) {
          html += `<div class="w-0.5 h-full bg-slate-200 my-1"></div>`
        }

        html += `</div>
          <div class="${isLast ? '' : 'pb-8'} flex-1 pt-1">`

        if (item.type === 'step') {
          const pointBadge = (item.point !== null && item.point !== undefined && item.point > 0)
            ? `<span class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">${item.point} điểm</span>`
            : ''

          if (item.title) {
            html += `<h4 class="font-bold text-slate-900 !m-0 flex items-center flex-wrap gap-1">${item.title}${pointBadge}</h4>`
          } else if (pointBadge) {
            html += `<div class="mb-1">${pointBadge}</div>`
          }
          if (item.content) {
            const formattedContent = formatTextToHtml(item.content)
            html += `<div class="text-slate-600 mt-1 !mb-0">${formattedContent}</div>`
          }
          if (
            item.formula &&
            typeof item.formula === 'string' &&
            item.formula.trim() !== '' &&
            item.formula.trim().toLowerCase() !== 'null'
          ) {
            const trimmedF = item.formula.trim()
            const formattedFormula = trimmedF.includes('$') ? trimmedF : `$$${trimmedF}$$`
            html += `<p class="mt-3 text-blue-600 font-bold !m-0">${formattedFormula}</p>`
          }
        } else if (item.type === 'conclusion') {
          const formattedContent = formatTextToHtml(item.content)
          html += `<h4 class="font-bold text-slate-900 !m-0">Kết luận</h4>
            <div class="text-slate-600 mt-1 !mb-0">${formattedContent}</div>`
        } else if (item.type === 'tips') {
          const formattedContent = formatTextToHtml(item.content)
          html += `<h4 class="font-bold text-slate-900 !m-0">Gợi ý</h4>
            <div class="text-slate-600 mt-1 !mb-0">${formattedContent}</div>`
        }

        html += `</div></div>`
      })

      html += `</div>`
    }

    html += `</div>`
    return html
  }

  return ''
}
