import React, { useState, useEffect } from 'react'
import { getSystemLogs } from '../../lib/dao/logs.dao'
import { executeQuery } from '../../lib/db'

export default function LogsTab() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionFilter, setActionFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [users, setUsers] = useState([])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const data = await getSystemLogs(200, 0)
      setLogs(data || [])
    } catch (e) {
      console.error('Failed to load system logs:', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await executeQuery('SELECT DISTINCT username FROM users UNION SELECT DISTINCT username FROM system_logs WHERE username IS NOT NULL;')
      setUsers(res || [])
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    fetchLogs()
    fetchUsers()
  }, [])

  const translateAction = (act) => {
    switch (act) {
      case 'user_create': return '👤 إنشاء موظف'
      case 'user_update': return '⚙️ تعديل موظف'
      case 'user_delete': return '🗑️ حذف موظف'
      case 'shift_open': return '🔓 فتح وردية'
      case 'shift_close': return '🔒 إغلاق وردية'
      case 'system_reset': return '⚠️ تهيئة النظام'
      case 'database_backup': return '💾 نسخة احتياطية'
      case 'checkout_sale': return '🧾 فاتورة بيع'
      default: return act
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesAction = actionFilter ? log.action_type === actionFilter : true
    const matchesUser = userFilter ? log.username === userFilter : true
    return matchesAction && matchesUser
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '10px' }}>
      
      {/* Filters bar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>تصفية حسب نوع العملية</label>
          <select 
            value={actionFilter} 
            onChange={(e) => setActionFilter(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.85rem' }}
          >
            <option value="">كل العمليات</option>
            <option value="user_create">👤 إنشاء موظف</option>
            <option value="user_update">⚙️ تعديل موظف</option>
            <option value="user_delete">🗑️ حذف موظف</option>
            <option value="shift_open">🔓 فتح وردية</option>
            <option value="shift_close">🔒 إغلاق وردية</option>
            <option value="system_reset">⚠️ تهيئة النظام</option>
            <option value="database_backup">💾 نسخة احتياطية</option>
            <option value="checkout_sale">🧾 فاتورة بيع</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>تصفية حسب المسؤول</label>
          <select 
            value={userFilter} 
            onChange={(e) => setUserFilter(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.85rem' }}
          >
            <option value="">كل المسؤولين</option>
            {users.map(u => (
              <option key={u.username} value={u.username}>{u.username}</option>
            ))}
          </select>
        </div>

        <button 
          className="btn btn-secondary" 
          onClick={fetchLogs} 
          style={{ height: '36px', alignSelf: 'flex-end', padding: '0 15px', fontSize: '0.85rem' }}
        >
          🔄 تحديث السجل
        </button>
      </div>

      {/* Logs Table */}
      <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>جاري تحميل سجل العمليات...</div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>لا توجد عمليات مسجلة تطابق التصفية.</div>
        ) : (
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '10px 12px', fontSize: '0.85rem' }}>التاريخ والوقت</th>
                <th style={{ padding: '10px 12px', fontSize: '0.85rem' }}>المسؤول</th>
                <th style={{ padding: '10px 12px', fontSize: '0.85rem' }}>نوع العملية</th>
                <th style={{ padding: '10px 12px', fontSize: '0.85rem' }}>تفاصيل العملية</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '10px 12px', fontSize: '0.82rem', direction: 'ltr', textAlign: 'right' }}>{log.timestamp}</td>
                  <td style={{ padding: '10px 12px', fontSize: '0.85rem', fontWeight: 'bold' }}>{log.username || 'النظام'}</td>
                  <td style={{ padding: '10px 12px', fontSize: '0.85rem' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      background: log.action_type.includes('delete') || log.action_type.includes('reset') ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
                      color: log.action_type.includes('delete') || log.action_type.includes('reset') ? 'var(--accent-rose)' : 'var(--text-main)'
                    }}>
                      {translateAction(log.action_type)}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{log.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
