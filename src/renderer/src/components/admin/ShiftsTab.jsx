// ─────────────────────────────────────────────────────────────
// Admin Tab: Shifts History — Advanced with Shift Detail Drawer
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react'
import { X, ChevronDown, DollarSign, AlertTriangle, CheckCircle, Clock, User, Calculator, Smartphone, Wallet } from 'lucide-react'
import { executeQuery } from '../../lib/db'

const PAGE_SIZE = 25

const fmt = (v) => (Number(v) || 0).toFixed(2)
const fmtDiff = (v) => {
  const n = Number(v) || 0
  if (n > 0) return { text: `+${n.toFixed(2)} ج.م`, color: '#16a34a' }
  if (n < 0) return { text: `${n.toFixed(2)} ج.م`, color: '#dc2626' }
  return { text: `0.00 ج.م`, color: '#6b7280' }
}

// ─── Shift Detail Panel ────────────────────────────────────────
function ShiftDetailPanel({ shift, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!shift) return
    setLoading(true)
    executeQuery(`
      SELECT
        ${shift.initial_cash || 0} AS initial_cash,
        COALESCE((SELECT SUM(total_amount) FROM sales WHERE shift_id=${shift.id}),0) AS all_sales,
        COALESCE((SELECT SUM(total_amount) FROM sales WHERE shift_id=${shift.id} AND payment_type='نقدي'),0) AS cash_sales,
        COALESCE((SELECT SUM(total_amount) FROM sales WHERE shift_id=${shift.id} AND payment_type='آجل'),0) AS debt_sales,
        COALESCE((SELECT SUM(total_amount) FROM sales WHERE shift_id=${shift.id} AND payment_type NOT IN ('نقدي','آجل')),0) AS digital_sales,
        COALESCE((SELECT COUNT(*) FROM sales WHERE shift_id=${shift.id}),0) AS sale_count,
        COALESCE((SELECT SUM(discount) FROM sales WHERE shift_id=${shift.id}),0) AS total_discounts,
        COALESCE((SELECT SUM(amount) FROM safe_ledger WHERE shift_id=${shift.id} AND type='inflow'),0) AS inflow,
        COALESCE((SELECT SUM(amount) FROM safe_ledger WHERE shift_id=${shift.id} AND type='outflow' AND description LIKE 'مرتجع%'),0) AS returns_out,
        COALESCE((SELECT SUM(amount) FROM safe_ledger WHERE shift_id=${shift.id} AND type='outflow' AND (description LIKE 'دفعة لمورد%' OR description LIKE 'سداد دين مورد%')),0) AS supplier_out,
        COALESCE((SELECT SUM(amount) FROM safe_ledger WHERE shift_id=${shift.id} AND type='outflow' AND description NOT LIKE 'مرتجع%' AND description NOT LIKE 'دفعة لمورد%' AND description NOT LIKE 'سداد دين مورد%'),0) AS expense_out,
        COALESCE((SELECT SUM(digital_impact) FROM momkn_transactions WHERE shift_id=${shift.id}),0) AS momkn_digital,
        COALESCE((SELECT SUM(cash_impact) FROM momkn_transactions WHERE shift_id=${shift.id}),0) AS momkn_cash,
        COALESCE((SELECT SUM(commission) FROM momkn_transactions WHERE shift_id=${shift.id}),0) AS momkn_commission,
        COALESCE((SELECT COUNT(*) FROM momkn_transactions WHERE shift_id=${shift.id}),0) AS momkn_count,
        COALESCE((SELECT SUM(digital_impact) FROM mobile_money_transactions WHERE shift_id=${shift.id}),0) AS mm_digital,
        COALESCE((SELECT SUM(cash_impact) FROM mobile_money_transactions WHERE shift_id=${shift.id}),0) AS mm_cash,
        COALESCE((SELECT SUM(commission) FROM mobile_money_transactions WHERE shift_id=${shift.id}),0) AS mm_commission,
        COALESCE((SELECT COUNT(*) FROM mobile_money_transactions WHERE shift_id=${shift.id}),0) AS mm_count,
        COALESCE((SELECT SUM(digital_impact) FROM mobile_money_transactions WHERE shift_id=${shift.id} AND platform='vodafone_cash'),0) AS vf_digital,
        COALESCE((SELECT SUM(digital_impact) FROM mobile_money_transactions WHERE shift_id=${shift.id} AND platform='instapay'),0) AS instapay_digital,
        COALESCE((SELECT SUM(digital_impact) FROM mobile_money_transactions WHERE shift_id=${shift.id} AND platform='bank_transfer'),0) AS bank_digital
    `).then(rows => {
      if (rows && rows[0]) setDetail(rows[0])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [shift])

  if (!shift) return null

  const diff = fmtDiff(shift.difference)
  const momknStartBalance = Number(shift.momkn_start_balance) || 0
  const momknStartCash    = Number(shift.momkn_start_cash)    || 0
  const vfStartBalance    = Number(shift.vfcash_start_balance)|| 0
  const vfStartCash       = Number(shift.vfcash_start_cash)   || 0

  const mainExpected = detail
    ? Number(detail.initial_cash) + Number(detail.cash_sales) + Number(detail.inflow)
      - Number(detail.returns_out) - Number(detail.supplier_out) - Number(detail.expense_out)
    : null

  const Row = ({ label, value, color, bold }) => (
    <>
      <span style={{ color: '#4b5563', fontSize: '0.82rem' }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 500, color: color || '#111827', textAlign: 'left', fontSize: '0.85rem' }}>{value}</span>
    </>
  )

  const Section = ({ icon, title, color, children }) => (
    <div style={{ background: '#f9fafb', border: `1px solid ${color}44`, borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ fontWeight: 700, fontSize: '0.85rem', color, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        {icon}{title}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
        {children}
      </div>
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 10000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 16px', overflowY: 'auto' }}>
      <div style={{ background: '#fff', color: '#111827', borderRadius: 14, width: '100%', maxWidth: 620, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)', margin: 'auto' }}>
        <div style={{ background: 'linear-gradient(135deg, #1e40af, #1d4ed8)', borderRadius: '14px 14px 0 0', padding: '16px 20px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>تفاصيل الوردية #{shift.id}</div>
            <div style={{ fontSize: '0.82rem', opacity: 0.85, marginTop: 2, display: 'flex', gap: 16 }}>
              <span><User size={12} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />{shift.username}</span>
              <span><Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />{shift.start_time?.split(' ')[0]}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[{ label: 'بداية الوردية', value: shift.start_time || '—' }, { label: 'نهاية الوردية', value: shift.end_time || '—' }].map(({ label, value }) => (
              <div key={label} style={{ background: '#f3f4f6', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: 2 }}>{label}</div>
                <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: Number(shift.difference) === 0 ? '#f0fdf4' : Number(shift.difference) > 0 ? '#fffbeb' : '#fef2f2', border: `1px solid ${Number(shift.difference) === 0 ? '#bbf7d0' : Number(shift.difference) > 0 ? '#fde68a' : '#fecaca'}`, borderRadius: 8, padding: '8px 14px' }}>
            {Number(shift.difference) === 0 ? <CheckCircle size={18} color="#16a34a" /> : <AlertTriangle size={18} color={Number(shift.difference) > 0 ? '#d97706' : '#dc2626'} />}
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                {Number(shift.difference) === 0 ? 'تطابق تام' : Number(shift.difference) > 0 ? 'زيادة في الدرج' : 'عجز في الدرج'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#4b5563' }}>
                متوقع: {fmt(shift.expected_end_cash)} ج.م &nbsp;|&nbsp; فعلي: {fmt(shift.actual_end_cash)} ج.م &nbsp;|&nbsp;
                <strong style={{ color: diff.color }}>{diff.text}</strong>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>جاري تحميل التفاصيل...</div>
          ) : detail && (
            <>
              <Section icon={<DollarSign size={15} />} title="ملخص المبيعات" color="#1d4ed8">
                <Row label="إجمالي الفواتير" value={`${fmt(detail.all_sales)} ج.م (${detail.sale_count} فاتورة)`} bold />
                <Row label="خصومات ممنوحة" value={`- ${fmt(detail.total_discounts)} ج.م`} color="#d97706" />
                <Row label="مبيعات نقدي" value={`${fmt(detail.cash_sales)} ج.م`} color="#16a34a" bold />
                <Row label="مبيعات آجل" value={`${fmt(detail.debt_sales)} ج.م`} color="#d97706" />
                <Row label="مبيعات رقمية" value={`${fmt(detail.digital_sales)} ج.م`} color="#7c3aed" />
              </Section>

              <Section icon={<Calculator size={15} />} title="درج السوبر ماركت (النقدي)" color="#1e40af">
                <Row label="فكة افتتاحية" value={`${fmt(detail.initial_cash)} ج.م`} color="#1e40af" bold />
                <Row label="مبيعات نقدي دخلت الدرج" value={`+ ${fmt(detail.cash_sales)} ج.م`} color="#16a34a" />
                <Row label="تحصيل ديون عملاء" value={`+ ${fmt(detail.inflow)} ج.م`} color="#16a34a" />
                <Row label="مرتجعات صرف" value={`- ${fmt(detail.returns_out)} ج.م`} color="#dc2626" />
                <Row label="مدفوعات موردين" value={`- ${fmt(detail.supplier_out)} ج.م`} color="#dc2626" />
                <Row label="مصاريف ونثريات" value={`- ${fmt(detail.expense_out)} ج.م`} color="#dc2626" />
                <span style={{ gridColumn: '1/-1', borderTop: '1px dashed #bfdbfe', paddingTop: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  <span style={{ fontWeight: 700, color: '#1e40af', fontSize: '0.85rem' }}>الدرج المتوقع:</span>
                  <span style={{ fontWeight: 800, color: '#1d4ed8', fontSize: '0.9rem', textAlign: 'left' }}>{mainExpected !== null ? fmt(mainExpected) : '—'} ج.م</span>

                  <span style={{ fontWeight: 700, color: '#1e40af', fontSize: '0.85rem' }}>الدرج الفعلي المدخل:</span>
                  <span style={{ fontWeight: 800, color: '#10b981', fontSize: '0.9rem', textAlign: 'left' }}>{fmt(shift.actual_supermarket_cash)} ج.م</span>

                  <span style={{ fontWeight: 700, color: '#1e40af', fontSize: '0.85rem' }}>فرق درج السوبرماركت:</span>
                  <span style={{ fontWeight: 800, color: fmtDiff(Number(shift.actual_supermarket_cash) - (mainExpected || 0)).color, fontSize: '0.9rem', textAlign: 'left' }}>
                    {fmtDiff(Number(shift.actual_supermarket_cash) - (mainExpected || 0)).text}
                  </span>
                </span>
              </Section>

              {/* Momkn */}
              <Section icon={<Smartphone size={15} />} title="ماكينة ممكن" color="#7c3aed">
                <Row label="رصيد ديجيتال افتتاحي" value={`${fmt(momknStartBalance)} ج.م`} color="#7c3aed" bold />
                <Row label="رصيد كاش افتتاحي" value={`${fmt(momknStartCash)} ج.م`} />
                <Row label="حركات رقمية صافية" value={`${fmt(detail.momkn_digital)} ج.م`} color={Number(detail.momkn_digital) >= 0 ? '#16a34a' : '#dc2626'} />
                <Row label="حركات كاش صافية" value={`${fmt(detail.momkn_cash)} ج.م`} color={Number(detail.momkn_cash) >= 0 ? '#16a34a' : '#dc2626'} />
                <Row label="عمولات ممكن" value={`${fmt(detail.momkn_commission)} ج.م`} color="#f59e0b" />
                <Row label="عدد العمليات" value={`${detail.momkn_count} عملية`} />
                
                <span style={{ gridColumn: '1/-1', borderTop: '1px dashed #ddd6fe', paddingTop: 6, display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '4px', fontSize: '0.78rem' }}>
                  <span style={{ fontWeight: 700, color: '#7c3aed' }}>الرصيد الرقمي:</span>
                  <span style={{ color: '#6b7280', textAlign: 'left' }}>متوقع: {fmt(momknStartBalance + Number(detail.momkn_digital))}</span>
                  <span style={{ color: '#10b981', fontWeight: 700, textAlign: 'left' }}>فعلي: {fmt(shift.actual_momkn_digital)}</span>

                  <span style={{ fontWeight: 700, color: '#7c3aed' }}>درج كاش ممكن:</span>
                  <span style={{ color: '#6b7280', textAlign: 'left' }}>متوقع: {fmt(momknStartCash + Number(detail.momkn_cash))}</span>
                  <span style={{ color: '#10b981', fontWeight: 700, textAlign: 'left' }}>فعلي: {fmt(shift.actual_momkn_cash)}</span>
                  
                  <span style={{ fontWeight: 700, color: '#7c3aed' }}>فرق كاش ممكن:</span>
                  <span style={{ gridColumn: '2 / span 2', fontWeight: 800, color: fmtDiff(Number(shift.actual_momkn_cash) - (momknStartCash + Number(detail.momkn_cash))).color, textAlign: 'left' }}>
                    {fmtDiff(Number(shift.actual_momkn_cash) - (momknStartCash + Number(detail.momkn_cash))).text}
                  </span>
                </span>
              </Section>

              {/* Mobile Money */}
              <Section icon={<Wallet size={15} />} title="المحافظ الرقمية (فودافون / انستا باي / بنك)" color="#065f46">
                <Row label="رصيد فودافون افتتاحي" value={`${fmt(vfStartBalance)} ج.م`} color="#065f46" bold />
                <Row label="كاش درج VF افتتاحي" value={`${fmt(vfStartCash)} ج.م`} />
                <Row label="حركات فودافون كاش" value={`${fmt(detail.vf_digital)} ج.م`} color={Number(detail.vf_digital) >= 0 ? '#16a34a' : '#dc2626'} />
                <Row label="حركات انستا باي" value={`${fmt(detail.instapay_digital)} ج.م`} color={Number(detail.instapay_digital) >= 0 ? '#16a34a' : '#dc2626'} />
                <Row label="تحويلات بنكية" value={`${fmt(detail.bank_digital)} ج.م`} color={Number(detail.bank_digital) >= 0 ? '#16a34a' : '#dc2626'} />
                <Row label="عمولات محافظ" value={`${fmt(detail.mm_commission)} ج.م`} color="#f59e0b" />
                <Row label="عدد العمليات" value={`${detail.mm_count} عملية`} />
                
                <span style={{ gridColumn: '1/-1', borderTop: '1px dashed #a7f3d0', paddingTop: 6, display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '4px', fontSize: '0.78rem' }}>
                  <span style={{ fontWeight: 700, color: '#065f46' }}>رصيد فودافون الرقمي:</span>
                  <span style={{ color: '#6b7280', textAlign: 'left' }}>متوقع: {fmt(vfStartBalance + Number(detail.vf_digital))}</span>
                  <span style={{ color: '#10b981', fontWeight: 700, textAlign: 'left' }}>فعلي: {fmt(shift.actual_vfcash_digital)}</span>

                  <span style={{ fontWeight: 700, color: '#065f46' }}>درج كاش فودافون:</span>
                  <span style={{ color: '#6b7280', textAlign: 'left' }}>متوقع: {fmt(vfStartCash + Number(detail.mm_cash))}</span>
                  <span style={{ color: '#10b981', fontWeight: 700, textAlign: 'left' }}>فعلي: {fmt(shift.actual_vfcash_cash)}</span>
                  
                  <span style={{ fontWeight: 700, color: '#065f46' }}>فرق كاش فودافون:</span>
                  <span style={{ gridColumn: '2 / span 2', fontWeight: 800, color: fmtDiff(Number(shift.actual_vfcash_cash) - (vfStartCash + Number(detail.mm_cash))).color, textAlign: 'left' }}>
                    {fmtDiff(Number(shift.actual_vfcash_cash) - (vfStartCash + Number(detail.mm_cash))).text}
                  </span>
                </span>
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function PaginationBar({ page, totalPages, setPage, total }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
      <button onClick={() => setPage(1)} disabled={page === 1} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontFamily: 'inherit' }}>«</button>
      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontFamily: 'inherit' }}>‹ السابق</button>
      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0 8px' }}>صفحة {page} من {totalPages} — ({total} إجمالي)</span>
      <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, fontFamily: 'inherit' }}>التالي ›</button>
      <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, fontFamily: 'inherit' }}>»</button>
    </div>
  )
}

function ClosedShiftsTable({ shiftsHistory }) {
  const [page, setPage] = useState(1)
  const [selectedShift, setSelectedShift] = useState(null)
  const data = shiftsHistory || []
  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE))
  const pageData = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <>
      {selectedShift && <ShiftDetailPanel shift={selectedShift} onClose={() => setSelectedShift(null)} />}
      <div className="admin-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>سجل الورديات المقفلة وجرد الخزينة</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '4px 8px' }}>
              👆 اضغط على أي وردية لعرض تفاصيلها الكاملة
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>إجمالي: {data.length} وردية</span>
          </div>
        </div>
        <div className="admin-table-wrapper" style={{ marginTop: '15px' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>رقم الوردية</th><th>الكاشير</th><th>تاريخ البدء</th><th>تاريخ الإغلاق</th>
                <th>الافتتاحي</th><th>المتوقع</th><th>الفعلي المسلم</th><th>الفرق</th><th></th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد ورديات مغلقة مسجلة في النظام بعد.</td></tr>
              ) : (
                pageData.map((s, idx) => {
                  const prevShift = pageData[idx - 1]
                  const showSeparator = prevShift && prevShift.id > 28 && s.id <= 28
                  const diff = fmtDiff(s.difference)
                  return (
                    <React.Fragment key={s.id}>
                      {showSeparator && (
                        <tr>
                          <td colSpan="9" style={{ padding: 0, border: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))', borderTop: '2px dashed rgba(245,158,11,0.5)', borderBottom: '2px dashed rgba(245,158,11,0.5)' }}>
                              <span style={{ fontSize: '1rem' }}>📦</span>
                              <div>
                                <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#f59e0b' }}>بداية نظام التوريد الجديد — عهدة 200 ج.م</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>من الوردية #{prevShift.id} وما بعدها: الكاشير يسلّم الفلوس في ظرف ويبقى 200 ج.م فكة بالدرج</div>
                              </div>
                              <div style={{ marginRight: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>↑ نظام جديد &nbsp;|&nbsp; نظام قديم ↓</div>
                            </div>
                          </td>
                        </tr>
                      )}
                      <tr
                        onClick={() => setSelectedShift(s)}
                        style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}
                      >
                        <td style={{ fontWeight: 'bold' }}>#{s.id}</td>
                        <td style={{ fontWeight: '600' }}>{s.username}</td>
                        <td style={{ fontSize: '0.8rem' }}>{s.start_time}</td>
                        <td style={{ fontSize: '0.8rem' }}>{s.end_time}</td>
                        <td>{fmt(s.initial_cash)} ج.م</td>
                        <td>{fmt(s.expected_end_cash)} ج.م</td>
                        <td style={{ fontWeight: 'bold' }}>{fmt(s.actual_end_cash)} ج.م</td>
                        <td style={{ fontWeight: 'bold', color: diff.color }}>{diff.text}</td>
                        <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}><ChevronDown size={14} /></td>
                      </tr>
                    </React.Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && <PaginationBar page={page} totalPages={totalPages} setPage={setPage} total={data.length} />}
      </div>
    </>
  )
}

function AuditsTable({ shiftAudits }) {
  const [page, setPage] = useState(1)
  const data = shiftAudits || []
  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE))
  const pageData = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="admin-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>سجل الجرد الدوري للخزينة خلال الوردية 🕒</h3>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>إجمالي: {data.length} جرد</span>
      </div>
      <div className="admin-table-wrapper" style={{ marginTop: '15px' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>تاريخ الجرد</th><th>رقم الوردية</th><th>الكاشير</th>
              <th>المبلغ المتوقع بالدرج</th><th>المبلغ الفعلي المدخل</th><th>الفرق (العجز/الزيادة)</th><th>ملاحظات الجرد</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد حركات جرد دوري مسجلة في النظام بعد.</td></tr>
            ) : (
              pageData.map((a) => {
                const diff = fmtDiff(a.difference)
                return (
                  <tr key={a.id}>
                    <td>{a.timestamp}</td>
                    <td style={{ fontWeight: 'bold' }}>#{a.shift_id}</td>
                    <td style={{ fontWeight: '600' }}>{a.username}</td>
                    <td>{fmt(a.expected_cash)} ج.م</td>
                    <td style={{ fontWeight: 'bold' }}>{fmt(a.actual_cash)} ج.م</td>
                    <td style={{ fontWeight: 'bold', color: diff.color }}>{diff.text}</td>
                    <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{a.notes || '—'}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && <PaginationBar page={page} totalPages={totalPages} setPage={setPage} total={data.length} />}
    </div>
  )
}

export default function ShiftsTab({ shiftsHistory, shiftAudits }) {
  const [activeSubTab, setActiveSubTab] = React.useState('closed')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginBottom: '5px' }}>
        <button className="btn" onClick={() => setActiveSubTab('closed')}
          style={{ padding: '10px 20px', fontSize: '0.95rem', borderRadius: '6px', fontWeight: 'bold', transition: 'all 0.2s ease', backgroundColor: activeSubTab === 'closed' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.03)', color: activeSubTab === 'closed' ? '#fff' : 'var(--text-secondary)', border: activeSubTab === 'closed' ? 'none' : '1px solid rgba(255,255,255,0.08)', fontFamily: 'inherit' }}>
          📁 الورديات المقفلة وجرد الخزينة
        </button>
        <button className="btn" onClick={() => setActiveSubTab('audits')}
          style={{ padding: '10px 20px', fontSize: '0.95rem', borderRadius: '6px', fontWeight: 'bold', transition: 'all 0.2s ease', backgroundColor: activeSubTab === 'audits' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.03)', color: activeSubTab === 'audits' ? '#fff' : 'var(--text-secondary)', border: activeSubTab === 'audits' ? 'none' : '1px solid rgba(255,255,255,0.08)', fontFamily: 'inherit' }}>
          🕒 سجل الجرد الدوري خلال الوردية
        </button>
      </div>
      {activeSubTab === 'closed' ? <ClosedShiftsTable shiftsHistory={shiftsHistory} /> : <AuditsTable shiftAudits={shiftAudits} />}
    </div>
  )
}

