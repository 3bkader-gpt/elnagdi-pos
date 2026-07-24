import React from 'react'
import { HelpCircle } from 'lucide-react'

const CustomConfirmModal = ({ customConfirm, closeCustomConfirm }) => {
  if (!customConfirm) return null

  return (
    <div className="modal-overlay" style={{ zIndex: 100001 }}>
      <div className="modal-content" style={{ border: '2px solid var(--accent-blue)', maxWidth: '400px', textAlign: 'center', background: 'var(--bg-card)' }}>
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
            <HelpCircle size={32} />
          </div>
          <h2 style={{ color: 'var(--accent-blue)', fontSize: '1.25rem', margin: '4px 0 0 0', fontWeight: 'bold' }}>{customConfirm.title}</h2>
        </div>
        <div style={{ margin: '15px 0 20px 0', fontSize: '1.05rem', fontWeight: '500', color: 'var(--text-primary)', lineHeight: '1.6' }}>
          {customConfirm.message}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ flex: 1, padding: '10px 0', fontSize: '0.95rem', fontWeight: 'bold' }}
            onClick={() => closeCustomConfirm(false)}
          >
            إلغاء
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            style={{ flex: 1, padding: '10px 0', fontSize: '0.95rem', fontWeight: 'bold' }}
            onClick={() => closeCustomConfirm(true)}
            autoFocus
          >
            تأكيد (Enter)
          </button>
        </div>
      </div>
    </div>
  )
}

export default CustomConfirmModal
