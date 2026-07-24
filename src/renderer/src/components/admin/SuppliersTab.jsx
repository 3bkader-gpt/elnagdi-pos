import React from 'react'

/**
 * @param {object} props
 * @param {function} props.setNewSupplierForm
 * @param {function} props.setShowAddSupplierModal
 * @param {string} props.suppliersSearch
 * @param {function} props.setSuppliersSearch
 * @param {function} props.fetchSuppliersList
 * @param {object[]} props.suppliersList
 * @param {function} props.fetchSupplierProfile
 * @param {object|null} props.selectedSupplier
 * @param {function} props.setNewPurchaseForm
 * @param {function} props.setShowAddPurchaseModal
 * @param {function} props.handleDeleteSupplier
 * @param {function} props.handleSupplierRepay
 * @param {string} props.supplierRepayAmount
 * @param {function} props.setSupplierRepayAmount
 * @param {object[]} props.supplierPurchases
 * @param {object[]} props.supplierLedger
 */
export default function SuppliersTab({
  setNewSupplierForm,
  setShowAddSupplierModal,
  suppliersSearch,
  setSuppliersSearch,
  fetchSuppliersList,
  suppliersList,
  fetchSupplierProfile,
  selectedSupplier,
  setNewPurchaseForm,
  setShowAddPurchaseModal,
  handleDeleteSupplier,
  handleSupplierRepay,
  supplierRepayAmount,
  setSupplierRepayAmount,
  supplierPurchases,
  supplierLedger
}) {
  const [sortField, setSortField] = React.useState('name')
  const [sortAsc, setSortAsc] = React.useState(true)

  const sortedSuppliersList = React.useMemo(() => {
    return [...suppliersList].sort((a, b) => {
      let valA = a[sortField]
      let valB = b[sortField]
      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB, 'ar') : valB.localeCompare(valA, 'ar')
      }
      valA = valA || 0
      valB = valB || 0
      return sortAsc ? valA - valB : valB - valA
    })
  }, [suppliersList, sortField, sortAsc])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '20px', alignItems: 'start' }}>
      {/* Left: Supplier List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="admin-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>🏭 قائمة الموردين</h3>
            <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              onClick={() => { setNewSupplierForm({ name: '', phone: '', address: '', contact_person: '' }); setShowAddSupplierModal(true) }}>
              ➕ مورد جديد
            </button>
          </div>
          <input type="text" className="form-input" placeholder="بحث باسم المورد أو الهاتف..."
            value={suppliersSearch}
            onChange={e => { setSuppliersSearch(e.target.value); fetchSuppliersList(e.target.value) }}
            style={{ marginBottom: '10px' }} />
          
          {/* Sorting controls */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', fontSize: '0.8rem', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>ترتيب حسب:</span>
            {['name', 'phone', 'debt_balance'].map(field => (
              <button
                key={field}
                type="button"
                className="btn btn-sm btn-secondary"
                style={{ 
                  padding: '3px 8px', 
                  fontSize: '0.75rem',
                  backgroundColor: sortField === field ? 'var(--accent-blue)' : 'transparent',
                  color: sortField === field ? '#fff' : 'var(--text-secondary)'
                }}
                onClick={() => {
                  if (sortField === field) {
                    setSortAsc(!sortAsc)
                  } else {
                    setSortField(field)
                    setSortAsc(true)
                  }
                }}
              >
                {field === 'name' ? 'الاسم' : field === 'phone' ? 'الهاتف' : 'المديونية'}
                {sortField === field && (sortAsc ? ' ▲' : ' ▼')}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
            {sortedSuppliersList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>لا يوجد موردون مسجلون</p>
            ) : sortedSuppliersList.map(s => (
              <div key={s.id}
                onClick={() => fetchSupplierProfile(s)}
                style={{ padding: '12px', borderRadius: '8px', cursor: 'pointer', border: `1px solid ${selectedSupplier?.id === s.id ? 'var(--accent-blue)' : 'var(--border-color)'}`, background: selectedSupplier?.id === s.id ? 'rgba(37,99,235,0.08)' : 'var(--bg-secondary)' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{s.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.phone || 'لا يوجد هاتف'}</div>
                <div style={{ fontSize: '0.8rem', color: s.debt_balance > 0 ? 'var(--accent-rose)' : 'var(--accent-green)', fontWeight: 'bold' }}>
                  المديونية: {(s.debt_balance || 0).toFixed(2)} ج.م
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Supplier Profile */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {selectedSupplier ? (
          <>
            {/* Supplier Info Card */}
            <div className="admin-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0' }}>{selectedSupplier.name}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedSupplier.phone} {selectedSupplier.address && `| ${selectedSupplier.address}`}</div>
                  <div style={{ marginTop: '8px', fontSize: '1.1rem', fontWeight: 'bold', color: (selectedSupplier.debt_balance || 0) > 0 ? 'var(--accent-rose)' : 'var(--accent-green)' }}>
                    إجمالي المديونية: {(selectedSupplier.debt_balance || 0).toFixed(2)} ج.م
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                    onClick={() => { setNewPurchaseForm({ invoice_ref: '', total_amount: '', paid_amount: '', payment_type: 'آجل', notes: '' }); setShowAddPurchaseModal(true) }}>
                    🧾 فاتورة شراء
                  </button>
                  <button className="delete-btn" onClick={() => handleDeleteSupplier(selectedSupplier.id)}>🗑</button>
                </div>
              </div>
              {/* Pay supplier */}
              <form onSubmit={handleSupplierRepay} style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <input type="number" className="form-input" placeholder="مبلغ السداد (ج.م)" min="0" step="0.01"
                  value={supplierRepayAmount} onChange={e => setSupplierRepayAmount(e.target.value)} style={{ flex: 1 }} />
                <button type="submit" className="btn btn-success" style={{ whiteSpace: 'nowrap' }}>✅ سداد</button>
              </form>
            </div>
            {/* Purchases History */}
            <div className="admin-card" style={{ padding: '16px' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>🧾 فواتير الشراء</h4>
              {supplierPurchases.length === 0 ? <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>لا توجد فواتير</p> :
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table" style={{ fontSize: '0.8rem' }}>
                    <thead><tr><th>التاريخ</th><th>رقم الفاتورة</th><th>الإجمالي</th><th>المدفوع</th><th>المتبقي</th><th>نوع الدفع</th></tr></thead>
                    <tbody>
                      {supplierPurchases.map(p => (
                        <tr key={p.id}>
                          <td>{p.timestamp}</td>
                          <td>{p.invoice_ref || '-'}</td>
                          <td>{(p.total_amount || 0).toFixed(2)}</td>
                          <td>{(p.paid_amount || 0).toFixed(2)}</td>
                          <td style={{ color: (p.remaining || 0) > 0 ? 'var(--accent-rose)' : 'var(--accent-green)', fontWeight: 'bold' }}>{(p.remaining || 0).toFixed(2)}</td>
                          <td>{p.payment_type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              }
            </div>
            {/* Ledger */}
            <div className="admin-card" style={{ padding: '16px' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>📒 دفتر حساب المورد</h4>
              {supplierLedger.length === 0 ? <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>لا توجد حركات</p> :
                <table className="admin-table" style={{ fontSize: '0.8rem' }}>
                  <thead><tr><th>التاريخ</th><th>النوع</th><th>المبلغ</th><th>البيان</th></tr></thead>
                  <tbody>
                    {supplierLedger.map(l => (
                      <tr key={l.id}>
                        <td>{l.timestamp}</td>
                        <td style={{ color: l.type === 'payment' ? 'var(--accent-green)' : 'var(--accent-rose)', fontWeight: 'bold' }}>
                          {l.type === 'payment' ? 'سداد' : 'شراء'}
                        </td>
                        <td>{(l.amount || 0).toFixed(2)} ج.م</td>
                        <td>{l.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
            </div>
          </>
        ) : (
          <div className="admin-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px', color: 'var(--text-muted)' }}>
            اختر مورداً من القائمة لعرض تفاصيله
          </div>
        )}
      </div>
    </div>
  )
}
