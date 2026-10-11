import { describe, it, expect } from 'vitest'
import { parseLectureJson, buildExerciseHtmlFromExams } from './lectureJsonParser'

describe('lectureJsonParser', () => {
  it('throws error for invalid JSON string', () => {
    expect(() => parseLectureJson('invalid json')).toThrow('JSON không hợp lệ')
  })

  it('throws error if JSON is not an array', () => {
    expect(() => parseLectureJson('{"mathType": "Dạng 1"}')).toThrow('Dữ liệu JSON phải là một danh sách (mảng []) các Dạng toán')
  })

  it('throws error if JSON array is empty', () => {
    expect(() => parseLectureJson('[]')).toThrow('Danh sách Dạng toán không được để trống')
  })

  it('parses valid math types and maps to DangToanItem array', () => {
    const sample = JSON.stringify([
      {
        mathType: 'Dạng 1. Nhận biết đơn thức',
        Solution: 'Đơn thức là biểu thức...',
        exams: [
          {
            problem: 'Ví dụ 1',
            conclusion: 'Kết luận 1',
            steps: [
              { step: 1, title: 'Bước 1', content: 'Giải thích', formula: '-x^2y' }
            ]
          }
        ]
      }
    ])

    const result = parseLectureJson(sample)
    expect(result).toHaveLength(1)
    expect(result[0].dangToanName).toBe('Dạng 1. Nhận biết đơn thức')
    expect(result[0].methods).toHaveLength(1)
    expect(result[0].methods[0].methodContent).toBe('Đơn thức là biểu thức...')
    expect(result[0].methods[0].exercise?.content).toContain('Ví dụ 1')
    expect(result[0].methods[0].exercise?.content).toContain('Kết luận 1')
    expect(result[0].methods[0].exercise?.content).toContain('$$ -x^2y $$'.replace(/\s+/g, ''))
  })

  it('combines multiple exams in a single method exercise content', () => {
    const exams = [
      { problem: 'Ví dụ 1', steps: [{ step: 1, content: 'B1' }] },
      { problem: 'Ví dụ 2', steps: [{ step: 1, content: 'B2' }] }
    ]

    const html = buildExerciseHtmlFromExams(exams)
    expect(html).toContain('Ví dụ 1')
    expect(html).toContain('Ví dụ 2')
    expect(html).toContain('my-8 border-t border-dashed')
  })

  it('parses math types with explicit methods array and multiple methods', () => {
    const sample = JSON.stringify([
      {
        mathType: 'Dạng 1. Đơn thức',
        methods: [
          {
            methodName: 'Phương pháp A',
            Solution: 'Lý thuyết PP A',
            exams: [{ problem: 'Ví dụ PP A' }]
          },
          {
            methodName: 'Phương pháp B',
            Solution: 'Lý thuyết PP B',
            exams: [{ problem: 'Ví dụ PP B' }]
          }
        ]
      }
    ])

    const result = parseLectureJson(sample)
    expect(result).toHaveLength(1)
    expect(result[0].dangToanName).toBe('Dạng 1. Đơn thức')
    expect(result[0].methods).toHaveLength(2)
    expect(result[0].methods[0].methodName).toBe('Phương pháp A')
    expect(result[0].methods[0].methodContent).toBe('Lý thuyết PP A')
    expect(result[0].methods[0].exercise?.content).toContain('Ví dụ PP A')
    expect(result[0].methods[1].methodName).toBe('Phương pháp B')
    expect(result[0].methods[1].methodContent).toBe('Lý thuyết PP B')
    expect(result[0].methods[1].exercise?.content).toContain('Ví dụ PP B')
  })

  it('parses math types with method key (singular)', () => {
    const sample = JSON.stringify([
      {
        mathType: 'Dạng 1. Đơn thức',
        method: [
          {
            Solution: 'Lý thuyết đơn thức',
            exams: [{ problem: 'Ví dụ 1' }]
          }
        ]
      }
    ])

    const result = parseLectureJson(sample)
    expect(result).toHaveLength(1)
    expect(result[0].methods).toHaveLength(1)
    expect(result[0].methods[0].methodContent).toBe('Lý thuyết đơn thức')
    expect(result[0].methods[0].exercise?.content).toContain('Ví dụ 1')
  })

  it('handles empty method object {} and null formulas gracefully', () => {
    const sample = JSON.stringify([
      {
        mathType: 'Dạng 1',
        methods: [
          {},
          {
            Solution: 'PP2',
            exams: [
              {
                problem: 'Đề bài',
                steps: [
                  { step: 1, title: 'B1', content: 'Nội dung', formula: 'null' },
                  { step: 2, title: 'B2', content: 'Nội dung', formula: '' }
                ]
              }
            ]
          }
        ]
      }
    ])

    const result = parseLectureJson(sample)
    expect(result).toHaveLength(1)
    expect(result[0].methods).toHaveLength(2)
    expect(result[0].methods[0].methodContent).toBe('')
    expect(result[0].methods[0].exercise).toBeNull()
    expect(result[0].methods[1].exercise?.content).not.toContain('$$null$$')
    expect(result[0].methods[1].exercise?.content).toContain('B1')
  })

  it('parses the real production vidu.json file with 6 Dang Toan', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path')
    const filePath = path.resolve(process.cwd(), '../vidu.json')
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8')
      const result = parseLectureJson(content)
      expect(result).toHaveLength(6)
      expect(result[0].dangToanName).toBe('Dạng 1. Nhận biết đơn thức')
      expect(result[0].methods[0].exercise?.content).toContain('Ví dụ 1')
      expect(result[0].methods[0].exercise?.content).toContain('Ví dụ 2')
      expect(result[5].dangToanName).toBe('Dạng 6. Cộng, trừ các đơn thức đồng dạng')
      expect(result[5].methods[0].exercise?.content).toContain('Ví dụ 8')
      expect(result[5].methods[0].exercise?.content).toContain('Ví dụ 11')
    }
  })
})

