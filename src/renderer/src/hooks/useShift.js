import { useState } from 'react'
import { getActiveShift } from '../lib/dao/shifts.dao'

/**
 * Custom hook to manage shifts, locking, and authentication state.
 */
export function useShift() {
  const [currentUser, setCurrentUser] = useState(null)
  const [currentShift, setCurrentShift] = useState(null)
  const [isLocked, setIsLocked] = useState(true)

  // Shift Modals
  const [openShiftModal, setOpenShiftModal] = useState(false)
  const [startingCash, setStartingCash] = useState('100')
  const [closeShiftModal, setCloseShiftModal] = useState(false)
  const [actualEndCash, setActualEndCash] = useState('')

  // Manager Approval Modal
  const [managerApprovalModal, setManagerApprovalModal] = useState(false)
  const [managerPin, setManagerPin] = useState('')
  const [pendingAction, setPendingAction] = useState(null) // { type: string, payload: any }

  const handleLock = () => {
    setIsLocked(true)
    setCurrentUser(null)
    setCurrentShift(null)
  }

  const checkActiveShift = async () => {
    try {
      const active = await getActiveShift()
      if (active) {
        console.log('[useShift] Found active shift:', active)
        // Set both current shift and the corresponding cashier
        setCurrentShift(active)
        setCurrentUser({
          id: active.user_id,
          username: active.username,
          role: active.role
        })
        setIsLocked(false)
      }
    } catch (e) {
      console.error('[useShift] Failed to check active shift:', e)
    }
  }

  return {
    currentUser,
    setCurrentUser,
    currentShift,
    setCurrentShift,
    isLocked,
    setIsLocked,
    openShiftModal,
    setOpenShiftModal,
    startingCash,
    setStartingCash,
    closeShiftModal,
    setCloseShiftModal,
    actualEndCash,
    setActualEndCash,
    managerApprovalModal,
    setManagerApprovalModal,
    managerPin,
    setManagerPin,
    pendingAction,
    setPendingAction,
    handleLock,
    checkActiveShift
  }
}
