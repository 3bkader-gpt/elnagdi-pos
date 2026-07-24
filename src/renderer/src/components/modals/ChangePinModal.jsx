import React, { useState } from 'react'
import { KeyRound, Lock, CheckCircle2, AlertCircle } from 'lucide-react'
import { executeQuery } from '../../lib/db' // sqlite interface wrapper
import { playSound } from '../../lib/utils'

const ChangePinModal = ({
  showChangePinModal,
  setShowChangePinModal,
  currentUser,
  setCurrentUser
}) => {
  if (!showChangePinModal || !currentUser) return null

  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    // Basic Validations
    if (currentPin !== currentUser.password_hash) {
      setErrorMsg('رمز المرور الحالي غير صحيح!')
      playSound('error')
      return
    }

    if (!/^\d{4}$/.test(newPin)) {
      setErrorMsg('يجب أن يتكون رمز المرور الجديد من 4 أرقام فقط!')
      playSound('error')
      return
    }

    if (newPin === currentPin) {
      setErrorMsg('رمز المرور الجديد لا يجب أن يكون متطابقاً مع القديم!')
      playSound('error')
      return
    }

    if (newPin !== confirmPin) {
      setErrorMsg('تأكيد رمز المرور الجديد غير متطابق!')
      playSound('error')
      return
    }

    try {
      // Update in DB
      await executeQuery(`
        UPDATE users 
        SET password_hash = '${newPin}' 
        WHERE id = ${currentUser.id};
      `)

      // Update current user state
      setCurrentUser(prev => ({
        ...prev,
        password_hash: newPin
      }))

      playSound('success')
      setSuccessMsg('تم تغيير رمز المرور بنجاح!')
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')

      // Close modal after 1.5 seconds
      setTimeout(() => {
        setShowChangePinModal(false)
        setSuccessMsg('')
      }, 1500)

    } catch (err) {
      setErrorMsg('فشل تحديث رمز المرور: ' + err.message)
      playSound('error')
    }
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 100000 }}>
      <div className="modal-content" style={{ maxWidth: '380px', padding: '25px' }}>
        
        <div className="modal-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            color: 'var(--accent-blue)',
            padding: '12px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <KeyRound size={28} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>
            تغيير رمز المرور الخاص بك
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            المستخدم: <strong>{currentUser.username}</strong> ({currentUser.role === 'admin' ? 'مدير' : 'كاشير'})
          </p>
        </div>

        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '8px 12px',
            borderRadius: '6px',
            color: 'var(--accent-rose)',
            fontSize: '0.8rem'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            padding: '8px 12px',
            borderRadius: '6px',
            color: 'var(--accent-emerald)',
            fontSize: '0.8rem'
          }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
          
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>رمز المرور الحالي *</label>
            <input 
              type="password"
              pattern="\d{4}"
              maxLength="4"
              className="form-input"
              style={{ fontSize: '1.1rem', letterSpacing: '0.3em', textAlign: 'center', padding: '6px' }}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
              required
              placeholder="••••"
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>رمز المرور الجديد (4 أرقام) *</label>
            <input 
              type="password"
              pattern="\d{4}"
              maxLength="4"
              className="form-input"
              style={{ fontSize: '1.1rem', letterSpacing: '0.3em', textAlign: 'center', padding: '6px' }}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              required
              placeholder="••••"
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>تأكيد رمز المرور الجديد *</label>
            <input 
              type="password"
              pattern="\d{4}"
              maxLength="4"
              className="form-input"
              style={{ fontSize: '1.1rem', letterSpacing: '0.3em', textAlign: 'center', padding: '6px' }}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              required
              placeholder="••••"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }} 
              onClick={() => setShowChangePinModal(false)}
            >
              إلغاء
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
            >
              تحديث الرمز
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}

export default ChangePinModal
