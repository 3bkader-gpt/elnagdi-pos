import React, { useState, useMemo } from 'react'
import { Award, TrendingUp, Users, Eye } from 'lucide-react'
import { executeQuery } from '../../lib/db'

/**
 * @param {object} props
 * @param {object|null} props.highestPointsCustomer
 * @param {object|null} props.bestCustomerOfMonth
 * @param {object|null} props.selectedAdminClient
 * @param {string} props.repaymentAmount
 * @param {function} props.setRepaymentAmount
 * @param {function} props.handleRepayment
 * @param {object[]} props.adminClientLedger
 * @param {object[]} props.adminClientPurchases
 * @param {function} props.handleReprintSale
 * @param {string} props.clientsSearch
 * @param {function} props.setClientsSearch
 * @param {function} props.fetchClientsList
 * @param {object[]} props.clientsList
 * @param {function} props.selectAdminClientForProfile
 * @param {function} props.setEditClientForm
 * @param {function} props.setShowEditClientModal
 * @param {function} props.handleDeleteClient
 * @param {function} props.setNewClientForm
 * @param {function} props.setShowAddClientModal
 * @param {object[]} props.clientTopProducts
 * @param {object|null} props.clientStats
 * @param {string} props.clientPeriodFilter
 * @param {function} props.changeClientPeriodFilter
 */
export default function ClientsTab({
  highestPointsCustomer,
  bestCustomerOfMonth,
  monthlyClientsReport,
  clientTopProducts = [],
  clientStats = null,
  selectedAdminClient,
  repaymentAmount,
  setRepaymentAmount,
  handleRepayment,
  adminClientLedger,
  adminClientPurchases,
  handleReprintSale,
  clientsSearch,
  setClientsSearch,
  fetchClientsList,
  clientsList,
  selectAdminClientForProfile,
  setEditClientForm,
  setShowEditClientModal,
  handleDeleteClient,
  setNewClientForm,
  setShowAddClientModal,
  clientPeriodFilter,
  changeClientPeriodFilter
}) {
  const [activeInvoice, setActiveInvoice] = useState(null)
  const [activeInvoiceItems, setActiveInvoiceItems] = useState([])
  
  const [clientsSortField, setClientsSortField] = useState('name')
  const [clientsSortAsc, setClientsSortAsc] = useState(true)

  const handleClientsSort = (field) => {
    if (clientsSortField === field) {
      setClientsSortAsc(!clientsSortAsc)
    } else {
      setClientsSortField(field)
      setClientsSortAsc(true)
    }
  }

  const handleOpenInvoiceDetails = async (saleId) => {
    try {
      const sale = await executeQuery(`SELECT * FROM sales WHERE id = ${saleId} LIMIT 1;`)
      if (sale && sale.length > 0) {
        const items = await executeQuery(`
          SELECT si.*, p.name 
          FROM sale_items si
          LEFT JOIN products p ON si.product_barcode = p.barcode
          WHERE si.sale_id = ${saleId};
        `)
        setActiveInvoice(sale[0])
        setActiveInvoiceItems(items || [])
      }
    } catch (err) {
      console.error('Failed to load invoice details:', err)
    }
  }

  const sortedClientsList = useMemo(() => {
    return [...clientsList].sort((a, b) => {
      let valA = a[clientsSortField]
      let valB = b[clientsSortField]
      if (typeof valA === 'string') {
        return clientsSortAsc 
          ? valA.localeCompare(valB, 'ar') 
          : valB.localeCompare(valA, 'ar')
      }
      valA = valA || 0
      valB = valB || 0
      return clientsSortAsc ? valA - valB : valB - valA
    })
  }, [clientsList, clientsSortField, clientsSortAsc])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px', alignItems: 'start' }}>
      
      {/* Left Column: Profile, Ledger, and Repayment */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Stats summary at a glance */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div className="admin-card" style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '12px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.02) 100%)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '10px', borderRadius: '8px', color: 'var(--accent-amber)' }}>
              <Award size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>عميل الشهر الأكثر نقاطاً</div>
              <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{highestPointsCustomer ? highestPointsCustomer.name : 'لا يوجد'}</div>
              {highestPointsCustomer && <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>⭐️ {highestPointsCustomer.points} نقطة</div>}
            </div>
          </div>

          <div className="admin-card" style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '12px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.02) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '8px', color: 'var(--accent-emerald)' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>عميل الشهر الأكثر شراءً</div>
              <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{bestCustomerOfMonth ? bestCustomerOfMonth.name : 'لا يوجد'}</div>
              {bestCustomerOfMonth && <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>💸 {(bestCustomerOfMonth.monthlySpent || 0).toFixed(2)} ج.م</div>}
            </div>
          </div>
        </div>

        {selectedAdminClient ? (
          <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0 }}>👤 كشف حساب العميل</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>عضو منذ: {selectedAdminClient.created_at || 'غير محدد'}</span>
            </div>

            {/* Period Filter Selector */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginTop: '-5px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>فلترة الفترة:</span>
              {['all', 'daily', 'weekly', 'monthly'].map(p => (
                <button
                  key={p}
                  type="button"
                  className={`btn btn-sm ${clientPeriodFilter === p ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ 
                    padding: '3px 12px', 
                    fontSize: '0.75rem', 
                    borderRadius: '4px',
                    backgroundColor: clientPeriodFilter === p ? 'var(--accent-blue)' : 'transparent',
                    color: clientPeriodFilter === p ? '#fff' : 'var(--text-secondary)',
                    borderColor: 'var(--border-color)',
                    cursor: 'pointer'
                  }}
                  onClick={() => changeClientPeriodFilter(p)}
                >
                  {p === 'all' ? 'كل الأوقات' : p === 'daily' ? 'اليوم' : p === 'weekly' ? 'هذا الأسبوع' : 'هذا الشهر'}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px', background: 'var(--bg-main)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
              <div><strong>الاسم:</strong> {selectedAdminClient.name}</div>
              <div><strong>الهاتف:</strong> {selectedAdminClient.phone || 'لا يوجد'}</div>
              <div><strong>العنوان:</strong> {selectedAdminClient.address || 'لا يوجد'}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي المديونية الحالية</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--accent-rose)', marginTop: '4px' }}>
                  {(selectedAdminClient.debt_balance || 0).toFixed(2)} ج.م
                </div>
              </div>
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>نقاط الولاء المتراكمة</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--accent-amber)', marginTop: '4px' }}>
                  ⭐️ {selectedAdminClient.points}
                </div>
              </div>
            </div>

            {/* Repayment form */}
            {selectedAdminClient.debt_balance > 0 && (
              <form onSubmit={handleRepayment} style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', alignItems: 'center' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>💵 سداد مديونية:</div>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="أدخل المبلغ المسدد..." 
                  className="form-input" 
                  style={{ flex: 1, padding: '6px 10px', fontSize: '0.85rem' }}
                  value={repaymentAmount}
                  onChange={(e) => setRepaymentAmount(e.target.value)}
                />
                <button type="submit" className="btn btn-success" style={{ padding: '6px 15px', fontSize: '0.85rem', height: '34px' }}>
                  تأكيد السداد
                </button>
              </form>
            )}

            {/* Customer Analytics & Top Products */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', borderTop: '1px solid var(--border-color)', paddingTop: '15px', marginTop: '5px' }}>
              
              {/* Analytics summary */}
              <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: 'var(--accent-blue)', borderBottom: '1px solid var(--border-color)', paddingBottom: '5px' }}>
                  📊 إحصائيات مشتريات العميل
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>عدد الطلبات الكلي:</span>
                    <span style={{ fontWeight: 'bold' }}>{clientStats?.total_orders || 0} طلبات</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>إجمالي الإنفاق:</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--accent-emerald)' }}>
                      {(clientStats?.total_spent || 0).toFixed(2)} ج.م
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>متوسط قيمة الطلب:</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {(clientStats?.avg_spent || 0).toFixed(2)} ج.م
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>تاريخ آخر زيارة:</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--accent-amber)', fontSize: '0.75rem' }}>
                      {clientStats?.last_purchase || 'لا يوجد'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Products */}
              <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: 'var(--accent-amber)', borderBottom: '1px solid var(--border-color)', paddingBottom: '5px' }}>
                  🛍️ المنتجات الأكثر طلباً
                </h4>
                {clientTopProducts.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', paddingTop: '15px' }}>
                    لا توجد منتجات مسجلة.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {clientTopProducts.map((p, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px dotted var(--border-color)', paddingBottom: '3px', gap: '10px' }}>
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }} title={p.name}>
                          {idx + 1}. {p.name}
                        </span>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>
                          {p.total_qty} {p.total_qty % 1 === 0 ? 'وحدة' : 'كجم'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Tabs for purchases & ledger */}
            <div style={{ marginTop: '5px' }}>
              <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>📜 سجل العمليات والمبيعات</h4>
              
              <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                <table className="admin-table" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th>العملية</th>
                      <th>المبلغ</th>
                      <th>الوصف</th>
                      <th>التاريخ</th>
                      <th style={{ width: '100px' }}>التحكم</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminClientLedger.length === 0 && adminClientPurchases.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد عمليات مسجلة لهذا العميل.</td>
                      </tr>
                    ) : (
                      <>
                        {/* Show payments and credits */}
                        {adminClientLedger.map(l => {
                          const match = l.description.match(/#(\d+)/)
                          const saleId = match ? parseInt(match[1], 10) : null
                          return (
                            <tr 
                              key={`led-${l.id}`} 
                              style={{ 
                                backgroundColor: l.type === 'payment' ? 'rgba(16, 185, 129, 0.03)' : 'rgba(239, 68, 68, 0.03)',
                                cursor: saleId ? 'pointer' : 'default'
                              }}
                              onClick={() => { if (saleId) handleOpenInvoiceDetails(saleId); }}
                              title={saleId ? 'اضغط لعرض تفاصيل الفاتورة' : ''}
                            >
                              <td style={{ fontWeight: 'bold', color: l.type === 'payment' ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                                {l.type === 'payment' ? 'سداد دين' : 'مشتريات آجل'}
                              </td>
                              <td style={{ fontWeight: 'bold' }}>{(l.amount || 0).toFixed(2)} ج.م</td>
                              <td>
                                {l.description}
                                {saleId && (
                                  <span style={{ color: 'var(--accent-blue)', marginRight: '8px', fontSize: '0.75rem', textDecoration: 'underline' }}>
                                    (تفاصيل 👁️)
                                  </span>
                                )}
                              </td>
                              <td>{l.timestamp}</td>
                              <td>
                                {saleId ? (
                                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                    <button
                                      className="btn btn-sm btn-secondary"
                                      style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                                      onClick={(e) => { e.stopPropagation(); handleOpenInvoiceDetails(saleId); }}
                                    >
                                      عرض
                                    </button>
                                    <button
                                      className="btn btn-sm btn-secondary"
                                      style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                                      onClick={(e) => { e.stopPropagation(); handleReprintSale(saleId); }}
                                    >
                                      طباعة
                                    </button>
                                  </div>
                                ) : '-'}
                              </td>
                            </tr>
                          )
                        })}
                        {/* Show all invoices client did */}
                        {adminClientPurchases.map(p => (
                          <tr 
                            key={`pur-${p.id}`} 
                            style={{ backgroundColor: 'rgba(255,255,255,0.01)', cursor: 'pointer' }}
                            onClick={() => handleOpenInvoiceDetails(p.id)}
                            title="اضغط لعرض تفاصيل الفاتورة"
                          >
                            <td style={{ color: 'var(--accent-blue)' }}>فاتورة #{((p.id - 1) % 10000) + 1}</td>
                            <td style={{ fontWeight: 'bold' }}>{(p.total_amount || 0).toFixed(2)} ج.م</td>
                            <td>شراء ({p.payment_type}) - عدد {p.items_count} أصناف</td>
                            <td>{p.timestamp}</td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
                                <button 
                                  className="btn btn-sm btn-secondary" 
                                  style={{ padding: '2px 6px', fontSize: '0.75rem' }} 
                                  onClick={() => handleOpenInvoiceDetails(p.id)}
                                >
                                  عرض
                                </button>
                                <button 
                                  className="btn btn-sm btn-secondary" 
                                  style={{ padding: '2px 6px', fontSize: '0.75rem' }} 
                                  onClick={() => handleReprintSale(p.id)}
                                >
                                  طباعة
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', textAlign: 'center' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--accent-amber)' }}>
                🏆 تقرير ترتيب أفضل عملاء الشهر (الأكثر شراءً)
              </h3>
              <p style={{ margin: '5px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>إحصائية شهرية تلقائية بناءً على فواتير المبيعات الحالية</p>
            </div>

            {monthlyClientsReport && monthlyClientsReport.length > 0 ? (
              <div className="admin-table-wrapper">
                <table className="admin-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '50px', textAlign: 'center' }}>الترتيب</th>
                      <th>اسم العميل</th>
                      <th>الهاتف</th>
                      <th style={{ textAlign: 'left' }}>إجمالي المشتريات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyClientsReport.slice(0, 5).map((client, idx) => (
                      <tr 
                        key={client.id}
                        onClick={() => selectAdminClientForProfile(client)}
                        style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: idx === 0 ? 'var(--accent-amber)' : 'var(--text-secondary)' }}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                        </td>
                        <td style={{ fontWeight: 'bold' }}>{client.name}</td>
                        <td>{client.phone || '—'}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--accent-emerald)', textAlign: 'left' }}>
                          {client.totalSpent.toFixed(2)} ج.م
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                لا توجد مبيعات مسجلة لعملاء خلال الشهر الحالي حتى الآن لإنشاء التقرير.
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '15px', color: 'var(--text-muted)', textAlign: 'center' }}>
              <Users size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '0.8rem' }}>اختر عميلاً من القائمة الجانبية لعرض كشف الحساب وتفاصيل الديون والمشتريات والمكافآت بالتفصيل.</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Clients List */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>👥 دليل حسابات العملاء</h3>
          <button className="btn btn-primary" onClick={() => {
            setNewClientForm({ name: '', phone: '', address: '' })
            setShowAddClientModal(true)
          }}>
            ➕ عميل جديد
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <input 
            type="text" 
            placeholder="ابحث باسم العميل أو رقم الهاتف..." 
            className="form-input" 
            style={{ flex: 1, padding: '8px 12px' }}
            value={clientsSearch}
            onChange={(e) => {
              setClientsSearch(e.target.value)
              fetchClientsList(e.target.value)
            }}
          />
        </div>

        <div className="admin-table-wrapper" style={{ maxHeight: '580px', overflowY: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th onClick={() => handleClientsSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  الاسم {clientsSortField === 'name' && (clientsSortAsc ? ' ▲' : ' ▼')}
                </th>
                <th onClick={() => handleClientsSort('phone')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  الهاتف {clientsSortField === 'phone' && (clientsSortAsc ? ' ▲' : ' ▼')}
                </th>
                <th onClick={() => handleClientsSort('debt_balance')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  المديونية {clientsSortField === 'debt_balance' && (clientsSortAsc ? ' ▲' : ' ▼')}
                </th>
                <th onClick={() => handleClientsSort('points')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  النقاط {clientsSortField === 'points' && (clientsSortAsc ? ' ▲' : ' ▼')}
                </th>
                <th style={{ width: '160px', textAlign: 'center' }}>التحكم</th>
              </tr>
            </thead>
            <tbody>
              {sortedClientsList.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>لا يوجد عملاء مطابقين للبحث.</td>
                </tr>
              ) : (
                sortedClientsList.map(c => (
                  <tr 
                    key={c.id} 
                    onClick={() => selectAdminClientForProfile(c)}
                    style={{ 
                      cursor: 'pointer',
                      backgroundColor: selectedAdminClient && selectedAdminClient.id === c.id ? 'rgba(37, 99, 235, 0.08)' : 'transparent' 
                    }}
                  >
                    <td style={{ fontWeight: 'bold' }}>{c.name}</td>
                    <td>{c.phone || '—'}</td>
                    <td style={{ 
                      fontWeight: 'bold', 
                      color: c.debt_balance > 0 ? 'var(--accent-rose)' : 'var(--text-secondary)'
                    }}>
                      {(c.debt_balance || 0).toFixed(2)} ج.م
                    </td>
                    <td style={{ fontWeight: 'bold', color: 'var(--accent-amber)' }}>⭐️ {c.points}</td>
                    <td style={{ display: 'flex', gap: '6px', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          setEditClientForm({ id: c.id, name: c.name, phone: c.phone || '', address: c.address || '' })
                          setShowEditClientModal(true)
                        }}
                      >
                        تعديل
                      </button>
                      <button 
                        className="btn btn-sm btn-secondary"
                        style={{ color: 'var(--accent-rose)', borderColor: 'var(--accent-rose)' }}
                        onClick={() => handleDeleteClient(c.id)}
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

      {/* Invoice Details Modal */}
      {activeInvoice && (
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
            padding: '20px',
            width: '90%',
            maxWidth: '550px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            direction: 'rtl'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: 'var(--accent-blue)' }}>🧾 تفاصيل الفاتورة #{((activeInvoice.id - 1) % 10000) + 1}</h3>
              <button 
                className="btn btn-secondary btn-sm" 
                style={{ minWidth: '30px', padding: '2px 8px' }} 
                onClick={() => setActiveInvoice(null)}
              >
                ✕
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem', marginBottom: '15px', background: 'var(--bg-main)', padding: '10px', borderRadius: '6px' }}>
              <div><strong>رقم الفاتورة:</strong> #{activeInvoice.id}</div>
              <div><strong>التاريخ والوقت:</strong> {activeInvoice.timestamp}</div>
              <div><strong>طريقة الدفع:</strong> {activeInvoice.payment_type}</div>
              <div><strong>العميل:</strong> {activeInvoice.client_name || 'عميل نقدي'}</div>
            </div>

            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>الأصناف المباعة</h4>
            <div className="admin-table-wrapper" style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '15px' }}>
              <table className="admin-table" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    <th>اسم الصنف</th>
                    <th>الكمية</th>
                    <th>السعر</th>
                    <th>الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {activeInvoiceItems.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 'bold' }}>{item.name || `باركود ${item.product_barcode}`}</td>
                      <td>{item.quantity}</td>
                      <td>{(item.unit_price || 0).toFixed(2)} ج.م</td>
                      <td style={{ fontWeight: 'bold' }}>{(item.total_price || 0).toFixed(2)} ج.م</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '10px', gap: '5px', fontSize: '0.9rem' }}>
              <div><strong>الخصم:</strong> {(activeInvoice.discount || 0).toFixed(2)} ج.م</div>
              <div style={{ fontSize: '1.1rem', color: 'var(--accent-emerald)', fontWeight: 'bold' }}>
                <strong>الإجمالي الصافي:</strong> {(activeInvoice.total_amount || 0).toFixed(2)} ج.م
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '10px', marginTop: '20px' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  handleReprintSale(activeInvoice.id)
                }}
              >
                🖨️ طباعة الفاتورة كاملة
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setActiveInvoice(null)}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
