import React from 'react'
import { ShieldAlert } from 'lucide-react'

const ManagerApprovalModal = ({
  managerApprovalModal,
  managerPin,
  setManagerPin,
  setManagerApprovalModal,
  setPendingAction,
  handleManagerAuthSubmit
}) => {
  if (!managerApprovalModal) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ border: '1px solid var(--accent-rose)' }}>
        <div className="modal-header">
          <ShieldAlert size={40} style={{ color: 'var(--accent-rose)', margin: '0 auto 15px auto', display: 'block' }} />
          <h2>صلاحيات المشرف مطلوبة!</h2>
          <p>يتطلب تعديل/حذف سلع الفاتورة موافقة المشرف المسؤول</p>
        </div>
        <form onSubmit={handleManagerAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="form-group">
            <label>أدخل الرمز السري للمشرف (PIN)</label>
            <input 
              type="password" 
              className="form-input" 
              style={{ fontSize: '1.5rem', fontWeight: '700', textAlign: 'center', letterSpacing: '0.2em' }}
              value={managerPin}
              onChange={(e) => setManagerPin(e.target.value)}
              autoFocus
              placeholder="••••"
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ flex: 1 }} 
              onClick={() => {
                setManagerApprovalModal(false)
                setPendingAction(null)
              }}
            >
              إلغاء العملية
            </button>
            <button type="submit" className="btn btn-danger" style={{ flex: 1 }}>
              تأكيد الموافقة
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ManagerApprovalModal
