import React, { useState, useEffect } from 'react'
import { LogOut, Calculator, Package, Smartphone, Wallet } from 'lucide-react'
import { executeQuery } from '../../lib/db'

const FLOAT_AMOUNT = 200 // عهدة الفكة الثابتة

// Simple Close Shift Modal for Cashiers
const SimpleCloseShiftModal = ({
  closeShiftModal,
  currentShift,
  actualEndCash,
  setActualEndCash,
  setCloseShiftModal,
  handleConfirmCloseShift
}) => {
  const [expected, setExpected] = useState(null)
  const [withFloat, setWithFloat] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!closeShiftModal || !currentShift) {
      setExpected(null)
      return
    }
    const fetchSimple = () => {
      executeQuery(`
        SELECT
          ${currentShift.initial_cash || 0} as initial_cash,
          COALESCE((SELECT SUM(total_amount) FROM sales WHERE shift_id=${currentShift.id} AND payment_type='نقدي'),0) as cash_sales,
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
    }

    fetchSimple()
    const interval = setInterval(fetchSimple, 1000)
    return () => clearInterval(interval)
  }, [closeShiftModal, currentShift])

  if (!closeShiftModal) return null

  const handover = expected !== null ? Math.max(0, withFloat ? expected - FLOAT_AMOUNT : expected) : null

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 99999 }}>
      <div className="modal-content" style={{ maxWidth: 460, width: '90%', background: '#ffffff', color: '#111827', padding: '24px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        <div className="modal-header" style={{ textAlign: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', marginBottom: '16px' }}>
          <LogOut size={38} style={{ color: '#ef4444', margin: '0 auto 12px auto', display: 'block' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>تسوية وإنهاء الوردية الحالية</h2>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '0.88rem' }}>
            الوردية #{currentShift?.id}
          </p>
        </div>

        {/* Expected breakdown */}
        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#10b981', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calculator size={14} /> حساب الدرج التلقائي
          </div>
          {loading && expected === null ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '8px 0', fontSize: '0.85rem' }}>جاري الحساب...</div>
          ) : expected !== null ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: '0.85rem' }}>
                <span style={{ color: '#4b5563' }}>المتوقع في الدرج:</span>
                <span style={{ fontWeight: 700, color: '#111827', textAlign: 'left' }}>{expected.toFixed(2)} ج.م</span>

                <span style={{ color: '#4b5563', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={withFloat}
                    onChange={e => setWithFloat(e.target.checked)}
                    style={{ accentColor: '#f59e0b', cursor: 'pointer', width: 14, height: 14 }}
                  />
                  عهدة الفكة (200 تبقى):
                </span>
                <span style={{ fontWeight: 700, color: withFloat ? '#f59e0b' : '#9ca3af', textAlign: 'left', textDecoration: withFloat ? 'none' : 'line-through' }}>- {FLOAT_AMOUNT.toFixed(2)} ج.م</span>

                <span style={{ color: '#4b5563', borderTop: '1px solid #e5e7eb', paddingTop: 6 }}>مبلغ التوريد للمالك:</span>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#10b981', textAlign: 'left', borderTop: '1px solid #e5e7eb', paddingTop: 6 }}>
                  {handover !== null ? handover.toFixed(2) : '—'} ج.م
                </span>
              </div>
              <button
                onClick={() => setActualEndCash(expected.toFixed(2))}
                style={{ marginTop: 10, width: '100%', padding: '7px', borderRadius: 7, border: '1.5px solid #10b981', background: 'transparent', color: '#10b981', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                ← احسب تلقائياً ({expected.toFixed(2)} ج.م)
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.85rem' }}>تعذّر حساب المتوقع</div>
          )}
        </div>

        {/* Note */}
        <div style={{ background: '#f3f4f6', padding: '10px 14px', borderRadius: 8, fontSize: '0.82rem', color: '#374151', marginBottom: 14 }}>
          <Package size={13} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
          <b>نظام التوريد:</b> ضع مبلغ التوريد في ظرف وسلّمه للمالك. تبقى <b>200 ج.م</b> فكة في الدرج للشيفت التالي.
        </div>

        {/* Actual input */}
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 'bold', marginBottom: 6, color: '#374151' }}>
            المبلغ الفعلي الموجود بالدرج حالياً (ج.م)
          </label>
          <input
            type="number"
            className="form-input"
            style={{ fontSize: '1.5rem', fontWeight: '700', textAlign: 'center', width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db', color: '#111827' }}
            value={actualEndCash}
            placeholder="0.00"
            onChange={(e) => setActualEndCash(e.target.value)}
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" style={{ flex: 1, padding: 10 }} onClick={() => setCloseShiftModal(false)}>
            إلغاء
          </button>
          <button className="btn btn-danger" style={{ flex: 1, padding: 10, backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }} onClick={() => handleConfirmCloseShift(null)}>
            تأكيد وإنهاء الوردية
          </button>
        </div>
      </div>
    </div>
  )
}

// Advanced Multi-Till Close Shift Modal for Admins Matched 100% to Reports & Tills Management
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
    allSales: 0,
    debtSales: 0,
    digitalSales: 0,
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

  const [withFloat, setWithFloat] = useState(false)
  const [floatAmount, setFloatAmount] = useState('200')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!closeShiftModal || !currentShift) {
      return
    }

    const fetchLiveDetails = () => {
      executeQuery(`
        SELECT
          ${currentShift.initial_cash || 0} as initial_cash,
          COALESCE((SELECT SUM(total_amount) FROM sales WHERE shift_id=${currentShift.id}),0) as all_sales,
          COALESCE((SELECT SUM(total_amount) FROM sales WHERE shift_id=${currentShift.id} AND payment_type='آجل'),0) as debt_sales,
          COALESCE((SELECT SUM(total_amount) FROM sales WHERE shift_id=${currentShift.id} AND payment_type NOT IN ('نقدي','آجل')),0) as digital_sales,
          COALESCE((SELECT SUM(total_amount) FROM sales WHERE shift_id=${currentShift.id} AND payment_type='نقدي'),0) as cash_sales,
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
            allSales: Number(r.all_sales) || 0,
            debtSales: Number(r.debt_sales) || 0,
            digitalSales: Number(r.digital_sales) || 0,
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
    }

    fetchLiveDetails()
    const interval = setInterval(fetchLiveDetails, 1000)
    return () => clearInterval(interval)
  }, [closeShiftModal, currentShift])

  if (!closeShiftModal) return null

  const momknStartBalance = Number(currentShift?.momkn_start_balance) || 0
  const momknStartCash = Number(currentShift?.momkn_start_cash) || 0
  const vfcashStartBalance = Number(currentShift?.vfcash_start_balance) || 0
  const vfcashStartCash = Number(currentShift?.vfcash_start_cash) || 0

  const netOperationsCashImpact = data.cashSales + data.inflow - (data.supplierOutflow + data.generalOutflow)
  const supermarketExpectedDrawer = data.initialCash + netOperationsCashImpact
  
  const momknExpectedDigital = momknStartBalance + data.momknDigitalImpact
  const momknExpectedDrawer = momknStartCash + data.momknCashImpact

  const vfcashExpectedDigital = vfcashStartBalance + data.vfcashDigitalImpact
  const vfcashExpectedDrawer = vfcashStartCash + data.mmCashImpact

  const grandTotalCash = supermarketExpectedDrawer + momknExpectedDrawer + vfcashExpectedDrawer

  const parsedFloat = withFloat ? (parseFloat(floatAmount) || 0) : 0
  const handoverAmount = Math.max(0, supermarketExpectedDrawer - parsedFloat)

  const handleConfirm = () => {
    handleConfirmCloseShift({
      supermarketExpected: supermarketExpectedDrawer,
      momknExpected: momknExpectedDrawer,
      vfcashExpected: vfcashExpectedDrawer,
      grandTotalExpected: grandTotalCash,
      handoverAmount: handoverAmount,
      withFloat: withFloat,
      floatAmount: parsedFloat
    })
  }

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 99999 }}>
      <div className="modal-content" style={{ maxWidth: 640, width: '92%', maxHeight: '90vh', overflowY: 'auto', background: '#ffffff', color: '#111827', padding: '20px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        
        <div style={{ textAlign: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', marginBottom: '12px' }}>
          <LogOut size={32} style={{ color: '#ef4444', margin: '0 auto 6px auto', display: 'block' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0, color: '#111827' }}>تسوية وتقفيل الشفت الشامل (إدارة الخزائن الثلاث)</h2>
          <p style={{ margin: '2px 0 0 0', color: '#6b7280', fontSize: '0.82rem' }}>
            الوردية رقم <strong>#{currentShift?.id}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
          
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Calculator size={16} /> 1. تفاصيل درج السوبر ماركت الرئيسي (النقدي)
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: '0.82rem', marginBottom: 8 }}>
              <span style={{ color: '#4b5563' }}>كاش الفكة الافتتاحي بالدرج:</span>
              <span style={{ fontWeight: 700, textAlign: 'left', color: '#1e40af' }}>{data.initialCash.toFixed(2)} ج.م</span>

              <span style={{ color: '#4b5563' }}>إجمالي مبيعات الفواتير بالكامل:</span>
              <span style={{ fontWeight: 700, textAlign: 'left', color: '#16a34a' }}>+ {(data.allSales).toFixed(2)} ج.م</span>

              {(data.debtSales > 0 || data.digitalSales > 0) && (
                <>
                  <span style={{ color: '#4b5563' }}>آجل وتحويلات (لم تدخل الدرج):</span>
                  <span style={{ fontWeight: 700, textAlign: 'left', color: '#d97706' }}>- {(data.debtSales + data.digitalSales).toFixed(2)} ج.م</span>
                </>
              )}

              <span style={{ color: '#4b5563' }}>مقبوضات تحصيل ديون عملاء (دخل الخزنة):</span>
              <span style={{ fontWeight: 700, textAlign: 'left', color: '#16a34a' }}>+ {data.inflow.toFixed(2)} ج.م</span>

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
                خصم عهدة فكة للمالك:
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
              <div>📱 رصيد ديجيتال المتوقع: <strong>{momknExpectedDigital.toFixed(2)} ج.م</strong></div>
              <div>💵 كاش بالدرج لممكن: <strong>+{data.momknCashImpact.toFixed(2)} ج.م</strong> (إجمالي: {momknExpectedDrawer.toFixed(2)})</div>
              <div>⭐️ عمولات: <strong>{data.momknCommission.toFixed(2)} ج.م</strong></div>
            </div>
          </div>

          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#065f46', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Wallet size={16} /> 3. ملخص المحافظ والتحويلات (فودافون كاش / انستا باي / البنك)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', fontSize: '0.78rem', color: '#064e3b', marginBottom: 6 }}>
              <div>📱 محفظة فودافون المتوقعة: <strong>{vfcashExpectedDigital.toFixed(2)} ج.م</strong></div>
              <div>⚡️ انستا باي: <strong>{data.instapayDigitalImpact.toFixed(2)} ج.م</strong></div>
              <div>🏦 تحويل بنكي: <strong>{data.bankDigitalImpact.toFixed(2)} ج.م</strong></div>
            </div>
            <div style={{ borderTop: '1px dashed #6ee7b7', paddingTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#047857' }}>
              <span>إجمالي كاش المحافظ بالدرج: <strong>+{data.mmCashImpact.toFixed(2)} ج.م</strong> (إجمالي: {vfcashExpectedDrawer.toFixed(2)} ج.م)</span>
              <span>عمولات: <strong>{data.mmCommission.toFixed(2)} ج.م</strong></span>
            </div>
          </div>

          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: 12, color: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>إجمالي الكاش الورق الفعلي المتوقع بالدرج (شامل المكن والخدمات):</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>{grandTotalCash.toFixed(2)} ج.م</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                type="button" 
                onClick={() => setActualEndCash(supermarketExpectedDrawer.toFixed(2))} 
                style={{ flex: 1, padding: '6px', fontSize: '0.78rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' }}
              >
                تطبيق السوبر ماركت فقط ({supermarketExpectedDrawer.toFixed(2)})
              </button>
              <button 
                type="button" 
                onClick={() => setActualEndCash(grandTotalCash.toFixed(2))} 
                style={{ flex: 1, padding: '6px', fontSize: '0.78rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' }}
              >
                تطبيق الكاش الإجمالي ({grandTotalCash.toFixed(2)})
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
              المبلغ الفعلي المسلم من الكاشير بالدرج حالياً (ج.م) *
            </label>
            <input 
              type="number" 
              style={{ width: '100%', padding: '10px', fontSize: '1.4rem', fontWeight: 800, textAlign: 'center', borderRadius: 6, border: '1.5px solid #cbd5e1' }}
              value={actualEndCash}
              onChange={(e) => setActualEndCash(e.target.value)}
              placeholder="0.00"
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
