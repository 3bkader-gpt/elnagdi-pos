import React, { useState } from 'react'
import { Search } from 'lucide-react'

/**
 * @param {object} props
 * @param {string} props.salesSearch
 * @param {function} props.setSalesSearch
 * @param {object[]} props.salesHistory
 * @param {object|null} props.selectedSale
 * @param {function} props.selectSaleForDetail
 * @param {object[]} props.selectedSaleItems
 * @param {function} props.handleReturnEntireSale
 * @param {function} props.handleReturnItem
 * @param {function} props.fetchSalesHistory
 */
export default function SalesTab({
  salesSearch,
  setSalesSearch,
  salesHistory,
  selectedSale,
  selectSaleForDetail,
  selectedSaleItems,
  handleReturnEntireSale,
  handleReturnItem,
  fetchSalesHistory,
  salesSortField,
  salesSortAsc,
  salesPage,
  salesTotalCount,
  itemsPerPage,
  handleReprintSale
}) {
  const handleSortClick = (field) => {
    const isAsc = salesSortField === field ? !salesSortAsc : true
    fetchSalesHistory(salesSearch, field, isAsc, 1)
  }

  const renderSortIndicator = (field) => {
    if (salesSortField !== field) return null
    return salesSortAsc ? ' ▲' : ' ▼'
  }
  const [activeReturnItem, setActiveReturnItem] = useState(null)
  const [returnQty, setReturnQty] = useState('')

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
      {/* Right Side: Sales List */}
      <div className="admin-card">
        <h3>سجل الفواتير الأخيرة</h3>
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px', marginBottom: '15px' }}>
          <input 
            type="text" 
            className="admin-search-input" 
            placeholder="ابحث برقم الفاتورة أو اسم العميل..." 
            value={salesSearch}
            onChange={(e) => {
              setSalesSearch(e.target.value)
              fetchSalesHistory(e.target.value, salesSortField, salesSortAsc, 1)
            }}
            style={{ margin: 0 }}
          />
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              setSalesSearch('')
              fetchSalesHistory('', salesSortField, salesSortAsc, 1)
            }}
          >
            تفريغ
          </button>
        </div>

        <div className="admin-table-wrapper" style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th onClick={() => handleSortClick('invoice_number')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  رقم الفاتورة{renderSortIndicator('invoice_number')}
                </th>
                <th onClick={() => handleSortClick('timestamp')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  التاريخ{renderSortIndicator('timestamp')}
                </th>
                <th>الكاشير</th>
                <th onClick={() => handleSortClick('client_name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  العميل{renderSortIndicator('client_name')}
                </th>
                <th onClick={() => handleSortClick('total_amount')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  الإجمالي{renderSortIndicator('total_amount')}
                </th>
                <th onClick={() => handleSortClick('items_count')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  عدد المواد{renderSortIndicator('items_count')}
                </th>
              </tr>
            </thead>
            <tbody>
              {salesHistory.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    لا توجد فواتير مطابقة للبحث.
                  </td>
                </tr>
              ) : (
                salesHistory.map((s) => (
                  <tr 
                    key={s.id} 
                    onClick={() => selectSaleForDetail(s)} 
                    style={{ 
                      cursor: 'pointer', 
                      backgroundColor: selectedSale?.id === s.id ? 'rgba(37, 99, 235, 0.08)' : 'inherit',
                      borderRight: selectedSale?.id === s.id ? '4px solid var(--accent-blue)' : 'none'
                    }}
                  >
                    <td style={{ fontWeight: 'bold' }}>#{((s.id - 1) % 10000) + 1}</td>
                    <td style={{ fontSize: '0.85rem' }}>{s.timestamp}</td>
                    <td>{s.username}</td>
                    <td>{s.client_name || 'عميل نقدي'}</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--accent-emerald)' }}>{(s.total_amount || 0).toFixed(2)} ج.م</td>
                    <td>{s.items_count} أصناف</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination-controls" style={{ marginTop: '15px' }}>
          <div className="pagination-info">
            عرض <strong>{salesHistory.length}</strong> من أصل <strong>{salesTotalCount}</strong> فاتورة.
          </div>
          <div className="pagination-buttons">
            <button 
              className="btn btn-sm btn-secondary" 
              disabled={salesPage === 1}
              onClick={() => fetchSalesHistory(salesSearch, salesSortField, salesSortAsc, salesPage - 1)}
            >
              السابق
            </button>
            <span style={{ alignSelf: 'center', padding: '0 10px', fontSize: '0.85rem' }}>
              صفحة {salesPage} من {Math.max(1, Math.ceil(salesTotalCount / itemsPerPage))}
            </span>
            <button 
              className="btn btn-sm btn-secondary" 
              disabled={salesPage >= Math.ceil(salesTotalCount / itemsPerPage)}
              onClick={() => fetchSalesHistory(salesSearch, salesSortField, salesSortAsc, salesPage + 1)}
            >
              التالي
            </button>
          </div>
        </div>
      </div>

      {/* Left Side: Invoice Detail & Return Handler */}
      <div className="admin-card" style={{ minHeight: '400px' }}>
        {selectedSale ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ margin: 0 }}>تفاصيل فاتورة رقم #{((selectedSale.id - 1) % 10000) + 1}</h3>
                {selectedSale.total_amount === 0 && (
                  <span style={{ backgroundColor: 'var(--accent-rose)', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', animation: 'pulse 2s infinite' }}>
                    🚨 مرتجعة بالكامل
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-primary"
                  style={{
                    padding: '4px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onClick={() => handleReprintSale(selectedSale.id)}
                >
                  🖨️ طباعة
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ 
                    color: 'var(--accent-rose)', 
                    borderColor: 'var(--accent-rose)', 
                    padding: '4px 10px', 
                    fontSize: '0.8rem',
                    opacity: selectedSale.total_amount === 0 ? 0.5 : 1,
                    cursor: selectedSale.total_amount === 0 ? 'not-allowed' : 'pointer'
                  }}
                  onClick={() => selectedSale.total_amount > 0 && handleReturnEntireSale(selectedSale.id)}
                  disabled={selectedSale.total_amount === 0}
                >
                  {selectedSale.total_amount === 0 ? '✓ تم إرجاع الفاتورة' : '⚠️ مرتجع كامل الفاتورة'}
                </button>
              </div>
            </div>

            <div style={{ fontSize: '0.9rem', marginBottom: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div><strong>تاريخ الفاتورة:</strong> {selectedSale.timestamp}</div>
              <div><strong>الكاشير:</strong> {selectedSale.username}</div>
              <div><strong>العميل:</strong> {selectedSale.client_name || 'عميل نقدي'}</div>
              <div><strong>الخصم الممنوح:</strong> {(selectedSale.discount || 0).toFixed(2)} ج.م</div>
              <div><strong>طريقة الدفع:</strong> {selectedSale.payment_type}</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {(selectedSale.original_amount || 0) > 0 && selectedSale.total_amount === 0 && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    الإجمالي الأصلي: {(selectedSale.original_amount || 0).toFixed(2)} ج.م
                  </span>
                )}
                <span style={{ fontSize: '1rem', color: selectedSale.total_amount === 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)', fontWeight: 'bold' }}>
                  <strong>الإجمالي الصافي:</strong> {(selectedSale.total_amount || 0).toFixed(2)} ج.م
                </span>
              </div>
            </div>

            <h4>أصناف الفاتورة</h4>
            <div className="admin-table-wrapper" style={{ marginTop: '10px' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>اسم الصنف</th>
                    <th>الكمية</th>
                    <th>السعر</th>
                    <th>الإجمالي</th>
                    <th style={{ width: '130px', textAlign: 'center' }}>المرتجع</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSaleItems.map((item) => {
                    const isFullyReturned = (item.returned_qty || 0) >= item.quantity;
                    const isPartiallyReturned = (item.returned_qty || 0) > 0 && !isFullyReturned;
                    const remainingQty = item.quantity - (item.returned_qty || 0);

                    return (
                      <tr key={item.id} style={{ opacity: isFullyReturned ? 0.6 : 1, backgroundColor: isFullyReturned ? 'rgba(239,68,68,0.02)' : 'inherit' }}>
                        <td style={{ fontWeight: '600' }}>
                          <span style={{ textDecoration: isFullyReturned ? 'line-through' : 'none' }}>
                            {item.name || `باركود ${item.product_barcode}`}
                          </span>
                          {isFullyReturned && (
                            <span style={{ color: 'var(--accent-rose)', marginRight: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                              [مرتجع كامل]
                            </span>
                          )}
                          {isPartiallyReturned && (
                            <span style={{ color: 'var(--accent-amber)', marginRight: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                              [مرتجع جزئي: {item.returned_qty}]
                            </span>
                          )}
                        </td>
                        <td>
                          {isPartiallyReturned ? (
                            <span>{remainingQty} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(من أصل {item.quantity})</span></span>
                          ) : isFullyReturned ? (
                            <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{item.quantity}</span>
                          ) : (
                            item.quantity
                          )}
                        </td>
                        <td>{(item.unit_price || 0).toFixed(2)} ج.م</td>
                        <td style={{ fontWeight: 'bold', textDecoration: isFullyReturned ? 'line-through' : 'none', color: isFullyReturned ? 'var(--text-muted)' : 'inherit' }}>
                          {(item.total_price || 0).toFixed(2)} ج.م
                        </td>
                        <td style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button 
                            className="btn btn-sm btn-secondary" 
                            style={{ 
                              color: isFullyReturned ? 'var(--text-muted)' : 'var(--accent-amber)', 
                              borderColor: isFullyReturned ? 'var(--border-color)' : 'var(--accent-amber)', 
                              fontSize: '0.75rem', 
                              padding: '2px 6px',
                              cursor: isFullyReturned ? 'not-allowed' : 'pointer'
                            }}
                            disabled={isFullyReturned}
                            onClick={() => {
                              const maxReturnable = item.quantity - (item.returned_qty || 0);
                              setActiveReturnItem(item)
                              setReturnQty(maxReturnable.toString())
                            }}
                          >
                            {isFullyReturned ? 'تم الإرجاع' : 'إرجاع كمية'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-muted)' }}>
            <Search size={48} style={{ marginBottom: '15px' }} />
            <p>اختر فاتورة من القائمة المجاورة لعرض التفاصيل وإجراء عمليات المرتجع.</p>
          </div>
        )}
      </div>

      {/* Modern React Modal for Return Quantity */}
      {activeReturnItem && (
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
            width: '400px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            direction: 'rtl'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', color: 'var(--text-main)' }}>
              ↩️ إرجاع كمية من الصنف
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              الصنف: <strong>{activeReturnItem.name || activeReturnItem.product_barcode}</strong>
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                الكمية المراد إرجاعها (الحد الأقصى المتبقي: {activeReturnItem.quantity - (activeReturnItem.returned_qty || 0)}):
              </label>
              <input
                type="number"
                step="any"
                min="0.001"
                max={activeReturnItem.quantity - (activeReturnItem.returned_qty || 0)}
                value={returnQty}
                onChange={(e) => setReturnQty(e.target.value)}
                style={{
                  padding: '10px',
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

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                onClick={() => {
                  const qtyVal = parseFloat(returnQty);
                  const maxVal = activeReturnItem.quantity - (activeReturnItem.returned_qty || 0);
                  if (isNaN(qtyVal) || qtyVal <= 0 || qtyVal > maxVal) {
                    setReturnErrorMsg(`الرجاء إدخال كمية صحيحة أكبر من 0 ولا تزيد عن ${maxVal}`);
                    return;
                  }
                  handleReturnItem(activeReturnItem, qtyVal);
                  setActiveReturnItem(null);
                }}
              >
                تأكيد المرتجع
              </button>
              <button
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                onClick={() => setActiveReturnItem(null)}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
