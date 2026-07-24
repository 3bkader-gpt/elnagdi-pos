import React from 'react'

/**
 * @param {object} props
 * @param {string} props.adminSearch
 * @param {React.RefObject} props.adminSearchInputRef
 * @param {object[]} props.adminProducts
 * @param {number} props.adminTotalCount
 * @param {number} props.adminPage
 * @param {number} props.itemsPerPage
 * @param {function} props.fetchInventoryPage
 * @param {function} props.setAdminSearch
 * @param {function} props.setShowAddModal
 * @param {function} props.setEditProduct
 * @param {function} props.setShowEditModal
 * @param {function} props.handleDeleteProduct
 */
export default function InventoryTab({
  adminSearch,
  adminSearchInputRef,
  adminProducts,
  adminTotalCount,
  adminPage,
  itemsPerPage,
  fetchInventoryPage,
  setAdminSearch,
  setShowAddModal,
  setEditProduct,
  setShowEditModal,
  handleDeleteProduct,
  productsSortField,
  productsSortAsc
}) {
  const handleSortClick = (field) => {
    const isAsc = productsSortField === field ? !productsSortAsc : true
    fetchInventoryPage(adminPage, adminSearch, field, isAsc)
  }

  const renderSortIndicator = (field) => {
    if (productsSortField !== field) return null
    return productsSortAsc ? ' ▲' : ' ▼'
  }
  return (
    <div className="admin-card">
      <form 
        onSubmit={(e) => {
          e.preventDefault()
          fetchInventoryPage(1, adminSearch)
        }}
        className="inventory-actions-row"
      >
        <div style={{ display: 'flex', gap: '10px', flex: 1, maxWidth: '500px' }}>
          <input 
            type="text" 
            ref={adminSearchInputRef}
            onFocus={(e) => e.target.select()}
            className="admin-search-input" 
            placeholder="ابحث بالاسم أو الباركود... (اضغط Enter)" 
            value={adminSearch}
            onChange={(e) => setAdminSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-secondary" style={{ padding: '8px 16px' }}>
            🔍 بحث
          </button>
        </div>
        <button 
          type="button"
          className="btn btn-primary" 
          style={{ padding: '8px 16px', fontSize: '0.9rem' }}
          onClick={() => setShowAddModal(true)}
        >
          ➕ إضافة صنف جديد للمخزن
        </button>
      </form>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th onClick={() => handleSortClick('barcode')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                الباركود{renderSortIndicator('barcode')}
              </th>
              <th onClick={() => handleSortClick('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                اسم الصنف{renderSortIndicator('name')}
              </th>
              <th onClick={() => handleSortClick('cost_price')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                سعر التكلفة{renderSortIndicator('cost_price')}
              </th>
              <th onClick={() => handleSortClick('retail_price')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                سعر البيع قطاعي{renderSortIndicator('retail_price')}
              </th>
              <th onClick={() => handleSortClick('wholesale_price')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                سعر الجملة{renderSortIndicator('wholesale_price')}
              </th>
              <th onClick={() => handleSortClick('stock_qty')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                الكمية المتاحة{renderSortIndicator('stock_qty')}
              </th>
              <th onClick={() => handleSortClick('reorder_limit')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                حد الطلب{renderSortIndicator('reorder_limit')}
              </th>
              <th>الوحدة</th>
              <th style={{ textAlign: 'center' }}>العمليات</th>
            </tr>
          </thead>
          <tbody>
            {adminProducts.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  لا توجد نتائج مطابقة لبحثك.
                </td>
              </tr>
            ) : (
              adminProducts.map((p) => (
                <tr key={p.barcode}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{p.barcode}</td>
                  <td style={{ fontWeight: '600' }}>{p.name}</td>
                  <td>{p.cost_price?.toFixed(2) || '0.00'} ج.م</td>
                  <td style={{ color: 'var(--accent-blue)', fontWeight: 'bold' }}>{p.retail_price?.toFixed(2) || '0.00'} ج.م</td>
                  <td>{p.wholesale_price?.toFixed(2) || '0.00'} ج.م</td>
                  <td style={{ fontWeight: 'bold', color: p.stock_qty <= p.reorder_limit ? 'var(--accent-rose)' : 'inherit' }}>
                    {p.stock_qty} {p.unit}
                  </td>
                  <td>{p.reorder_limit}</td>
                  <td>{p.unit}</td>
                  <td className="actions" style={{ justifyContent: 'center' }}>
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => {
                        setEditProduct(p)
                        setShowEditModal(true)
                      }}
                    >
                      ✏️ تعديل
                    </button>
                    <button 
                      className="btn btn-sm btn-secondary"
                      style={{ color: 'var(--accent-rose)', borderColor: 'var(--accent-rose)' }}
                      onClick={() => handleDeleteProduct(p.barcode)}
                    >
                      🗑️ حذف
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-controls">
        <div className="pagination-info">
          عرض <strong>{adminProducts.length}</strong> من أصل <strong>{adminTotalCount}</strong> منتج مطبق.
        </div>
        <div className="pagination-buttons">
          <button 
            className="btn btn-sm btn-secondary" 
            disabled={adminPage === 1}
            onClick={() => fetchInventoryPage(adminPage - 1, adminSearch)}
          >
            السابق
          </button>
          <span style={{ alignSelf: 'center', padding: '0 10px', fontSize: '0.85rem' }}>
            صفحة {adminPage} من {Math.max(1, Math.ceil(adminTotalCount / itemsPerPage))}
          </span>
          <button 
            className="btn btn-sm btn-secondary" 
            disabled={adminPage >= Math.ceil(adminTotalCount / itemsPerPage)}
            onClick={() => fetchInventoryPage(adminPage + 1, adminSearch)}
          >
            التالي
          </button>
        </div>
      </div>
    </div>
  )
}
