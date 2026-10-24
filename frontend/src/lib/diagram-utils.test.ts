import { describe, it, expect } from 'vitest'
import { extractDiagramSvg } from './diagram-utils'

describe('extractDiagramSvg', () => {
  it('extracts direct diagram_svg if present', () => {
    const svg = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" /></svg>'
    expect(extractDiagramSvg(svg)).toBe(svg)
  })

  it('extracts diagram_svg from object solution_guide', () => {
    const svg = '<svg viewBox="0 0 100 100"><rect width="50" height="50" /></svg>'
    expect(extractDiagramSvg(null, { diagram_svg: svg })).toBe(svg)
    expect(extractDiagramSvg(undefined, { diagramSvg: svg })).toBe(svg)
  })

  it('extracts diagram_svg from stringified JSON solution_guide', () => {
    const svg = '<svg viewBox="0 0 100 100"><polygon points="0,0 50,50 0,50" /></svg>'
    const jsonStr = JSON.stringify({ steps: ['b1', 'b2'], diagram_svg: svg })
    expect(extractDiagramSvg('', jsonStr)).toBe(svg)
  })

  it('extracts embedded svg from freeform text solution_guide', () => {
    const svg = '<svg viewBox="0 0 100 100"><line x1="0" y1="0" x2="100" y2="100" /></svg>'
    const text = `Lời giải chi tiết:\n${svg}\nKết luận: x = 1`
    expect(extractDiagramSvg(null, text)).toBe(svg)
  })

  it('extracts svg from markdown code blocks in rawDiagram', () => {
    const svg = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" /></svg>'
    const md = '```xml\n' + svg + '\n```'
    expect(extractDiagramSvg(md)).toBe(svg)
  })

  it('extracts diagram_svg from object rawDiagram or JSON string rawDiagram', () => {
    const svg = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" /></svg>'
    expect(extractDiagramSvg({ diagram_svg: svg })).toBe(svg)
    expect(extractDiagramSvg(JSON.stringify({ diagram_svg: svg }))).toBe(svg)
  })

  it('preserves image upload URLs', () => {
    expect(extractDiagramSvg('/uploads/questions/9/test.png')).toBe('/uploads/questions/9/test.png')
    expect(extractDiagramSvg('uploads/temp/abc.png')).toBe('uploads/temp/abc.png')
  })

  it('returns null when no diagram is found', () => {
    expect(extractDiagramSvg(null, null)).toBeNull()
    expect(extractDiagramSvg('', '')).toBeNull()
    expect(extractDiagramSvg('   ', { steps: [] })).toBeNull()
  })
})
