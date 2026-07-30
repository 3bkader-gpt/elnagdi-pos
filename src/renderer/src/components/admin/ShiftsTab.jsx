// ─────────────────────────────────────────────────────────────
// Admin Tab: Shifts History
// Shows a read-only table of all closed shifts with reconciliation data.
// Paginated: 25 rows per page.
// ─────────────────────────────────────────────────────────────
import React from 'react'

const PAGE_SIZE = 25

function PaginationBar({ page, totalPages, setPage, total }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
      <button onClick={() => setPage(1)} disabled={page === 1}
        style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontFamily: 'inherit' }}>
        «
      </button>
      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
        style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontFamily: 'inherit' }}>
        ‹ السابق
      </button>
      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0 8px' }}>
        صفحة {page} من {totalPages} — ({total} إجمالي)
      </span>
      <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
        style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, fontFamily: 'inherit' }}>
        التالي ›
      </button>
      <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
        style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, fontFamily: 'inherit' }}>
        »
      </button>
    </div>
  )
}

function ClosedShiftsTable({ shiftsHistory }) {
  const [page, setPage] = React.useState(1)
  const data = shiftsHistory || []
  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE))
  const pageData = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="admin-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>سجل الورديات المقفلة وجرد الخزينة</h3>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          إجمالي: {data.length} وردية
        </span>
      </div>
      <div className="admin-table-wrapper" style={{ marginTop: '15px' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>رقم الوردية</th>
              <th>الكاشير</th>
              <th>تاريخ البدء</th>
              <th>تاريخ الإغلاق</th>
              <th>المبلغ الافتتاحي</th>
              <th>النقدية المتوقعة بالدرج</th>
              <th>النقدية الفعلية المسلمة</th>
              <th>الفرق (العجز/الزيادة)</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  لا توجد ورديات مغلقة مسجلة في النظام بعد.
                </td>
              </tr>
            ) : (
              pageData.map((s, idx) => {
                // الفاصل بين النظام القديم و الجديد
                const prevShift = pageData[idx - 1]
                const showSeparator = prevShift && prevShift.id > 28 && s.id <= 28

                return (
                  <React.Fragment key={s.id}>
                    {showSeparator && (
                      <tr>
                        <td colSpan="8" style={{ padding: 0, border: 'none' }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 14px',
                            background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))',
                            borderTop: '2px dashed rgba(245,158,11,0.5)',
                            borderBottom: '2px dashed rgba(245,158,11,0.5)',
                          }}>
                            <span style={{ fontSize: '1rem' }}>📦</span>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#f59e0b', letterSpacing: '0.03em' }}>
                                بداية نظام التوريد الجديد — عهدة 200 ج.م
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                من الوردية #{prevShift.id} وما بعدها: الكاشير يسلّم الفلوس في ظرف ويبقى 200 ج.م فكة بالدرج
                              </div>
                            </div>
                            <div style={{ marginRight: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              ↑ نظام جديد &nbsp;|&nbsp; نظام قديم ↓
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td style={{ fontWeight: 'bold' }}>#{s.id}</td>
                      <td style={{ fontWeight: '600' }}>{s.username}</td>
                      <td>{s.start_time}</td>
                      <td>{s.end_time}</td>
                      <td>{(s.initial_cash || 0).toFixed(2)} ج.م</td>
                      <td>{(s.expected_end_cash || 0).toFixed(2)} ج.م</td>
                      <td style={{ fontWeight: 'bold' }}>{(s.actual_end_cash || 0).toFixed(2)} ج.م</td>
                      <td style={{ fontWeight: 'bold', color: s.difference < 0 ? 'var(--accent-rose)' : s.difference > 0 ? 'var(--accent-emerald)' : 'inherit' }}>
                        {s.difference > 0 ? `+${s.difference.toFixed(2)}` : (s.difference || 0).toFixed(2)} ج.م
                      </td>
                    </tr>
                  </React.Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <PaginationBar page={page} totalPages={totalPages} setPage={setPage} total={data.length} />
      )}
    </div>
  )
}

function AuditsTable({ shiftAudits }) {
  const [page, setPage] = React.useState(1)
  const data = shiftAudits || []
  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE))
  const pageData = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="admin-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>سجل الجرد الدوري للخزينة خلال الوردية 🕒</h3>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          إجمالي: {data.length} جرد
        </span>
      </div>
      <div className="admin-table-wrapper" style={{ marginTop: '15px' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>تاريخ الجرد</th>
              <th>رقم الوردية</th>
              <th>الكاشير</th>
              <th>المبلغ المتوقع بالدرج</th>
              <th>المبلغ الفعلي المدخل</th>
              <th>الفرق (العجز/الزيادة)</th>
              <th>ملاحظات الجرد</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  لا توجد حركات جرد دوري مسجلة في النظام بعد.
                </td>
              </tr>
            ) : (
              pageData.map((a) => (
                <tr key={a.id}>
                  <td>{a.timestamp}</td>
                  <td style={{ fontWeight: 'bold' }}>#{a.shift_id}</td>
                  <td style={{ fontWeight: '600' }}>{a.username}</td>
                  <td>{(a.expected_cash || 0).toFixed(2)} ج.م</td>
                  <td style={{ fontWeight: 'bold' }}>{(a.actual_cash || 0).toFixed(2)} ج.م</td>
                  <td style={{ fontWeight: 'bold', color: a.difference < 0 ? 'var(--accent-rose)' : a.difference > 0 ? 'var(--accent-orange)' : 'var(--accent-emerald)' }}>
                    {a.difference > 0 ? `+${a.difference.toFixed(2)}` : (a.difference || 0).toFixed(2)} ج.م
                  </td>
                  <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{a.notes || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <PaginationBar page={page} totalPages={totalPages} setPage={setPage} total={data.length} />
      )}
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

      {activeSubTab === 'closed' ? (
        <ClosedShiftsTable shiftsHistory={shiftsHistory} />
      ) : (
        <AuditsTable shiftAudits={shiftAudits} />
      )}
    </div>
  )
}
