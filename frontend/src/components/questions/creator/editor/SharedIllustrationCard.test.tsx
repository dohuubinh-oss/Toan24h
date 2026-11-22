import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SharedIllustrationCard from './SharedIllustrationCard'

describe('SharedIllustrationCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state with AI prompt and upload buttons', () => {
    const onUpdateDiagram = vi.fn()
    render(
      <SharedIllustrationCard
        diagramSvg={null}
        isGroup={false}
        questionContent="Cho tam giác ABC"
        solutionContent="Kẻ đường cao AH"
        onUpdateDiagram={onUpdateDiagram}
      />
    )

    expect(screen.getByText('Hình vẽ minh họa bài toán')).toBeInTheDocument()
    expect(screen.getByText('Chưa có hình vẽ minh họa cho bài toán này')).toBeInTheDocument()
    expect(screen.getByText('Vẽ hình minh hoạ')).toBeInTheDocument()
    expect(screen.getAllByText('Tải ảnh lên').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Bấm Ctrl+V để dán')).toBeInTheDocument()
  })

  it('renders SVG illustration and comprehensive diagram actions when SVG is provided', () => {
    const onUpdateDiagram = vi.fn()
    const svgCode = '<svg viewBox="0 0 500 400"><circle cx="250" cy="200" r="50"/></svg>'

    render(
      <SharedIllustrationCard
        diagramSvg={svgCode}
        isGroup={true}
        questionContent="Cho tam giác ABC"
        solutionContent="Kẻ đường cao AH"
        onUpdateDiagram={onUpdateDiagram}
      />
    )

    expect(screen.getByText('Hình vẽ minh họa bài toán')).toBeInTheDocument()
    expect(screen.getByText('Sửa hình minh hoạ')).toBeInTheDocument()
    expect(screen.getByText('Sao chép SVG')).toBeInTheDocument()
    expect(screen.getByText('Xóa')).toBeInTheDocument()
    expect(screen.getByTestId('illustration-svg')).toBeInTheDocument()
  })

  it('opens and closes the AI refinement modal', () => {
    const onUpdateDiagram = vi.fn()
    render(
      <SharedIllustrationCard
        diagramSvg={null}
        questionContent="Cho hình vuông ABCD"
        solutionContent="Nối AC và BD cắt nhau tại O"
        onUpdateDiagram={onUpdateDiagram}
      />
    )

    // Click Vẽ hình minh hoạ button in empty state
    const aiBtn = screen.getByText('Vẽ hình minh hoạ')
    fireEvent.click(aiBtn)

    expect(screen.getAllByText('Vẽ hình minh hoạ').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText(/Nối AC và BD/)).toBeInTheDocument()

    // Click cancel button
    const cancelBtn = screen.getByText('Hủy')
    fireEvent.click(cancelBtn)

    // Modal is closed
    expect(screen.getAllByText('Vẽ hình minh hoạ').length).toBe(1)
  })

  it('handles delete confirmation', () => {
    const onUpdateDiagram = vi.fn()
    window.confirm = vi.fn(() => true)

    render(
      <SharedIllustrationCard
        diagramSvg="https://example.com/diagram.png"
        onUpdateDiagram={onUpdateDiagram}
      />
    )

    const deleteBtn = screen.getByText('Xóa')
    fireEvent.click(deleteBtn)

    expect(window.confirm).toHaveBeenCalled()
    expect(onUpdateDiagram).toHaveBeenCalledWith(null)
  })

  it('copies SVG content to clipboard', async () => {
    const onUpdateDiagram = vi.fn()
    const svgCode = '<svg><rect/></svg>'

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })

    render(
      <SharedIllustrationCard
        diagramSvg={svgCode}
        onUpdateDiagram={onUpdateDiagram}
      />
    )

    const copyBtn = screen.getByText('Sao chép SVG')
    fireEvent.click(copyBtn)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(svgCode)
  })

  it('distinguishes between question diagram and full solution diagram in status badge', () => {
    const onUpdateDiagram = vi.fn()

    // Test with solid question SVG
    const { rerender } = render(
      <SharedIllustrationCard
        diagramSvg='<svg><line x1="0" y1="0" x2="100" y2="100" stroke="#0f172a" /></svg>'
        onUpdateDiagram={onUpdateDiagram}
      />
    )
    expect(screen.getByText('Hình đề bài (Nét liền)')).toBeInTheDocument()

    // Test with solution SVG containing auxiliary dashed line
    rerender(
      <SharedIllustrationCard
        diagramSvg='<svg><line x1="0" y1="0" x2="100" y2="100" stroke="#2563eb" stroke-dasharray="6,4" /></svg>'
        onUpdateDiagram={onUpdateDiagram}
      />
    )
    expect(screen.getByText('Hình bài giải (Kèm nét đứt)')).toBeInTheDocument()
  })

  it('allows opening modal specifically for solution diagram and switching between targets', () => {
    const onUpdateDiagram = vi.fn()

    render(
      <SharedIllustrationCard
        diagramSvg={null}
        questionContent="Cho hình thang cân ABCD"
        solutionContent="Kẻ đường cao AH và BK vuông góc CD"
        onUpdateDiagram={onUpdateDiagram}
      />
    )

    // Open directly with "Tạo hình bài giải"
    const solutionBtn = screen.getAllByText('Tạo hình bài giải')[0]
    fireEvent.click(solutionBtn)

    expect(screen.getByText('Bài giải (Kèm nét đứt)')).toBeInTheDocument()
    expect(screen.getByText('2. Hình vẽ TOÀN BỘ BÀI GIẢI')).toBeInTheDocument()

    // Switch to question diagram mode
    const questionToggleBtn = screen.getByText('1. Hình vẽ ĐỀ BÀI (Câu hỏi)')
    fireEvent.click(questionToggleBtn)

    expect(screen.getByText('Đề bài (Nét liền)')).toBeInTheDocument()
  })
})
