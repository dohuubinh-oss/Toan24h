import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MilestoneTabs } from './MilestoneTabs'
import { ExamMilestone } from '@/lib/examMilestoneProgression'

describe('MilestoneTabs Component', () => {
  const defaultCounts: Record<ExamMilestone, number> = {
    midterm_1: 4,
    final_1: 6,
    midterm_2: 2,
    final_2: 0,
    topics: 9,
  }

  it('renders all 5 milestone tabs with their titles', () => {
    render(
      <MilestoneTabs
        activeMilestone="midterm_1"
        currentProgressMilestone="midterm_1"
        counts={defaultCounts}
        onSelect={vi.fn()}
      />
    )

    expect(screen.getByText('Giữa kì 1')).toBeInTheDocument()
    expect(screen.getByText('Cuối kì 1')).toBeInTheDocument()
    expect(screen.getByText('Giữa kì 2')).toBeInTheDocument()
    expect(screen.getByText('Cuối kì 2')).toBeInTheDocument()
    expect(screen.getByText('Chuyên đề & Ôn tập')).toBeInTheDocument()
  })

  it('displays the correct exam count badge for each milestone', () => {
    render(
      <MilestoneTabs
        activeMilestone="midterm_1"
        currentProgressMilestone="midterm_1"
        counts={defaultCounts}
        onSelect={vi.fn()}
      />
    )

    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('9')).toBeInTheDocument()
  })

  it('displays the 🎯 Đang học badge on the current progress milestone', () => {
    render(
      <MilestoneTabs
        activeMilestone="midterm_1"
        currentProgressMilestone="midterm_2"
        counts={defaultCounts}
        onSelect={vi.fn()}
      />
    )

    const currentBadge = screen.getByText(/Đang học/i)
    expect(currentBadge).toBeInTheDocument()

    // Tab Giữa kì 2 should contain this badge
    const midterm2Tab = screen.getByRole('tab', { name: /Giữa kì 2/i })
    expect(midterm2Tab).toContainElement(currentBadge)
  })

  it('displays Đã học qua badge on completed milestones prior to current progress', () => {
    render(
      <MilestoneTabs
        activeMilestone="midterm_2"
        currentProgressMilestone="midterm_2"
        counts={defaultCounts}
        onSelect={vi.fn()}
      />
    )

    // With currentProgressMilestone = midterm_2:
    // midterm_1 and final_1 are passed, while midterm_2 is current and final_2 is future.
    const midterm1Tab = screen.getByRole('tab', { name: /Giữa kì 1/i })
    const final1Tab = screen.getByRole('tab', { name: /Cuối kì 1/i })
    const final2Tab = screen.getByRole('tab', { name: /Cuối kì 2/i })

    expect(midterm1Tab).toHaveTextContent(/Đã.*qua/i)
    expect(final1Tab).toHaveTextContent(/Đã.*qua/i)
    expect(final2Tab).not.toHaveTextContent(/Đã.*qua/i)
    expect(final2Tab).not.toHaveTextContent(/Đang học/i)
  })

  it('calls onSelect with the selected milestone id when clicked', () => {
    const handleSelect = vi.fn()
    render(
      <MilestoneTabs
        activeMilestone="midterm_1"
        currentProgressMilestone="midterm_1"
        counts={defaultCounts}
        onSelect={handleSelect}
      />
    )

    const final1Tab = screen.getByRole('tab', { name: /Cuối kì 1/i })
    fireEvent.click(final1Tab)

    expect(handleSelect).toHaveBeenCalledTimes(1)
    expect(handleSelect).toHaveBeenCalledWith('final_1')
  })

  it('sets aria-selected="true" for the active milestone and false for others', () => {
    render(
      <MilestoneTabs
        activeMilestone="final_1"
        currentProgressMilestone="midterm_1"
        counts={defaultCounts}
        onSelect={vi.fn()}
      />
    )

    const midterm1Tab = screen.getByRole('tab', { name: /Giữa kì 1/i })
    const final1Tab = screen.getByRole('tab', { name: /Cuối kì 1/i })

    expect(final1Tab).toHaveAttribute('aria-selected', 'true')
    expect(midterm1Tab).toHaveAttribute('aria-selected', 'false')
  })

  it('satisfies touch target and focus-visible accessibility requirements', () => {
    render(
      <MilestoneTabs
        activeMilestone="midterm_1"
        currentProgressMilestone="midterm_1"
        counts={defaultCounts}
        onSelect={vi.fn()}
      />
    )

    const tabs = screen.getAllByRole('tab')
    expect(tabs.length).toBe(5)
    for (const tab of tabs) {
      expect(tab.className).toContain('min-h-[44px]')
      expect(tab.className).toContain('focus-visible:ring-2')
    }
  })
})
