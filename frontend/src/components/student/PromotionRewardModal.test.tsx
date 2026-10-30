import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PromotionRewardModal from './PromotionRewardModal'

describe('PromotionRewardModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('does not render when show is false and no localStorage item exists', () => {
    render(<PromotionRewardModal show={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders modal when show prop is true with custom months', () => {
    render(<PromotionRewardModal show={true} months={2} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Tặng Bạn 2 Tháng VIP!/i)).toBeInTheDocument()
    expect(screen.getByText(/Mở khóa toàn bộ ngân hàng câu hỏi/i)).toBeInTheDocument()
  })

  it('automatically opens when promo_reward_months is present in localStorage', () => {
    localStorage.setItem('promo_reward_months', '1')
    render(<PromotionRewardModal />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Tặng Bạn 1 Tháng VIP!/i)).toBeInTheDocument()
  })

  it('clears localStorage and closes when clicking "Bắt đầu học ngay"', () => {
    localStorage.setItem('promo_reward_months', '1')
    const onClose = vi.fn()
    render(<PromotionRewardModal onClose={onClose} />)

    const btn = screen.getByRole('button', { name: /Bắt đầu học ngay/i })
    fireEvent.click(btn)

    expect(localStorage.getItem('promo_reward_months')).toBeNull()
    expect(onClose).toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('clears localStorage and closes when clicking close icon', () => {
    localStorage.setItem('promo_reward_months', '1')
    render(<PromotionRewardModal />)

    const closeBtn = screen.getByRole('button', { name: /Đóng thông báo/i })
    fireEvent.click(closeBtn)

    expect(localStorage.getItem('promo_reward_months')).toBeNull()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
