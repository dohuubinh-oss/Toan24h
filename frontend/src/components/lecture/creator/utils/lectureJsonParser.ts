import { DangToanItem } from '../LectureCreatorContext'

export interface RawExamStep {
  step: number;
  title?: string;
  content?: string;
  formula?: string;
}

export interface RawExamItem {
  problem?: string;
  conclusion?: string;
  tips?: string;
  problemImage?: string;
  solutionImage?: string;
  steps?: RawExamStep[];
}

export interface RawMethodItem {
  methodName?: string;
  Solution?: string;
  problemImage?: string;
  solutionImage?: string;
  exams?: RawExamItem[];
}

export interface RawMathTypeItem {
  mathType: string;
  Solution?: string;
  exams?: RawExamItem[];
  method?: RawMethodItem[];
  methods?: RawMethodItem[];
}

export function buildExerciseHtmlFromExams(exams: RawExamItem[]): string {
  if (!exams || exams.length === 0) return ''

  const examBlocks = exams.map((exam) => {
    let blockHtml = ''

    if (exam.problemImage) {
      blockHtml += `<div class="mb-4"><img src="${exam.problemImage}" alt="Đề bài" class="max-w-full rounded border border-slate-200" /></div>`
    }

    if (exam.problem) {
      blockHtml += `<div class="bg-slate-50 p-5 rounded-lg border border-slate-200 mb-6">
        <p class="italic text-slate-700 m-0">${exam.problem}</p>
      </div>`
    }

    const stepsData = exam.steps || []
    const hasTimeline = stepsData.length > 0 || exam.conclusion || exam.tips

    if (hasTimeline) {
      blockHtml += `<div class="space-y-0">`

      const timelineItems: Array<{
        type: 'step' | 'conclusion' | 'tips';
        idx?: number;
        title?: string;
        content?: string;
        formula?: string;
      }> = []

      stepsData.forEach((st, idx) => {
        timelineItems.push({
          type: 'step',
          idx: st.step || idx + 1,
          title: st.title,
          content: st.content,
          formula: st.formula
        })
      })

      if (exam.conclusion) {
        timelineItems.push({
          type: 'conclusion',
          content: exam.conclusion
        })
      }

      if (exam.tips) {
        timelineItems.push({
          type: 'tips',
          content: exam.tips
        })
      }

      timelineItems.forEach((item, i) => {
        const isLast = i === timelineItems.length - 1

        blockHtml += `<div class="flex gap-4">
          <div class="flex-none flex flex-col items-center">`

        if (item.type === 'step') {
          blockHtml += `<p class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm m-0">${item.idx}</p>`
        } else if (item.type === 'conclusion') {
          blockHtml += `<p class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm m-0">✓</p>`
        } else if (item.type === 'tips') {
          blockHtml += `<p class="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm m-0">💡</p>`
        }

        if (!isLast) {
          blockHtml += `<div class="w-0.5 h-full bg-slate-200 my-1"></div>`
        }

        blockHtml += `</div>
          <div class="${isLast ? '' : 'pb-8'} flex-1 pt-1">`

        if (item.type === 'step') {
          if (item.title) {
            blockHtml += `<h4 class="font-bold text-slate-900 m-0">${item.title}</h4>`
          }
          if (item.content) {
            blockHtml += `<p class="text-slate-600 mt-1 mb-0">${item.content}</p>`
          }
          if (
            item.formula &&
            typeof item.formula === 'string' &&
            item.formula.trim() !== '' &&
            item.formula.trim().toLowerCase() !== 'null'
          ) {
            const trimmed = item.formula.trim()
            const formattedFormula = trimmed.includes('$') ? trimmed : `$$${trimmed}$$`
            blockHtml += `<p class="mt-3 text-blue-600 font-bold m-0">${formattedFormula}</p>`
          }
        } else if (item.type === 'conclusion') {
          blockHtml += `<h4 class="font-bold text-slate-900 m-0">Kết luận</h4>
            <p class="text-slate-600 mt-1 mb-0">${item.content}</p>`
        } else if (item.type === 'tips') {
          blockHtml += `<h4 class="font-bold text-slate-900 m-0">Gợi ý</h4>
            <p class="text-slate-600 mt-1 mb-0">${item.content}</p>`
        }

        blockHtml += `</div></div>`
      })

      blockHtml += `</div>`
    }

    if (exam.solutionImage) {
      blockHtml += `<div class="mt-4"><img src="${exam.solutionImage}" alt="Lời giải" class="max-w-full rounded border border-slate-200" /></div>`
    }

    return blockHtml
  })

  const validBlocks = examBlocks.filter((b) => b && b.trim() !== '')
  if (validBlocks.length === 0) return ''

  return `<div class="exercise-content bg-white p-4">${validBlocks.join(
    '<div class="my-8 border-t border-dashed border-slate-200"></div>'
  )}</div>`
}

export function parseLectureJson(jsonString: string): DangToanItem[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonString)
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

    let methodsList = []
    const rawMethods = item.method || item.methods
    if (Array.isArray(rawMethods) && rawMethods.length > 0) {
      methodsList = rawMethods
        .filter((m) => m && typeof m === 'object')
        .map((m, mIdx) => {
          const methodId = Math.random().toString(36).substr(2, 9)
          const exerciseContent = buildExerciseHtmlFromExams(m.exams || [])
          return {
            id: methodId,
            methodName: m.methodName || '',
            methodContent: m.Solution || '',
            exercise: exerciseContent ? { content: exerciseContent } : null,
            problemImage: null,
            solutionImage: null
          }
        })
      if (methodsList.length === 0) {
        methodsList = [
          {
            id: Math.random().toString(36).substr(2, 9),
            methodName: '',
            methodContent: '',
            exercise: null,
            problemImage: null,
            solutionImage: null
          }
        ]
      }
    } else {
      const methodId = Math.random().toString(36).substr(2, 9)
      const exerciseContent = buildExerciseHtmlFromExams(item.exams || [])
      methodsList = [
        {
          id: methodId,
          methodName: '',
          methodContent: item.Solution || '',
          exercise: exerciseContent ? { content: exerciseContent } : null,
          problemImage: null,
          solutionImage: null
        }
      ]
    }

    return {
      id: dangToanId,
      dangToanName: item.mathType || `Dạng toán ${index + 1}`,
      methods: methodsList
    }
  })
}
