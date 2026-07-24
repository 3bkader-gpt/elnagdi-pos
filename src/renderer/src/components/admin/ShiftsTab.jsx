// ─────────────────────────────────────────────────────────────
// Admin Tab: Shifts History
// Shows a read-only table of all closed shifts with reconciliation data.
// ─────────────────────────────────────────────────────────────
import React from 'react'

/**
 * @param {{ shiftsHistory: object[] }} props
 */
export default function ShiftsTab({ shiftsHistory, shiftAudits }) {
  const [activeSubTab, setActiveSubTab] = React.useState('closed') // 'closed' or 'audits'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Sub-tabs switch selector */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        borderBottom: '1px solid rgba(255,255,255,0.08)', 
        paddingBottom: '12px',
        marginBottom: '5px'
      }}>
        <button
          className="btn"
          onClick={() => setActiveSubTab('closed')}
          style={{
            padding: '10px 20px',
            fontSize: '0.95rem',
            borderRadius: '6px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease',
            backgroundColor: activeSubTab === 'closed' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.03)',
            color: activeSubTab === 'closed' ? '#fff' : 'var(--text-secondary)',
            border: activeSubTab === 'closed' ? 'none' : '1px solid rgba(255,255,255,0.08)'
          }}
        >
          📁 الورديات المقفلة وجرد الخزينة
        </button>
        <button
          className="btn"
          onClick={() => setActiveSubTab('audits')}
          style={{
            padding: '10px 20px',
            fontSize: '0.95rem',
            borderRadius: '6px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease',
            backgroundColor: activeSubTab === 'audits' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.03)',
            color: activeSubTab === 'audits' ? '#fff' : 'var(--text-secondary)',
            border: activeSubTab === 'audits' ? 'none' : '1px solid rgba(255,255,255,0.08)'
          }}
        >
          🕒 سجل الجرد الدوري خلال الوردية
        </button>
      </div>

      {activeSubTab === 'closed' ? (
        <div className="admin-card">
          <h3>سجل الورديات المقفلة وجرد الخزينة</h3>
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
                {shiftsHistory.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      لا توجد ورديات مغلقة مسجلة في النظام بعد.
                    </td>
                  </tr>
                ) : (
                  shiftsHistory.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 'bold' }}>#{s.id}</td>
                      <td style={{ fontWeight: '600' }}>{s.username}</td>
                      <td>{s.start_time}</td>
                      <td>{s.end_time}</td>
                      <td>{(s.initial_cash || 0).toFixed(2)} ج.م</td>
                      <td>{(s.expected_end_cash || 0).toFixed(2)} ج.م</td>
                      <td style={{ fontWeight: 'bold' }}>{(s.actual_end_cash || 0).toFixed(2)} ج.م</td>
                      <td style={{
                        fontWeight: 'bold',
                        color: s.difference < 0
                          ? 'var(--accent-rose)'
                          : s.difference > 0
                            ? 'var(--accent-emerald)'
                            : 'inherit'
                      }}>
                        {s.difference > 0 ? `+${s.difference.toFixed(2)}` : (s.difference || 0).toFixed(2)} ج.م
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="admin-card">
          <h3>سجل الجرد الدوري للخزينة خلال الوردية 🕒</h3>
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
                {!shiftAudits || shiftAudits.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      لا توجد حركات جرد دوري مسجلة في النظام بعد.
                    </td>
                  </tr>
                ) : (
                  shiftAudits.map((a) => (
                    <tr key={a.id}>
                      <td>{a.timestamp}</td>
                      <td style={{ fontWeight: 'bold' }}>#{a.shift_id}</td>
                      <td style={{ fontWeight: '600' }}>{a.username}</td>
                      <td>{(a.expected_cash || 0).toFixed(2)} ج.م</td>
                      <td style={{ fontWeight: 'bold' }}>{(a.actual_cash || 0).toFixed(2)} ج.م</td>
                      <td style={{
                        fontWeight: 'bold',
                        color: a.difference < 0
                          ? 'var(--accent-rose)'
                          : a.difference > 0
                            ? 'var(--accent-orange)'
                            : 'var(--accent-emerald)'
                      }}>
                        {a.difference > 0 ? `+${a.difference.toFixed(2)}` : (a.difference || 0).toFixed(2)} ج.م
                      </td>
                      <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{a.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
