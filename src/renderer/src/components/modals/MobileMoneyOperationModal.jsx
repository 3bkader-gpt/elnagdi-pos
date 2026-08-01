import React, { useState, useEffect } from 'react'

const MobileMoneyOperationModal = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [platform, setPlatform] = useState('vodafone_cash') // 'vodafone_cash', 'instapay', 'bank_transfer'
  const [operationType, setOperationType] = useState('withdraw_from_client') // 'withdraw_from_client', 'deposit_to_client'
  const [digitalAmount, setDigitalAmount] = useState('')
  const [commission, setCommission] = useState('0')
  const [cashAmount, setCashAmount] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [phoneOrAccount, setPhoneOrAccount] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (isOpen) {
      setPlatform('vodafone_cash')
      setOperationType('withdraw_from_client')
      setDigitalAmount('')
      setCommission('0')
      setCashAmount('')
      setRecipientName('')
      setPhoneOrAccount('')
      setNotes('')
    }
  }, [isOpen])

  // Automatically calculate cash impact based on inputs
  useEffect(() => {
    const dig = parseFloat(digitalAmount) || 0
    const com = parseFloat(commission) || 0

    if (operationType === 'deposit_to_client') {
      // Deposit: Client gives us cash = transfer amount + commission
      setCashAmount(String(dig + com))
    } else if (operationType === 'withdraw_from_client') {
      // Withdrawal: We give client cash = transfer amount - commission
      setCashAmount(String(Math.max(0, dig - com)))
    }
  }, [digitalAmount, commission, operationType])

  if (!isOpen) return null

  const handleFormSubmit = (e) => {
    e.preventDefault()

    const digVal = parseFloat(digitalAmount) || 0
    const cashVal = parseFloat(cashAmount) || 0
    const comVal = parseFloat(commission) || 0

    if (digVal <= 0) {
      alert('الرجاء إدخال مبلغ صحيح أكبر من الصفر!')
      return
    }

    let digitalImpact = 0
    let cashImpact = 0

    if (operationType === 'deposit_to_client') {
      digitalImpact = -digVal // digital wallet balance decreases
      cashImpact = cashVal    // cash drawer increases (received cash)
    } else if (operationType === 'withdraw_from_client') {
      digitalImpact = digVal  // digital wallet balance increases
      cashImpact = -cashVal   // cash drawer decreases (paid cash)
    }

    onSubmit({
      platform,
      operationType,
      digitalImpact,
      cashImpact,
      commission: comVal,
      recipientName,
      phoneOrAccount,
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
      <div className="modal-content" style={{ maxWidth: '480px', backgroundColor: '#ffffff', color: '#111827', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        <div className="modal-header" style={{ marginBottom: '16px' }}>
          <h2 style={{ color: '#111827', margin: 0, fontSize: '1.4rem' }}>تسجيل حركة محفظة / تحويل</h2>
          <p style={{ color: '#6b7280', fontSize: '0.88rem', marginTop: '4px' }}>سجل حركة سحب أو إيداع لربط الكاش والأرصدة الرقمية</p>
        </div>
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div className="form-group">
            <label style={{ color: '#374151', fontWeight: '600', marginBottom: '6px', display: 'block' }}>المنصة / الوسيلة *</label>
            <select 
              className="form-input"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              style={inputStyle}
            >
              <option value="vodafone_cash">فودافون كاش (Vodafone Cash)</option>
              <option value="instapay">انستا باي (Instapay)</option>
              <option value="bank_transfer">تحويل بنكي مباشر (Bank Transfer)</option>
            </select>
          </div>

          <div className="form-group">
            <label style={{ color: '#374151', fontWeight: '600', marginBottom: '6px', display: 'block' }}>نوع العملية *</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <label style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', backgroundColor: operationType === 'withdraw_from_client' ? '#ecfdf5' : '#ffffff', color: '#111827' }}>
                <input 
                  type="radio" 
                  name="opType" 
                  value="withdraw_from_client" 
                  checked={operationType === 'withdraw_from_client'}
                  onChange={() => setOperationType('withdraw_from_client')}
                />
                سحب من الزبون (المحل بيستلم رصيد وبيطلع كاش)
              </label>
              <label style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', backgroundColor: operationType === 'deposit_to_client' ? '#ecfdf5' : '#ffffff', color: '#111827' }}>
                <input 
                  type="radio" 
                  name="opType" 
                  value="deposit_to_client"
                  checked={operationType === 'deposit_to_client'}
                  onChange={() => setOperationType('deposit_to_client')}
                />
                إيداع للزبون (المحل بيطلع رصيد وبيستلم كاش)
              </label>
            </div>
          </div>

          <div className="form-group">
            <label style={{ color: '#374151', fontWeight: '600', marginBottom: '6px', display: 'block' }}>مبلغ العملية الأساسي (الرصيد الرقمي) *</label>
            <input 
              type="number" 
              step="0.01"
              className="form-input" 
              value={digitalAmount}
              onChange={(e) => setDigitalAmount(e.target.value)}
              required
              placeholder="0.00"
              style={inputStyle}
            />
          </div>

          <div className="form-group">
            <label style={{ color: '#374151', fontWeight: '600', marginBottom: '6px', display: 'block' }}>عمولة المعاملة *</label>
            <input 
              type="number" 
              step="0.01"
              className="form-input" 
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              required
              placeholder="0.00"
              style={inputStyle}
            />
          </div>

          <div className="form-group">
            <label style={{ color: '#374151', fontWeight: '600', marginBottom: '6px', display: 'block' }}>المبلغ المتأثر به الدرج كاش (الفلوس الورق) *</label>
            <input 
              type="number" 
              className="form-input" 
              value={cashAmount}
              readOnly
              style={computedInputStyle}
              placeholder="0.00"
            />
            <small style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
              {operationType === 'deposit_to_client' && 'المستلم كاش من الزبون = رصيد التحويل + العمولة'}
              {operationType === 'withdraw_from_client' && 'المسحوب كاش للزبون من الدرج = رصيد التحويل - العمولة'}
            </small>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ color: '#374151', fontWeight: '600', marginBottom: '6px', display: 'block' }}>رقم الهاتف / الحساب</label>
              <input 
                type="text" 
                className="form-input" 
                value={phoneOrAccount}
                onChange={(e) => setPhoneOrAccount(e.target.value)}
                placeholder="مثال: 01012345678"
                style={inputStyle}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ color: '#374151', fontWeight: '600', marginBottom: '6px', display: 'block' }}>اسم الزبون / المستلم</label>
              <input 
                type="text" 
                className="form-input" 
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="اسم العميل"
                style={inputStyle}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ color: '#374151', fontWeight: '600', marginBottom: '6px', display: 'block' }}>ملاحظات إضافية</label>
            <textarea 
              className="form-input" 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: اسم المحول منه، تفاصيل التحويل..."
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

export default MobileMoneyOperationModal
