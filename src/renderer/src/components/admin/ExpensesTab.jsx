import React from 'react'
import { AlertTriangle, Plus, Trash2 } from 'lucide-react'

export default function ExpensesTab({
  expensesList = [],
  showAddExpenseModal,
  setShowAddExpenseModal,
  newExpenseForm,
  setNewExpenseForm,
  handleAddExpense,
  handleDeleteExpense
}) {
  const [sortField, setSortField] = React.useState('timestamp')
  const [sortAsc, setSortAsc] = React.useState(false)

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  const sortedExpenses = React.useMemo(() => {
    return [...expensesList].sort((a, b) => {
      let valA = a[sortField]
      let valB = b[sortField]
      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB, 'ar') : valB.localeCompare(valA, 'ar')
      }
      valA = valA || 0
      valB = valB || 0
      return sortAsc ? valA - valB : valB - valA
    })
  }, [expensesList, sortField, sortAsc])

  return (
    <div className="admin-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>💸 سجل المصاريف اليومية والتشغيلية</h3>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowAddExpenseModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          <Plus size={16} />
          تسجيل مصروف جديد
        </button>
      </div>

      <div className="admin-table-wrapper" style={{ marginTop: '15px' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>م</th>
              <th onClick={() => handleSort('timestamp')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                التاريخ والوقت {sortField === 'timestamp' && (sortAsc ? ' ▲' : ' ▼')}
              </th>
              <th onClick={() => handleSort('category')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                التصنيف {sortField === 'category' && (sortAsc ? ' ▲' : ' ▼')}
              </th>
              <th onClick={() => handleSort('amount')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                المبلغ {sortField === 'amount' && (sortAsc ? ' ▲' : ' ▼')}
              </th>
              <th onClick={() => handleSort('description')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                البيان والوصف {sortField === 'description' && (sortAsc ? ' ▲' : ' ▼')}
              </th>
              <th style={{ width: '80px', textAlign: 'center' }}>العمليات</th>
            </tr>
          </thead>
          <tbody>
            {sortedExpenses.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  لا توجد مصاريف مسجلة حتى الآن.
                </td>
              </tr>
            ) : (
              sortedExpenses.map((exp, idx) => (
                <tr key={exp.id}>
                  <td>{idx + 1}</td>
                  <td style={{ fontSize: '0.85rem' }}>{exp.timestamp}</td>
                  <td>
                    <span style={{ 
                      backgroundColor: 'rgba(235, 94, 40, 0.1)', 
                      color: 'var(--accent-amber)', 
                      padding: '3px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      {exp.category}
                    </span>
                  </td>
                  <td style={{ fontWeight: 'bold', color: 'var(--accent-rose)' }}>
                    -{exp.amount?.toFixed(2)} ج.م
                  </td>
                  <td>{exp.description}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      className="delete-btn" 
                      onClick={() => handleDeleteExpense(exp)}
                      style={{ color: 'var(--accent-rose)', border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '24px',
            width: '450px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            direction: 'rtl'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'var(--text-main)' }}>
              📝 تسجيل مصروف جديد
            </h3>
            
            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>المبلغ (ج.م) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={newExpenseForm.amount}
                  onChange={(e) => setNewExpenseForm({ ...newExpenseForm, amount: e.target.value })}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>التصنيف *</label>
                <select
                  value={newExpenseForm.category}
                  onChange={(e) => setNewExpenseForm({ ...newExpenseForm, category: e.target.value })}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                >
                  <option value="عام">عام / نثرية</option>
                  <option value="صيانة">صيانة وإصلاحات</option>
                  <option value="إيجار">إيجار</option>
                  <option value="كهرباء">كهرباء ومياه</option>
                  <option value="أجور">أجور ورواتب</option>
                  <option value="بضائع">بضائع ومشتريات</option>
                  <option value="توصيل">خدمات توصيل</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>البيان والوصف *</label>
                <textarea
                  required
                  placeholder="اكتب تفاصيل المصروف هنا..."
                  rows="3"
                  value={newExpenseForm.description}
                  onChange={(e) => setNewExpenseForm({ ...newExpenseForm, description: e.target.value })}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    fontSize: '0.95rem',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                >
                  حفظ المصروف
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                  onClick={() => setShowAddExpenseModal(false)}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
