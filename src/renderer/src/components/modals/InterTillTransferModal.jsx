import React, { useState, useEffect } from 'react'
import { ArrowLeftRight, Wallet, Store, Smartphone, Shield } from 'lucide-react'

const TILL_OPTIONS = [
  { id: 'supermarket_cash', label: '💵 كاش درج السوبرماركت (الأساسي)', category: 'cash', icon: Store },
  { id: 'momkn_cash', label: '💵 كاش درج ماكينة ممكن (السيولة الورقية)', category: 'momkn', icon: Smartphone },
  { id: 'momkn_digital', label: '📱 رصيد ماكينة ممكن (الرصيد الرقمي)', category: 'momkn', icon: Smartphone },
  { id: 'vfcash_cash', label: '💵 كاش درج المحافظ / فودافون كاش (السيولة الورقية)', category: 'vfcash', icon: Wallet },
  { id: 'vfcash_digital', label: '📱 رصيد المحافظ / فودافون كاش (الرصيد الرقمي)', category: 'vfcash', icon: Wallet },
  { id: 'main_safe', label: '🏛️ الخزينة الرئيسية للمحل (الخزنة)', category: 'safe', icon: Shield }
]

const InterTillTransferModal = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [sourceTill, setSourceTill] = useState('momkn_cash')
  const [targetTill, setTargetTill] = useState('vfcash_cash')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (isOpen) {
      setSourceTill('momkn_cash')
      setTargetTill('vfcash_cash')
      setAmount('')
      setNotes('')
      setErrorMsg('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleFormSubmit = (e) => {
    e.preventDefault()

    const transferAmount = parseFloat(amount) || 0

    if (transferAmount <= 0) {
      setErrorMsg('الرجاء إدخال مبلغ تحويل صحيح أكبر من الصفر!')
      return
    }

    if (sourceTill === targetTill) {
      setErrorMsg('لا يمكن التحويل من وإلى نفس الدرج!')
      return
    }

    const sourceObj = TILL_OPTIONS.find(t => t.id === sourceTill)
    const targetObj = TILL_OPTIONS.find(t => t.id === targetTill)

    onSubmit({
      sourceTill,
      targetTill,
      sourceLabel: sourceObj?.label || sourceTill,
      targetLabel: targetObj?.label || targetTill,
      amount: transferAmount,
      notes
    })
  }

  const inputStyle = {
    backgroundColor: '#ffffff',
    color: '#111827',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '10px 12px',
    fontSize: '0.95rem',
    width: '100%'
  }

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '500px', 
          width: '95%', 
          backgroundColor: '#ffffff', 
          color: '#111827', 
          borderRadius: '12px', 
          padding: '24px', 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' 
        }}
      >
        <div className="modal-header" style={{ marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ArrowLeftRight size={28} style={{ color: '#2563eb' }} />
            <div>
              <h2 style={{ color: '#111827', margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
                تحويل أموال بين الأدراج والخزائن
              </h2>
              <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '2px 0 0 0' }}>
                نقل سيولة نقدية أو أرصدة ديجيتال بين الخزائن والمحافظ
              </p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '10px 12px', borderRadius: '6px', fontSize: '0.88rem', marginBottom: '14px', border: '1px solid #fca5a5' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Source Till */}
          <div className="form-group">
            <label style={{ color: '#374151', fontWeight: '700', marginBottom: '6px', display: 'block', fontSize: '0.9rem' }}>
              📤 الخروج من (الدرج / الخزينة المصدر): *
            </label>
            <select 
              className="form-input"
              value={sourceTill}
              onChange={(e) => {
                setSourceTill(e.target.value)
                setErrorMsg('')
              }}
              style={inputStyle}
            >
              {TILL_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Target Till */}
          <div className="form-group">
            <label style={{ color: '#374151', fontWeight: '700', marginBottom: '6px', display: 'block', fontSize: '0.9rem' }}>
              📥 التحويل إلى (الدرج / الخزينة المستهدفة): *
            </label>
            <select 
              className="form-input"
              value={targetTill}
              onChange={(e) => {
                setTargetTill(e.target.value)
                setErrorMsg('')
              }}
              style={inputStyle}
            >
              {TILL_OPTIONS.filter(t => t.id !== sourceTill).map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div className="form-group">
            <label style={{ color: '#374151', fontWeight: '700', marginBottom: '6px', display: 'block', fontSize: '0.9rem' }}>
              💵 مبلغ التحويل (ج.م) *
            </label>
            <input 
              type="number" 
              step="0.01"
              className="form-input" 
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                setErrorMsg('')
              }}
              required
              placeholder="مثال: 3370"
              style={{ ...inputStyle, fontSize: '1.1rem', fontWeight: 'bold', textAlign: 'center' }}
              autoFocus
            />
          </div>

          {/* Notes */}
          <div className="form-group">
            <label style={{ color: '#374151', fontWeight: '600', marginBottom: '6px', display: 'block', fontSize: '0.88rem' }}>
              📝 ملاحظات / سبب التحويل
            </label>
            <textarea 
              className="form-input" 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: تغذية رصيد فودافون كاش من كاش ماكينة ممكن"
              rows={2}
              style={inputStyle}
            />
          </div>

          {/* Submit buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '10px', fontSize: '0.95rem' }} onClick={onClose}>
              إلغاء
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '10px', fontSize: '0.95rem', fontWeight: 'bold', backgroundColor: '#2563eb' }}>
              تأكيد وتنفيذ التحويل
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default InterTillTransferModal
