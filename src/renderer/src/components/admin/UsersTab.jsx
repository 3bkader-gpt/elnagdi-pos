import React from 'react'

/**
 * @param {object} props
 * @param {function} props.setNewUser
 * @param {function} props.setShowAddUserModal
 * @param {object[]} props.usersList
 * @param {function} props.setEditUser
 * @param {function} props.setShowEditUserModal
 * @param {object} props.currentUser
 * @param {function} props.handleDeleteUser
 * @param {function} props.handleSystemReset
 */
export default function UsersTab({
  setNewUser,
  setShowAddUserModal,
  usersList,
  setEditUser,
  setShowEditUserModal,
  currentUser,
  handleDeleteUser,
  handleSystemReset
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>👥 إدارة حسابات الكاشيرات والمشرفين</h3>
          <button className="btn btn-primary" onClick={() => {
            setNewUser({ username: '', pin: '', role: 'cashier' })
            setShowAddUserModal(true)
          }}>
            ➕ إضافة حساب جديد
          </button>
        </div>

        <div className="admin-table-wrapper" style={{ marginTop: '15px' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>رقم التعريف</th>
                <th>اسم المستخدم (الكاشير)</th>
                <th>رمز المرور (PIN)</th>
                <th>نوع الصلاحية</th>
                <th style={{ width: '180px', textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {usersList.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    لا يوجد حسابات كاشير مسجلة في قاعدة البيانات.
                  </td>
                </tr>
              ) : (
                usersList.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 'bold' }}>#{u.id}</td>
                    <td style={{ fontWeight: '600' }}>{u.username}</td>
                    <td style={{ fontFamily: 'monospace', letterSpacing: '0.1em' }}>{u.password_hash}</td>
                    <td>
                      <span className="badge-status" style={{
                        backgroundColor: u.role === 'admin' ? 'rgba(37, 99, 235, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                        color: u.role === 'admin' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                      }}>
                        {u.role === 'admin' ? 'مدير (Admin)' : 'كاشير (Cashier)'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        className="btn btn-sm btn-secondary" 
                        onClick={() => {
                          setEditUser({ id: u.id, username: u.username, pin: u.password_hash, role: u.role })
                          setShowEditUserModal(true)
                        }}
                      >
                        تعديل
                      </button>
                      <button 
                        className="btn btn-sm btn-secondary" 
                        style={{ color: 'var(--accent-rose)', borderColor: 'var(--accent-rose)' }}
                        onClick={() => handleDeleteUser(u)}
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Maintenance: System Reset ── */}
      <div className="admin-card" style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.04)' }}>
        <h3 style={{ color: 'var(--accent-rose)', marginBottom: '8px' }}>🔧 صيانة النظام وإعادة الضبط</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.6' }}>
          تُستخدم قبل البدء الفعلي لحذف بيانات الاختبار.<br/>
          <strong style={{ color: 'var(--accent-rose)' }}>تحذير:</strong> لا يمكن التراجع. ستُحذف الفواتير والورديات والعملاء والموردين والشيكات — ويبقى المخزن والمستخدمون.
        </p>
        <button
          id="btn-system-reset"
          className="btn"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)', fontWeight: 'bold', padding: '10px 24px' }}
          onClick={handleSystemReset}
        >
          🗑️ إعادة ضبط بيانات التشغيل (ريسيت)
        </button>
      </div>
    </div>
  )
}
