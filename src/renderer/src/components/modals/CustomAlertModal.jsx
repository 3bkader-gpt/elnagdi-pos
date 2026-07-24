import React from 'react'

const CustomAlertModal = ({ customAlert, closeCustomAlert }) => {
  if (!customAlert) return null

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ border: '2px solid var(--accent-rose)', maxWidth: '400px', textAlign: 'center', background: 'var(--bg-card)' }}>
        <div className="modal-header">
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>⚠️</span>
          <h2 style={{ color: 'var(--accent-rose)', fontSize: '1.4rem', margin: 0 }}>{customAlert.title}</h2>
        </div>
        <div style={{ margin: '20px 0', fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--text-main)', lineHeight: '1.6' }}>
          {customAlert.message}
        </div>
        <div style={{ marginTop: '20px' }}>
          <button 
            type="button" 
            className="btn btn-danger" 
            style={{ width: '100%', padding: '12px 0', fontSize: '1.05rem', fontWeight: 'bold', background: 'var(--accent-rose)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            onClick={closeCustomAlert}
            autoFocus
          >
            موافق (Enter)
          </button>
        </div>
      </div>
    </div>
  )
}

export default CustomAlertModal
