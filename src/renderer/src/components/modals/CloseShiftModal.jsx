import React, { useState, useEffect } from 'react'
import { LogOut, Calculator, Package, Smartphone, DollarSign } from 'lucide-react'
import { executeQuery } from '../../lib/db'

// Original Stable Close Shift Modal for Cashiers
const SimpleCloseShiftModal = ({
  closeShiftModal,
  currentShift,
  actualEndCash,
  setActualEndCash,
  setCloseShiftModal,
  handleConfirmCloseShift
}) => {
  const FLOAT_AMOUNT = 200
  const [expected, setExpected] = useState(null)
  const [withFloat, setWithFloat] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!closeShiftModal || !currentShift) {
      setExpected(null)
      return
    }
    setLoading(true)
    executeQuery(`
      SELECT
        ${currentShift.initial_cash || 0} as initial_cash,
        COALESCE((SELECT SUM(COALESCE(NULLIF(original_amount,0),total_amount)) FROM sales WHERE shift_id=${currentShift.id} AND payment_type='نقدي'),0) as cash_sales,
        COALESCE((SELECT SUM(amount) FROM safe_ledger WHERE shift_id=${currentShift.id} AND type='inflow'),0) as inflow,
        COALESCE((SELECT SUM(amount) FROM safe_ledger WHERE shift_id=${currentShift.id} AND type='outflow'),0) as outflow
    `).then(rows => {
      if (rows && rows[0]) {
        const r = rows[0]
        const exp = Number(r.initial_cash) + Number(r.cash_sales) + Number(r.inflow) - Number(r.outflow)
        setExpected(exp)
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [closeShiftModal, currentShift])

  if (!closeShiftModal) return null

  const handover = expected !== null ? Math.max(0, withFloat ? expected - FLOAT_AMOUNT : expected) : null

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
      <div className="modal-content" style={{ maxWidth: 460, width: '90%', background: '#ffffff', color: '#111827', padding: '24px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        <div className="modal-header" style={{ textAlign: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', marginBottom: '16px' }}>
          <LogOut size={38} style={{ color: '#ef4444', margin: '0 auto 12px auto', display: 'block' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>تسوية وإنهاء الوردية الحالية</h2>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '0.88rem' }}>
            الوردية #{currentShift?.id}
          </p>
        </div>

        {/* Blind Closing Guidance for Cashier */}
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e40af', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Package size={18} style={{ color: '#2563eb' }} /> الجرد الأعمى وتسليم الوردية
          </div>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#1e3a8a', lineHeight: 1.5 }}>
            يرجى عد جميع المبالغ النقدية الكاش الموجودة بالدرج بدقة وتسجيلها أدناه قبل تقفيل الوردية. <b>ملاحظة:</b> تبقى <b>200 ج.م</b> فكة بالدرج للوردية التالية.
          </p>
        </div>

        {/* Actual input */}
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: 6, color: '#374151', textAlign: 'center' }}>
            المبلغ الفعلي الموجود بالدرج حالياً (ج.م)
          </label>
          <input
            type="number"
            className="form-input"
            style={{ fontSize: '1.5rem', fontWeight: '700', textAlign: 'center', width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', color: '#111827' }}
            value={actualEndCash}
            placeholder="0.00"
            onChange={(e) => setActualEndCash(e.target.value)}
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" style={{ flex: 1, padding: '10px' }} onClick={() => setCloseShiftModal(false)}>
            إلغاء
          </button>
          <button className="btn btn-danger" style={{ flex: 1, padding: '10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => handleConfirmCloseShift(null)}>
            تأكيد وإنهاء الوردية
          </button>
        </div>
      </div>
    </div>
  )
}

// Advanced Multi-Till Close Shift Modal for Admins
const AdvancedCloseShiftModal = ({
  closeShiftModal,
  currentShift,
  actualEndCash,
  setActualEndCash,
  setCloseShiftModal,
  handleConfirmCloseShift
}) => {
  const [data, setData] = useState({
    initialCash: 0,
    cashSales: 0,
    inflow: 0,
    returnsOutflow: 0,
    supplierOutflow: 0,
    generalOutflow: 0,
    momknDigitalImpact: 0,
    momknCashImpact: 0,
    momknCommission: 0,
    mmDigitalImpact: 0,
    mmCashImpact: 0,
    mmCommission: 0,
    vfcashDigitalImpact: 0,
    instapayDigitalImpact: 0,
    bankDigitalImpact: 0
  })
  const [floatAmount, setFloatAmount] = useState('200')
  const [withFloat, setWithFloat] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!closeShiftModal || !currentShift) {
      return
    }
    setLoading(true)
    executeQuery(`
      SELECT
        ${currentShift.initial_cash || 0} as initial_cash,
        COALESCE((SELECT SUM(COALESCE(NULLIF(original_amount,0),total_amount)) FROM sales WHERE shift_id=${currentShift.id} AND payment_type='نقدي'),0) as cash_sales,
        COALESCE((SELECT SUM(amount) FROM safe_ledger WHERE shift_id=${currentShift.id} AND type='inflow'),0) as inflow,
        COALESCE((SELECT SUM(amount) FROM safe_ledger WHERE shift_id=${currentShift.id} AND type='outflow' AND (description LIKE 'مرتجع%')),0) as returns_outflow,
        COALESCE((SELECT SUM(amount) FROM safe_ledger WHERE shift_id=${currentShift.id} AND type='outflow' AND (description LIKE 'دفعة لمورد%' OR description LIKE 'سداد دين مورد%')),0) as supplier_outflow,
        COALESCE((SELECT SUM(amount) FROM safe_ledger WHERE shift_id=${currentShift.id} AND type='outflow' AND (description NOT LIKE 'مرتجع%' AND description NOT LIKE 'دفعة لمورد%' AND description NOT LIKE 'سداد دين مورد%')),0) as general_outflow,
        
        COALESCE((SELECT SUM(digital_impact) FROM momkn_transactions WHERE shift_id=${currentShift.id}), 0) as momkn_digital_impact,
        COALESCE((SELECT SUM(cash_impact) FROM momkn_transactions WHERE shift_id=${currentShift.id}), 0) as momkn_cash_impact,
        COALESCE((SELECT SUM(commission) FROM momkn_transactions WHERE shift_id=${currentShift.id}), 0) as momkn_commission,
        
        COALESCE((SELECT SUM(digital_impact) FROM mobile_money_transactions WHERE shift_id=${currentShift.id}), 0) as mm_digital_impact,
        COALESCE((SELECT SUM(cash_impact) FROM mobile_money_transactions WHERE shift_id=${currentShift.id}), 0) as mm_cash_impact,
        COALESCE((SELECT SUM(commission) FROM mobile_money_transactions WHERE shift_id=${currentShift.id}), 0) as mm_commission,
        
        COALESCE((SELECT SUM(digital_impact) FROM mobile_money_transactions WHERE shift_id=${currentShift.id} AND platform='vodafone_cash'), 0) as vfcash_digital_impact,
        COALESCE((SELECT SUM(digital_impact) FROM mobile_money_transactions WHERE shift_id=${currentShift.id} AND platform='instapay'), 0) as instapay_digital_impact,
        COALESCE((SELECT SUM(digital_impact) FROM mobile_money_transactions WHERE shift_id=${currentShift.id} AND platform='bank_transfer'), 0) as bank_digital_impact
    `).then(rows => {
      if (rows && rows[0]) {
        const r = rows[0]
        setData({
          initialCash: Number(r.initial_cash) || 0,
          cashSales: Number(r.cash_sales) || 0,
          inflow: Number(r.inflow) || 0,
          returnsOutflow: Number(r.returns_outflow) || 0,
          supplierOutflow: Number(r.supplier_outflow) || 0,
          generalOutflow: Number(r.general_outflow) || 0,
          momknDigitalImpact: Number(r.momkn_digital_impact) || 0,
          momknCashImpact: Number(r.momkn_cash_impact) || 0,
          momknCommission: Number(r.momkn_commission) || 0,
          mmDigitalImpact: Number(r.mm_digital_impact) || 0,
          mmCashImpact: Number(r.mm_cash_impact) || 0,
          mmCommission: Number(r.mm_commission) || 0,
          vfcashDigitalImpact: Number(r.vfcash_digital_impact) || 0,
          instapayDigitalImpact: Number(r.instapay_digital_impact) || 0,
          bankDigitalImpact: Number(r.bank_digital_impact) || 0
        })
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [closeShiftModal, currentShift])

  if (!closeShiftModal) return null

  const momknStartCash = Number(currentShift?.momkn_start_cash) || 0
  const vfcashStartCash = Number(currentShift?.vfcash_start_cash) || 0

  const netOperationsCashImpact = data.cashSales + data.inflow - (data.returnsOutflow + data.supplierOutflow + data.generalOutflow)
  const supermarketExpectedDrawer = data.initialCash + netOperationsCashImpact
  const momknExpectedDrawer = momknStartCash + data.momknCashImpact
  const vfcashExpectedDrawer = vfcashStartCash + data.mmCashImpact

  const grandTotalDrawerCash = supermarketExpectedDrawer + momknExpectedDrawer + vfcashExpectedDrawer

  const parsedFloat = parseFloat(floatAmount) || 0
  const handoverAmount = Math.max(0, withFloat ? supermarketExpectedDrawer - parsedFloat : supermarketExpectedDrawer)

  const handleApplySupermarketCalc = () => {
    setActualEndCash(supermarketExpectedDrawer.toFixed(2))
  }

  const handleApplyGrandCalc = () => {
    setActualEndCash(grandTotalDrawerCash.toFixed(2))
  }

  const handleConfirm = () => {
    handleConfirmCloseShift({
      ...data,
      supermarketExpectedDrawer,
      momknExpectedDrawer,
      vfcashExpectedDrawer,
      grandTotalDrawerCash,
      handoverAmount,
      floatAmount: parsedFloat
    })
  }

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: 620, 
          width: '95%', 
          maxHeight: '92vh', 
          display: 'flex', 
          flexDirection: 'column', 
          backgroundColor: '#ffffff', 
          color: '#111827',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
        }}
      >
        <div className="modal-header" style={{ paddingBottom: 10, borderBottom: '1px solid #e5e7eb', marginBottom: 12, flexShrink: 0 }}>
          <LogOut size={34} style={{ color: '#dc2626', margin: '0 auto 6px auto', display: 'block' }} />
          <h2 style={{ fontSize: '1.25rem', margin: 0, color: '#111827', textAlign: 'center' }}>تسوية وتقفيل الشفت الشامل (إدارة الخزائن الثلاث)</h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem', textAlign: 'center' }}>الوردية رقم <strong>#{currentShift?.id}</strong></p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Calculator size={16} /> 1. تفاصيل درج السوبر ماركت الرئيسي (النقدي)
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: '0.82rem', marginBottom: 8 }}>
              <span style={{ color: '#4b5563' }}>كاش الفكة الافتتاحي بالدرج:</span>
              <span style={{ fontWeight: 700, textAlign: 'left', color: '#1e40af' }}>{data.initialCash.toFixed(2)} ج.م</span>

              <span style={{ color: '#4b5563' }}>إجمالي مبيعات الكاش النقدية:</span>
              <span style={{ fontWeight: 700, textAlign: 'left', color: '#16a34a' }}>+ {data.cashSales.toFixed(2)} ج.م</span>

              <span style={{ color: '#4b5563' }}>مقبوضات توريد خزينة / سداد مديونيات:</span>
              <span style={{ fontWeight: 700, textAlign: 'left', color: '#16a34a' }}>+ {data.inflow.toFixed(2)} ج.م</span>

              <span style={{ color: '#4b5563' }}>مصروفات مرتجعات مبيعات:</span>
              <span style={{ fontWeight: 700, textAlign: 'left', color: '#dc2626' }}>- {data.returnsOutflow.toFixed(2)} ج.م</span>

              <span style={{ color: '#4b5563' }}>مدفوعات فواتير وصرف لموردين:</span>
              <span style={{ fontWeight: 700, textAlign: 'left', color: '#dc2626' }}>- {data.supplierOutflow.toFixed(2)} ج.م</span>

              <span style={{ color: '#4b5563' }}>مصاريف ونثريات وإيجار:</span>
              <span style={{ fontWeight: 700, textAlign: 'left', color: '#dc2626' }}>- {data.generalOutflow.toFixed(2)} ج.م</span>
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: 8, borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e40af' }}>صافي الكاش الورق المتوقع بالدرج:</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1d4ed8' }}>{supermarketExpectedDrawer.toFixed(2)} ج.م</span>
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              📦 حاسبة التوريد وترك الفكة للشيفت القادم:
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: '0.8rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <input type="checkbox" checked={withFloat} onChange={(e) => setWithFloat(e.target.checked)} />
                خصم عهدة فكة للماتك:
              </label>
              <input 
                type="number" 
                style={{ width: 80, padding: '2px 6px', fontSize: '0.8rem', borderRadius: 4, border: '1px solid #cbd5e1' }} 
                value={floatAmount} 
                onChange={(e) => setFloatAmount(e.target.value)} 
                disabled={!withFloat}
              />
              <span>ج.م</span>
              <div style={{ marginRight: 'auto', fontWeight: 800, color: '#15803d' }}>
                صافي التوريد للمالك: {handoverAmount.toFixed(2)} ج.م
              </div>
            </div>
          </div>

          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e40af', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Smartphone size={16} /> 2. ملخص ماكينة ممكن
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', fontSize: '0.78rem', color: '#1e3a8a' }}>
              <div>📱 رصيد ديجيتال: <strong>{data.momknDigitalImpact > 0 ? `+${data.momknDigitalImpact.toFixed(2)}` : data.momknDigitalImpact.toFixed(2)}</strong></div>
              <div>💵 كاش بالدرج: <strong>{data.momknCashImpact > 0 ? `+${data.momknCashImpact.toFixed(2)}` : data.momknCashImpact.toFixed(2)}</strong></div>
              <div>⭐️ عمولات: <strong>{data.momknCommission.toFixed(2)}</strong></div>
            </div>
          </div>

          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#047857', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Smartphone size={16} /> 3. ملخص المحافظ والتحويلات (فودافون كاش / انستا باي / البنك)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', fontSize: '0.78rem', color: '#065f46' }}>
              <div>📱 محفظة فودافون: <strong>{data.vfcashDigitalImpact.toFixed(2)}</strong></div>
              <div>⚡️ انستا باي: <strong>{data.instapayDigitalImpact.toFixed(2)}</strong></div>
              <div>🏦 تحويل بنكي: <strong>{data.bankDigitalImpact.toFixed(2)}</strong></div>
              <div style={{ gridColumn: 'span 3', borderTop: '1px dashed #a7f3d0', paddingTop: 4, marginTop: 4 }}>
                💵 إجمالي كاش المحافظ بالدرج: <strong>{data.mmCashImpact > 0 ? `+${data.mmCashImpact.toFixed(2)}` : data.mmCashImpact.toFixed(2)} ج.م</strong> | عمولات: <strong>{data.mmCommission.toFixed(2)} ج.م</strong>
              </div>
            </div>
          </div>

          <div style={{ background: '#0f172a', color: '#ffffff', padding: 12, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>إجمالي الكاش الورق الفعلي المتوقع بالدرج (شامل المكن والخدمات):</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>{grandTotalDrawerCash.toFixed(2)} ج.م</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button 
                type="button"
                className="btn" 
                style={{ padding: '6px 10px', fontSize: '0.75rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                onClick={handleApplySupermarketCalc}
              >
                تطبيق السوبر ماركت فقط ({supermarketExpectedDrawer.toFixed(2)})
              </button>
              <button 
                type="button"
                className="btn" 
                style={{ padding: '6px 10px', fontSize: '0.75rem', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                onClick={handleApplyGrandCalc}
              >
                تطبيق الكاش الإجمالي ({grandTotalDrawerCash.toFixed(2)})
              </button>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 'bold', marginBottom: 4, color: '#111827' }}>
              المبلغ الفعلي المسلم من الكاشير بالدرج حالياً (ج.م) *
            </label>
            <input
              type="number"
              className="form-input"
              style={{ fontSize: '1.4rem', fontWeight: '700', textAlign: 'center', width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}
              value={actualEndCash}
              placeholder="0.00"
              onChange={(e) => setActualEndCash(e.target.value)}
              autoFocus
            />
          </div>

        </div>

        <div style={{ display: 'flex', gap: '10px', paddingTop: '10px', borderTop: '1px solid #e5e7eb', marginTop: '10px', flexShrink: 0 }}>
          <button className="btn btn-secondary" style={{ flex: 1, padding: 10 }} onClick={() => setCloseShiftModal(false)}>
            إلغاء
          </button>
          <button className="btn btn-danger" style={{ flex: 1, padding: 10, backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }} onClick={handleConfirm}>
            تأكيد وتقفيل الوردية
          </button>
        </div>

      </div>
    </div>
  )
}

export default function CloseShiftModal(props) {
  const { currentUser } = props
  if (currentUser?.role === 'admin') {
    return <AdvancedCloseShiftModal {...props} />
  }
  return <SimpleCloseShiftModal {...props} />
}
