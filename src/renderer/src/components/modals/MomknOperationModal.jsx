import React, { useState, useEffect } from 'react'

const MomknOperationModal = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [operationType, setOperationType] = useState('payment') // 'payment', 'refund', 'recharge'
  const [description, setDescription] = useState('')
  const [digitalAmount, setDigitalAmount] = useState('')
  const [cashAmount, setCashAmount] = useState('')
  const [commission, setCommission] = useState('0')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (isOpen) {
      setOperationType('payment')
      setDescription('')
      setDigitalAmount('')
      setCashAmount('')
      setCommission('0')
      setNotes('')
    }
  }, [isOpen])

  // Handlers for bidirectional auto-calculation
  const handleDigitalChange = (val) => {
    setDigitalAmount(val)
    const dig = parseFloat(val) || 0
    if (operationType === 'payment') {
      const com = parseFloat(commission) || 0
      setCashAmount(val ? (dig + com)?.toFixed(2) : '')
    } else {
      setCashAmount(val)
      setCommission('0')
    }
  }

  const handleCashChange = (val) => {
    setCashAmount(val)
    const cash = parseFloat(val) || 0
    const dig = parseFloat(digitalAmount) || 0
    if (operationType === 'payment' && dig > 0 && cash >= dig) {
      setCommission((cash - dig)?.toFixed(2))
    }
  }

  const handleCommissionChange = (val) => {
    setCommission(val)
    const com = parseFloat(val) || 0
    const dig = parseFloat(digitalAmount) || 0
    if (operationType === 'payment') {
      setCashAmount((dig + com)?.toFixed(2))
    }
  }

  const handleTypeChange = (type) => {
    setOperationType(type)
    const dig = parseFloat(digitalAmount) || 0
    if (type === 'payment') {
      const com = parseFloat(commission) || 0
      setCashAmount(digitalAmount ? (dig + com)?.toFixed(2) : '')
    } else {
      setCashAmount(digitalAmount)
      setCommission('0')
    }
  }

  if (!isOpen) return null

  const handleFormSubmit = (e) => {
    e.preventDefault()

    const digVal = parseFloat(digitalAmount) || 0
    const cashVal = parseFloat(cashAmount) || 0
    const comVal = parseFloat(commission) || 0

    if (digVal <= 0) {
      setErrorMsg('الرجاء إدخال مبلغ صحيح أكبر من الصفر!')
      return
    }

    let digitalImpact = 0
    let cashImpact = 0

    if (operationType === 'payment') {
      digitalImpact = -digVal // machine balance decreases
      cashImpact = cashVal    // cash drawer increases
    } else if (operationType === 'refund') {
      digitalImpact = digVal  // machine balance refunded/increases
      cashImpact = -cashVal   // cash drawer refunded/decreases
    } else if (operationType === 'recharge') {
      digitalImpact = digVal  // machine balance increases
      cashImpact = -cashVal   // cash drawer decreases (paid cash)
    }

    onSubmit({
      operationType,
      description: description || (operationType === 'payment' ? 'دفع خدمة ممكن' : operationType === 'recharge' ? 'شحن رصيد المكنة كاش' : 'استرداد عملية'),
      digitalImpact,
      cashImpact,
      commission: comVal,
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

  const computedInputStyle = {
    backgroundColor: '#f3f4f6',
    color: '#111827',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '10px 12px',
    fontSize: '0.95rem',
    width: '100%',
    fontWeight: 'bold'
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '460px', maxHeight: 'calc(100vh - 40px)', overflowY: 'auto', backgroundColor: '#ffffff', color: '#111827', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        <div className="modal-header" style={{ marginBottom: '16px' }}>
          <h2 style={{ color: '#111827', margin: 0, fontSize: '1.4rem' }}>تسجيل حركة مكنة ممكن</h2>
          <p style={{ color: '#6b7280', fontSize: '0.88rem', marginTop: '4px' }}>أدخل بيانات العملية لتعديل أرصدة الدرج الرقمية والنقدية</p>
        </div>
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div className="form-group">
            <label style={{ color: '#374151', fontWeight: '600', marginBottom: '6px', display: 'block' }}>نوع العملية *</label>
            <select 
              className="form-input"
              value={operationType}
              onChange={(e) => handleTypeChange(e.target.value)}
              style={inputStyle}
            >
              <option value="payment">دفع فاتورة / شحن لزبون (خروج رصيد ودخول كاش)</option>
              <option value="recharge">شحن رصيد الماكينة من مندوب (دخول رصيد وخروج كاش)</option>
              <option value="refund">استرداد عملية ملغاة (دخول رصيد وخروج كاش للزبون)</option>
            </select>
          </div>

          <div className="form-group">
            <label style={{ color: '#374151', fontWeight: '600', marginBottom: '6px', display: 'block' }}>وصف العملية</label>
            <input 
              type="text" 
              className="form-input" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثال: فاتورة كهرباء، شحن فودافون"
              style={inputStyle}
            />
          </div>

          {/* 1. Digital Amount */}
          <div className="form-group">
            <label style={{ color: '#374151', fontWeight: '600', marginBottom: '6px', display: 'block' }}>المبلغ المخصوم/المضاف للمكنة (رصيد ديجيتال) *</label>
            <input 
              type="number" 
              step="0.01"
              className="form-input" 
              value={digitalAmount}
              onChange={(e) => handleDigitalChange(e.target.value)}
              required
              placeholder="مثال: 25"
              style={inputStyle}
            />
          </div>

          {/* 2. Cash Amount (Actual Cash Received/Paid) */}
          <div className="form-group">
            <label style={{ color: '#374151', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
              المبلغ الفعلي المتأثر به الدرج كاش (الفلوس الورق) *
            </label>
            <input 
              type="number" 
              step="0.01"
              className="form-input" 
              value={cashAmount}
              onChange={(e) => handleCashChange(e.target.value)}
              required
              placeholder="مثال: 33"
              style={inputStyle}
            />
            <small style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
              {operationType === 'payment' && 'المبلغ الكلي المستلم يدوياً من الزبون ويوضع في الدرج (شامل العمولة)'}
              {operationType === 'recharge' && 'المبلغ المدفوع كاش للمندوب من الدرج'}
              {operationType === 'refund' && 'المبلغ المرتجع كاش للزبون من الدرج'}
            </small>
          </div>

          {/* 3. Commission (Automatically Computed) */}
          {operationType === 'payment' && (
            <div className="form-group">
              <label style={{ color: '#374151', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                عمولة المحل الكاش (تُحسب تلقائياً وتضاف للدرج) *
              </label>
              <input 
                type="number" 
                step="0.01"
                className="form-input" 
                value={commission}
                onChange={(e) => handleCommissionChange(e.target.value)}
                required
                placeholder="0.00"
                style={computedInputStyle}
              />
              <small style={{ color: '#10b981', fontSize: '0.8rem', marginTop: '4px', display: 'block', fontWeight: '600' }}>
                العمولة المحسوبة = الكاش المستلم ({cashAmount || 0}) - رصيد المكنة المخصوم ({digitalAmount || 0}) = {commission} ج.م
              </small>
            </div>
          )}

          <div className="form-group">
            <label style={{ color: '#374151', fontWeight: '600', marginBottom: '6px', display: 'block' }}>ملاحظات إضافية</label>
            <textarea 
              className="form-input" 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي تفاصيل أخرى..."
              rows={2}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '10px' }} onClick={onClose}>
              إلغاء
            </button>
            <button type="submit" className="btn btn-success" style={{ flex: 1, padding: '10px' }}>
              حفظ الحركة
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MomknOperationModal
