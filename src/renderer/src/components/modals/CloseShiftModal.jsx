import React from 'react'
import { LogOut } from 'lucide-react'

const CloseShiftModal = ({
  closeShiftModal,
  currentShift,
  actualEndCash,
  setActualEndCash,
  setCloseShiftModal,
  handleConfirmCloseShift
}) => {
  if (!closeShiftModal) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <LogOut size={40} style={{ color: 'var(--accent-rose)', margin: '0 auto 15px auto', display: 'block' }} />
          <h2>تسوية وإنهاء الوردية الحالية</h2>
          <p>تأكيد تصفير حساب الكاشير للوردية #{currentShift?.id}</p>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          ⚠️ <b>ملاحظة الكنترول</b>: المبالغ المتوقعة مخفية عن البائع. سيتم تسجيل أي عجز أو زيادة مباشرة في الخزينة الرئيسية بعد الإدخال المالي للدرج.
        </div>
        <div className="form-group">
          <label>المبلغ الفعلي الموجود بالدرج حالياً (ج.م)</label>
          <input 
            type="number" 
            className="form-input" 
            style={{ fontSize: '1.5rem', fontWeight: '700', textAlign: 'center' }}
            value={actualEndCash} 
            placeholder="0.00"
            onChange={(e) => setActualEndCash(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setCloseShiftModal(false)}>
            إلغاء
          </button>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleConfirmCloseShift}>
            تأكيد وإنهاء الوردية
          </button>
        </div>
      </div>
    </div>
  )
}

export default CloseShiftModal
