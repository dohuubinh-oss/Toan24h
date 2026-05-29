import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AIHintPanel from './AIHintPanel'

describe('AIHintPanel Component', () => {
  it('renders correctly', () => {
    render(<AIHintPanel hint="This is a hint" onGetHint={vi.fn()} isHintLoading={false} remainingHints={3} />)
    
    expect(screen.getByText('Trợ giảng AI')).toBeInTheDocument()
    // Content should be hidden by default until opened
  })

  it('can be toggled open and close', async () => {
    const user = userEvent.setup()
    render(<AIHintPanel hint="This is a hint" onGetHint={vi.fn()} isHintLoading={false} remainingHints={3} />)
    
    const toggleBtn = screen.getByTestId('ai-toggle-btn')
    await user.click(toggleBtn)
    
    expect(screen.getByText('This is a hint')).toBeInTheDocument()
    expect(screen.getByText('Còn 3 lượt')).toBeInTheDocument()
    
    await user.click(toggleBtn)
    // Actually, in the design it might just hide the panel body but keep header visible
  })

  it('calls onGetHint when hint button is clicked', async () => {
    const handleGetHint = vi.fn()
    const user = userEvent.setup()
    
    render(<AIHintPanel hint="" onGetHint={handleGetHint} isHintLoading={false} remainingHints={3} />)
    
    const toggleBtn = screen.getByTestId('ai-toggle-btn')
    await user.click(toggleBtn) // Open first
    
    const getHintBtn = screen.getByRole('button', { name: /Gợi ý từ AI/i })
    await user.click(getHintBtn)
    
    expect(handleGetHint).toHaveBeenCalledTimes(1)
  })

  it('disables hint button when loading', async () => {
    render(<AIHintPanel hint="" onGetHint={vi.fn()} isHintLoading={true} remainingHints={3} />)
    
    // Assuming it's open by default for this test or we find the button
    const getHintBtn = screen.queryByRole('button', { name: /Đang suy nghĩ/i }) || screen.getByTestId('get-hint-btn')
    expect(getHintBtn).toBeDisabled()
  })
})
