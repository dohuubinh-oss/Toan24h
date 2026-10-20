/**
 * Tiện ích chuẩn hóa và chuyển đổi nội dung câu hỏi/lời giải sang định dạng HTML
 * Hỗ trợ tự động xuống hàng (<br/>, <p>), danh sách (<ul>, <ol>) và bảo toàn công thức KaTeX ($...$, $$...$$)
 */

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

export function formatQuestionContent(content?: string | null): string {
  if (!content) return ''
  return formatTextToHtml(cleanCitations(content))
}

export function formatSolutionGuide(guide: any): string {
  if (!guide) return ''

  // Nếu là chuỗi string thuần
  if (typeof guide === 'string') {
    return formatTextToHtml(cleanCitations(guide))
  }

  // Nếu là object có cấu trúc problem / steps / conclusion / tips
  if (typeof guide === 'object') {
    let html = `<div class="exercise-content bg-transparent p-4">`

    if (guide.problem) {
      const cleanProb = cleanCitations(guide.problem)
      const formattedProb = formatTextToHtml(cleanProb)
      html += `<div class="bg-slate-50 p-5 rounded-lg border border-slate-200 mb-8">
        <div class="italic text-slate-700 !m-0">${formattedProb}</div>
      </div>`
    }

    const stepsData = guide.steps || guide.Steps
    const cleanConclusion = cleanCitations(guide.conclusion)
    const cleanTips = cleanCitations(guide.tips)
    const hasTimeline = (stepsData && Array.isArray(stepsData) && stepsData.length > 0) || cleanConclusion || cleanTips

    if (hasTimeline) {
      html += `<div class="space-y-0">`

      const timelineItems: Array<{
        type: 'step' | 'conclusion' | 'tips'
        idx?: number
        title?: string
        content?: string
        formula?: string | null
      }> = []

      if (stepsData && Array.isArray(stepsData)) {
        stepsData.forEach((st: any, idx: number) => {
          timelineItems.push({
            type: 'step',
            idx: st.step || idx + 1,
            title: cleanCitations(st.title),
            content: cleanCitations(st.content),
            formula: st.formula ? cleanCitations(st.formula) : null,
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
          if (item.title) {
            html += `<h4 class="font-bold text-slate-900 !m-0">${item.title}</h4>`
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
