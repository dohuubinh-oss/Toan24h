'use client'

import { useEffect, useRef } from 'react'

export default function LectureAntiCheatTracker({ examId }: { examId: string }) {
  const leaveStartTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (!examId) return;

    // Kiểm tra xem bài thi có phải là bài luyện tập không
    // Chế độ Luyện tập (practice) cho phép học sinh tự do tra cứu lý thuyết,
    // chuyển tab và sao chép công thức mà KHÔNG bị tính gian lận.
    try {
      const savedStateStr = sessionStorage.getItem(`exam_state_${examId}`)
      if (savedStateStr) {
        const state = JSON.parse(savedStateStr)
        if (state.isPractice) {
          return
        }
      }
    } catch (e) {
      console.error('Failed to check practice state in tracker', e)
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        leaveStartTimeRef.current = Date.now()
        
        // Tăng cheatCount trong sessionStorage khi rời màn hình
        try {
          const savedStateStr = sessionStorage.getItem(`exam_state_${examId}`)
          if (savedStateStr) {
            const state = JSON.parse(savedStateStr)
            if (!state.isPractice) {
              state.cheatCount = (state.cheatCount || 0) + 1
              sessionStorage.setItem(`exam_state_${examId}`, JSON.stringify(state))
            }
          }
        } catch (e) {
          console.error('Failed to update cheat state', e)
        }
      } else {
        if (leaveStartTimeRef.current) {
          const awayDuration = Date.now() - leaveStartTimeRef.current
          
          // Cộng dồn thời gian rời màn hình
          try {
            const savedStateStr = sessionStorage.getItem(`exam_state_${examId}`)
            if (savedStateStr) {
              const state = JSON.parse(savedStateStr)
              if (!state.isPractice) {
                state.totalAwayTime = (state.totalAwayTime || 0) + awayDuration
                sessionStorage.setItem(`exam_state_${examId}`, JSON.stringify(state))
              }
            }
          } catch (e) {
            console.error('Failed to update total away time', e)
          }
          leaveStartTimeRef.current = null
        }
      }
    }

    const handlePreventCopy = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('contextmenu', handlePreventCopy)
    document.addEventListener('copy', handlePreventCopy)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('contextmenu', handlePreventCopy)
      document.removeEventListener('copy', handlePreventCopy)
    }
  }, [examId])

  return null
}
