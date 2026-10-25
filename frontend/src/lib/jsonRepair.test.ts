import { describe, it, expect } from 'vitest'
import { cleanAndRepairJson, safeJsonParse, extractJsonFromMarkdown } from './jsonRepair'

describe('jsonRepair', () => {
  it('extracts JSON from markdown code fence', () => {
    const raw = '```json\n[{"name": "test"}]\n```'
    expect(extractJsonFromMarkdown(raw)).toBe('[{"name": "test"}]')
  })

  it('parses standard valid JSON without modification', () => {
    const valid = '[{"id": 1, "content": "Tam giác ABC"}]'
    const res = safeJsonParse(valid)
    expect(res).toEqual([{ id: 1, content: 'Tam giác ABC' }])
  })

  it('repairs unescaped LaTeX commands such as \\frac, \\sqrt, \\alpha, \\pm', () => {
    // Single backslashes in JSON string literal that fail standard JSON.parse
    const invalidJson = '[\n  {\n    "content": "Tính $A = \\frac{\\sqrt{x}+1}{x-1}$",\n    "solution": "Áp dụng $\\pm \\sqrt{2}$ và $\\alpha = 30^\\circ$"\n  }\n]'
    
    // Standard parse should throw
    expect(() => JSON.parse(invalidJson)).toThrow()

    // safeJsonParse should repair and succeed
    const res = safeJsonParse(invalidJson)
    expect(res).toHaveLength(1)
    expect(res[0].content).toContain('\\frac{\\sqrt{x}+1}{x-1}')
    expect(res[0].solution).toContain('\\pm \\sqrt{2}')
  })

  it('preserves \\text and \\times without turning \\t into a tab character', () => {
    const invalidJson = '[\n  {\n    "content": "Biết $AB = 5\\text{ cm}$ và $A \\times B$"\n  }\n]'
    const res = safeJsonParse(invalidJson)
    expect(res[0].content).toContain('\\text{ cm}')
    expect(res[0].content).toContain('\\times')
  })

  it('handles trailing commas before closing braces', () => {
    const invalidJson = '[\n  {\n    "id": 1,\n    "title": "Test",\n  },\n]'
    expect(() => JSON.parse(invalidJson)).toThrow()

    const res = safeJsonParse(invalidJson)
    expect(res).toEqual([{ id: 1, title: 'Test' }])
  })

  it('repairs unescaped newlines inside strings', () => {
    const withNewline = '[\n  {\n    "content": "Dòng 1\nDòng 2"\n  }\n]'
    const res = safeJsonParse(withNewline)
    expect(res[0].content).toContain('Dòng 1')
  })
})
