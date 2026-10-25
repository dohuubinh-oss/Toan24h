import { DangToanItem, MethodItem } from '../LectureCreatorContext'
import { safeJsonParse } from '@/lib/jsonRepair'

export interface RawProblemStep {
  step: number;
  title?: string;
  content?: string;
  formula?: string | null;
}

export interface RawProblemItem {
  problem?: string;
  conclusion?: string;
  tips?: string;
  problemImage?: string;
  solutionImage?: string;
  steps?: RawProblemStep[];
}

// Backwards compatibility types for external tests or usages
export type RawExamStep = RawProblemStep;
export type RawExamItem = RawProblemItem;

export interface RawMethodItem {
  methodName?: string;
  Solution?: string;
  solution?: string;
  methodContent?: string;
  problemImage?: string;
  solutionImage?: string;
  problems?: RawProblemItem[];
  exams?: RawProblemItem[];
  exercise?: { content: string } | null;
}

export interface RawMathTypeItem {
  mathType?: string;
  dangToanName?: string;
  Solution?: string;
  solution?: string | RawMethodItem[];
  problems?: RawProblemItem[];
  exams?: RawProblemItem[];
  method?: RawMethodItem[];
  methods?: RawMethodItem[];
}

export function cleanCitations(text?: string | null): string {
  if (!text) return ''
  return text.replace(/\[cite:\s*[^\]]+\]/gi, '').trim()
}

export function formatTextToHtml(text?: string | null): string {
  if (!text) return ''
  const trimmed = cleanCitations(text).trim()
  if (!trimmed) return ''

  // If text already contains block HTML tags (<p>, <div>, <ul>, <ol>, <table>, <h1-6>), return as is
  if (/<(p|div|ul|ol|table|h[1-6]|blockquote)[\s>]/i.test(trimmed)) {
    return trimmed
  }

  // If it's a simple single-line string without newlines or bullets, keep as-is
  if (!trimmed.includes('\n') && !/^[-*•]\s+/.test(trimmed)) {
    return trimmed
  }

  // Split by double newline or multiple newlines to get paragraphs/blocks
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

export function buildExerciseHtmlFromProblems(problems: RawProblemItem[]): string {
  if (!problems || problems.length === 0) return ''

  const problemBlocks = problems.map((item) => {
    let blockHtml = ''

    if (item.problemImage) {
      blockHtml += `<div class="mb-4"><img src="${item.problemImage}" alt="Đề bài" class="max-w-full rounded border border-slate-200" /></div>`
    }

    const cleanProblem = cleanCitations(item.problem)
    if (cleanProblem) {
      const formattedProblem = formatTextToHtml(cleanProblem)
      blockHtml += `<div class="bg-slate-50 p-5 rounded-lg border border-slate-200 mb-6">
        <div class="italic text-slate-700 m-0">${formattedProblem.startsWith('<') ? formattedProblem : `<p class="m-0">${formattedProblem}</p>`}</div>
      </div>`
    }

    const stepsData = item.steps || []
    const cleanConclusion = cleanCitations(item.conclusion)
    const cleanTips = cleanCitations(item.tips)
    const hasTimeline = stepsData.length > 0 || cleanConclusion || cleanTips

    if (hasTimeline) {
      blockHtml += `<div class="space-y-0">`

      const timelineItems: Array<{
        type: 'step' | 'conclusion' | 'tips';
        idx?: number;
        title?: string;
        content?: string;
        formula?: string | null;
      }> = []

      stepsData.forEach((st, idx) => {
        timelineItems.push({
          type: 'step',
          idx: st.step || idx + 1,
          title: cleanCitations(st.title),
          content: cleanCitations(st.content),
          formula: st.formula ? cleanCitations(st.formula) : null
        })
      })

      if (cleanConclusion) {
        timelineItems.push({
          type: 'conclusion',
          content: cleanConclusion
        })
      }

      if (cleanTips) {
        timelineItems.push({
          type: 'tips',
          content: cleanTips
        })
      }

      timelineItems.forEach((timelineItem, i) => {
        const isLast = i === timelineItems.length - 1

        blockHtml += `<div class="flex gap-4">
          <div class="flex-none flex flex-col items-center">`

        if (timelineItem.type === 'step') {
          blockHtml += `<p class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm m-0">${timelineItem.idx}</p>`
        } else if (timelineItem.type === 'conclusion') {
          blockHtml += `<p class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm m-0">✓</p>`
        } else if (timelineItem.type === 'tips') {
          blockHtml += `<p class="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm m-0">💡</p>`
        }

        if (!isLast) {
          blockHtml += `<div class="w-0.5 h-full bg-slate-200 my-1"></div>`
        }

        blockHtml += `</div>
          <div class="${isLast ? '' : 'pb-8'} flex-1 pt-1">`

        if (timelineItem.type === 'step') {
          if (timelineItem.title) {
            blockHtml += `<h4 class="font-bold text-slate-900 m-0">${timelineItem.title}</h4>`
          }
          if (timelineItem.content) {
            const formattedContent = formatTextToHtml(timelineItem.content)
            if (formattedContent.startsWith('<')) {
              blockHtml += `<div class="text-slate-600 mt-1 mb-0">${formattedContent}</div>`
            } else {
              blockHtml += `<p class="text-slate-600 mt-1 mb-0">${formattedContent}</p>`
            }
          }
          if (
            timelineItem.formula &&
            typeof timelineItem.formula === 'string' &&
            timelineItem.formula.trim() !== '' &&
            timelineItem.formula.trim().toLowerCase() !== 'null'
          ) {
            const trimmed = timelineItem.formula.trim()
            const formattedFormula = trimmed.includes('$') ? trimmed : `$$${trimmed}$$`
            blockHtml += `<p class="mt-3 text-blue-600 font-bold m-0">${formattedFormula}</p>`
          }
        } else if (timelineItem.type === 'conclusion') {
          const formattedContent = formatTextToHtml(timelineItem.content)
          blockHtml += `<h4 class="font-bold text-slate-900 m-0">Kết luận</h4>
            <div class="text-slate-600 mt-1 mb-0">${formattedContent.startsWith('<') ? formattedContent : `<p class="m-0">${formattedContent}</p>`}</div>`
        } else if (timelineItem.type === 'tips') {
          const formattedContent = formatTextToHtml(timelineItem.content)
          blockHtml += `<h4 class="font-bold text-slate-900 m-0">Gợi ý</h4>
            <div class="text-slate-600 mt-1 mb-0">${formattedContent.startsWith('<') ? formattedContent : `<p class="m-0">${formattedContent}</p>`}</div>`
        }

        blockHtml += `</div></div>`
      })

      blockHtml += `</div>`
    }

    if (item.solutionImage) {
      blockHtml += `<div class="mt-4"><img src="${item.solutionImage}" alt="Lời giải" class="max-w-full rounded border border-slate-200" /></div>`
    }

    return blockHtml
  })

  const validBlocks = problemBlocks.filter((b) => b && b.trim() !== '')
  if (validBlocks.length === 0) return ''

  return `<div class="exercise-content bg-white p-4">${validBlocks.join(
    '<div class="my-8 border-t border-dashed border-slate-200"></div>'
  )}</div>`
}

// Backwards compatibility alias
export const buildExerciseHtmlFromExams = buildExerciseHtmlFromProblems

export function parseLectureJson(jsonString: string): DangToanItem[] {
  let parsed: unknown
  try {
    parsed = safeJsonParse(jsonString)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'JSON không hợp lệ'
    throw new Error(`JSON không hợp lệ: ${message}`)
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Dữ liệu JSON phải là một danh sách (mảng []) các Dạng toán')
  }

  if (parsed.length === 0) {
    throw new Error('Danh sách Dạng toán không được để trống')
  }

  return parsed.map((item: RawMathTypeItem, index: number) => {
    const dangToanId = Math.random().toString(36).substr(2, 9)
    const rawName = item.mathType || item.dangToanName || `Dạng toán ${index + 1}`
    const mathType = cleanCitations(rawName)

    let methodsList: MethodItem[] = []
    const rawMethods = item.methods || item.method || (Array.isArray(item.solution) ? item.solution : undefined)

    if (Array.isArray(rawMethods) && rawMethods.length > 0) {
      methodsList = rawMethods
        .filter((m) => m && typeof m === 'object')
        .map((m) => {
          const methodId = Math.random().toString(36).substr(2, 9)
          const solRaw = m.solution || m.Solution || m.methodContent || ''
          const sol = formatTextToHtml(cleanCitations(solRaw))
          const rawProblems = Array.isArray(m.problems)
            ? m.problems
            : Array.isArray(m.exams)
            ? m.exams
            : []
          let exerciseContent = buildExerciseHtmlFromProblems(rawProblems)
          if (!exerciseContent && m.exercise && m.exercise.content) {
            exerciseContent = cleanCitations(m.exercise.content)
          }
          return {
            id: methodId,
            methodName: cleanCitations(m.methodName || ''),
            solution: sol,
            exercise: exerciseContent ? { content: exerciseContent } : null,
            problemImage: m.problemImage || null,
            solutionImage: m.solutionImage || null
          }
        })
      if (methodsList.length === 0) {
        methodsList = [
          {
            id: Math.random().toString(36).substr(2, 9),
            methodName: '',
            solution: '',
            exercise: null,
            problemImage: null,
            solutionImage: null
          }
        ]
      }
    } else {
      const methodId = Math.random().toString(36).substr(2, 9)
      const solRaw = typeof item.solution === 'string' ? item.solution : (item.Solution || '')
      const sol = formatTextToHtml(cleanCitations(solRaw))
      const rawProblems = Array.isArray(item.problems)
        ? item.problems
        : Array.isArray(item.exams)
        ? item.exams
        : []
      const exerciseContent = buildExerciseHtmlFromProblems(rawProblems)
      methodsList = [
        {
          id: methodId,
          methodName: '',
          solution: sol,
          exercise: exerciseContent ? { content: exerciseContent } : null,
          problemImage: null,
          solutionImage: null
        }
      ]
    }

    return {
      id: dangToanId,
      mathType,
      methods: methodsList
    }
  })
}
