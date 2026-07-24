import React from 'react'

/**
 * @param {object} props
 * @param {object[]} props.checksDueToday
 * @param {function} props.setNewCheckForm
 * @param {function} props.setShowAddCheckModal
 * @param {object[]} props.checksList
 * @param {function} props.handleMarkCheckPaid
 * @param {function} props.handleDeleteCheck
 */
export default function ChecksTab({
  checksDueToday,
  setNewCheckForm,
  setShowAddCheckModal,
  checksList,
  handleMarkCheckPaid,
  handleDeleteCheck
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Due Today Alert Banner */}
      {checksDueToday.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.4rem' }}>🚨</span>
          <div>
            <div style={{ fontWeight: 'bold', color: 'var(--accent-rose)' }}>تنبيه! يوجد {checksDueToday.length} شيك(ات) مستحقة اليوم!</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{checksDueToday.map(c => `${c.party_name} (${c.amount} ج.م)`).join(' ، ')}</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="admin-card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>🏦 سجل الشيكات وأوراق الدفع</h3>
          <button className="btn btn-primary"
            onClick={() => { setNewCheckForm({ check_type: 'مورد', check_number: '', bank_name: '', party_name: '', issue_date: '', due_date: '', amount: '', notes: '' }); setShowAddCheckModal(true) }}>
            ➕ إضافة شيك جديد
          </button>
        </div>
        {checksList.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>لا توجد شيكات مسجلة</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>النوع</th>
                  <th>رقم الشيك</th>
                  <th>البنك</th>
                  <th>الجهة</th>
                  <th>تاريخ الإصدار</th>
                  <th>تاريخ الاستحقاق</th>
                  <th>المبلغ</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {checksList.map(c => (
                  <tr key={c.id} style={{ background: c.status === 'غير مسدد' && c.due_date <= new Date().toISOString().split('T')[0] ? 'rgba(239,68,68,0.06)' : '' }}>
                    <td>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', background: c.check_type === 'مورد' ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)', color: c.check_type === 'مورد' ? 'var(--accent-blue)' : 'var(--accent-amber)' }}>
                        {c.check_type}
                      </span>
                    </td>
                    <td>{c.check_number || '-'}</td>
                    <td>{c.bank_name || '-'}</td>
                    <td style={{ fontWeight: 'bold' }}>{c.party_name}</td>
                    <td>{c.issue_date || '-'}</td>
                    <td style={{ color: c.status === 'غير مسدد' && c.due_date <= new Date().toISOString().split('T')[0] ? 'var(--accent-rose)' : '', fontWeight: 'bold' }}>{c.due_date}</td>
                    <td style={{ fontWeight: 'bold' }}>{(c.amount || 0).toFixed(2)} ج.م</td>
                    <td>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', background: c.status === 'مسدد' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: c.status === 'مسدد' ? 'var(--accent-green)' : 'var(--accent-rose)', fontWeight: 'bold' }}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: '6px' }}>
                      {c.status === 'غير مسدد' && (
                        <button className="btn btn-success" style={{ fontSize: '0.72rem', padding: '3px 8px' }} onClick={() => handleMarkCheckPaid(c.id)}>✅ سداد</button>
                      )}
                      <button className="delete-btn" style={{ fontSize: '0.72rem', padding: '3px 8px' }} onClick={() => handleDeleteCheck(c.id)}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
