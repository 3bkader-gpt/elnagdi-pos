import React from 'react'
import { Clock } from 'lucide-react'

const OpenShiftModal = ({
  openShiftModal,
  currentUser,
  startingCash,
  setStartingCash,
  handleStartShift
}) => {
  if (!openShiftModal) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <Clock size={40} style={{ color: 'var(--accent-blue)', margin: '0 auto 15px auto', display: 'block' }} />
          <h2>فتح وردية مبيعات جديدة</h2>
          <p>البائع الحالي: {currentUser?.username}</p>
        </div>
        <div className="form-group">
          <label>المبلغ المالي الافتتاحي بالدرج (العهدة / الفكة)</label>
          <input 
            type="number" 
            className="form-input" 
            style={{ fontSize: '1.5rem', fontWeight: '700', textAlign: 'center' }}
            value={startingCash} 
            onChange={(e) => setStartingCash(e.target.value)}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', textAlign: 'center', marginTop: '6px' }}>
            💡 نظام التوريد: يتم تسليم إيراد الوردية السابقة في ظرف. هذا المبلغ هو فقط "العهدة" أو "الفكة" التي تبدأ بها ورديتك (الافتراضي 200 ج.م).
          </span>
        </div>
        <button className="btn btn-success" onClick={handleStartShift}>
          تأكيد فتح الوردية وبدء العمل
        </button>
      </div>
    </div>
  )
}

export default OpenShiftModal
