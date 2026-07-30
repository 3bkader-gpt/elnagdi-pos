import React, { useState, useEffect } from 'react'
import { LogOut, Calculator, Package } from 'lucide-react'
import { executeQuery } from '../../lib/db'

const FLOAT_AMOUNT = 200 // عهدة الفكة الثابتة

const CloseShiftModal = ({
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
    setLoading(true)
    executeQuery(`
      SELECT
        ${currentShift.initial_cash} as initial_cash,
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
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <LogOut size={38} style={{ color: 'var(--accent-rose)', margin: '0 auto 12px auto', display: 'block' }} />
          <h2>تسوية وإنهاء الوردية الحالية</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            الوردية #{currentShift?.id}
          </p>
        </div>

        {/* Expected breakdown */}
        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--accent-emerald)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calculator size={14} /> حساب الدرج التلقائي
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '8px 0', fontSize: '0.85rem' }}>جاري الحساب...</div>
          ) : expected !== null ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>المتوقع في الدرج:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>{expected.toFixed(2)} ج.م</span>

                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={withFloat}
                    onChange={e => setWithFloat(e.target.checked)}
                    style={{ accentColor: '#f59e0b', cursor: 'pointer', width: 14, height: 14 }}
                  />
                  عهدة الفكة (200 تبقى):
                </span>
                <span style={{ fontWeight: 700, color: withFloat ? '#f59e0b' : 'var(--text-muted)', textAlign: 'left', textDecoration: withFloat ? 'none' : 'line-through' }}>- {FLOAT_AMOUNT.toFixed(2)} ج.م</span>

                <span style={{ color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 6 }}>مبلغ التوريد للمالك:</span>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--accent-emerald)', textAlign: 'left', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 6 }}>
                  {handover !== null ? handover.toFixed(2) : '—'} ج.م
                </span>
              </div>
              <button
                onClick={() => setActualEndCash(expected.toFixed(2))}
                style={{ marginTop: 10, width: '100%', padding: '7px', borderRadius: 7, border: '1.5px solid var(--accent-emerald)', background: 'transparent', color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                ← احسب تلقائياً ({expected.toFixed(2)} ج.م)
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>تعذّر حساب المتوقع</div>
          )}
        </div>

        {/* Note */}
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: 8, fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
          <Package size={13} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
          <b>نظام التوريد:</b> ضع مبلغ التوريد في ظرف وسلّمه للمالك. تبقى <b>200 ج.م</b> فكة في الدرج للشيفت التالي.
        </div>

        {/* Actual input */}
        <div className="form-group">
          <label>المبلغ الفعلي الموجود بالدرج حالياً (ج.م)</label>
          <input
            type="number"
            className="form-input"
            style={{ fontSize: '1.5rem', fontWeight: '700', textAlign: 'center' }}
            value={actualEndCash}
            placeholder="0.00"
            onChange={(e) => setActualEndCash(e.target.value)}
            autoFocus
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
