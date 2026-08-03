import React from 'react'
import { Clock, Store, Smartphone, Wallet } from 'lucide-react'

const OpenShiftModal = ({
  openShiftModal,
  currentUser,
  startingCash,
  setStartingCash,
  momknStartBalance,
  setMomknStartBalance,
  momknStartCash,
  setMomknStartCash,
  vfcashStartBalance,
  setVfcashStartBalance,
  vfcashStartCash,
  setVfcashStartCash,
  handleStartShift
}) => {
  if (!openShiftModal) return null

  const inputStyle = {
    fontSize: '1.1rem',
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: '#ffffff',
    color: '#111827',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '8px'
  }

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 99999 }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: 480, 
          width: '95%', 
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          color: '#111827',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div className="modal-header" style={{ paddingBottom: 10, borderBottom: '1px solid #e5e7eb', marginBottom: 12, flexShrink: 0 }}>
          <Clock size={34} style={{ color: '#2563eb', margin: '0 auto 6px auto', display: 'block' }} />
          <h2 style={{ fontSize: '1.25rem', margin: 0, color: '#111827', textAlign: 'center' }}>فتح وردية مبيعات جديدة</h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem', textAlign: 'center' }}>البائع الحالي: <strong>{currentUser?.username}</strong></p>
        </div>

        {/* Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Section 1: Supermarket Drawer */}
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
            <label style={{ fontSize: '0.88rem', fontWeight: '700', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Store size={16} /> كاش درج السوبر ماركت (العهدة الافتتاحية) *
            </label>
            <input 
              type="number" 
              className="form-input" 
              style={inputStyle}
              value={startingCash} 
              onChange={(e) => setStartingCash(e.target.value)}
              placeholder="200"
              autoFocus
            />
            <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
              الفكة أو العهدة النقدية التي تبدأ بها ورديتك بالدرج الأساسي
            </small>
          </div>

          {currentUser?.role === 'admin' && (
            <>
              {/* Section 2: Momkn Till (Admin only) */}
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 12 }}>
                <label style={{ fontSize: '0.88rem', fontWeight: '700', color: '#1e40af', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Smartphone size={16} /> 2. درج ماكينة ممكن (الديجيتال والسيولة) *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#1e3a8a', display: 'block', marginBottom: 4 }}>📱 رصيد المكنة (ديجيتال):</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      style={inputStyle}
                      value={momknStartBalance} 
                      onChange={(e) => setMomknStartBalance(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#1e3a8a', display: 'block', marginBottom: 4 }}>💵 كاش الدرج (الفلوس الورق):</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      style={inputStyle}
                      value={momknStartCash} 
                      onChange={(e) => setMomknStartCash(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Mobile Money Till (Admin only) */}
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, padding: 12 }}>
                <label style={{ fontSize: '0.88rem', fontWeight: '700', color: '#047857', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Wallet size={16} /> 3. درج المحافظ والتحويلات (الديجيتال والسيولة) *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#065f46', display: 'block', marginBottom: 4 }}>📱 رصيد فودافون (ديجيتال):</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      style={inputStyle}
                      value={vfcashStartBalance} 
                      onChange={(e) => setVfcashStartBalance(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#065f46', display: 'block', marginBottom: 4 }}>💵 كاش الدرج (الفلوس الورق):</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      style={inputStyle}
                      value={vfcashStartCash} 
                      onChange={(e) => setVfcashStartCash(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div style={{ paddingTop: '12px', borderTop: '1px solid #e5e7eb', marginTop: '10px', flexShrink: 0 }}>
          <button className="btn btn-success" onClick={handleStartShift} style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 'bold' }}>
            تأكيد فتح الوردية وبدء العمل
          </button>
        </div>
      </div>
    </div>
  )
}

export default OpenShiftModal
