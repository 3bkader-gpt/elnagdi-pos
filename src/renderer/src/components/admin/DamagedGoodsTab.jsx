import React, { useState, useEffect } from 'react'
import { executeQuery } from '../../lib/db'
import { AlertTriangle, Trash2, Plus, Calendar, DollarSign, Layers, Tag, X } from 'lucide-react'

export default function DamagedGoodsTab({
  damagedGoodsList,
  showAddDamagedModal,
  setShowAddDamagedModal,
  newDamagedForm,
  setNewDamagedForm,
  fetchDamagedGoods,
  handleAddDamaged,
  handleDeleteDamaged
}) {
  const [resolvedProductName, setResolvedProductName] = useState('')
  const [resolvedProductStock, setResolvedProductStock] = useState(null)

  // Resolve product info as barcode is typed/scanned
  useEffect(() => {
    let active = true
    const resolveProduct = async () => {
      const cleanBarcode = newDamagedForm.barcode ? newDamagedForm.barcode.trim() : ''
      if (!cleanBarcode) {
        if (active) {
          setResolvedProductName('')
          setResolvedProductStock(null)
        }
        return
      }
      try {
        const res = await executeQuery(
          `SELECT name, stock_qty FROM products WHERE barcode = '${cleanBarcode}';`
        )
        if (active) {
          if (res && res.length > 0) {
            setResolvedProductName(res[0].name)
            setResolvedProductStock(res[0].stock_qty)
          } else {
            setResolvedProductName('⚠️ الصنف غير موجود')
            setResolvedProductStock(null)
          }
        }
      } catch (e) {
        if (active) {
          console.error(e)
        }
      }
    }
    resolveProduct()
    return () => {
      active = false
    }
  }, [newDamagedForm.barcode])

  // Compute stats
  const totalItems = damagedGoodsList.reduce((sum, item) => sum + item.quantity, 0)
  const totalLoss = damagedGoodsList.reduce((sum, item) => sum + item.quantity * item.cost_price, 0)

  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      document.getElementById('damaged-quantity-input')?.focus()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', direction: 'rtl' }}>
      
      {/* Header section */}
      <div className="admin-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'rgba(220, 38, 38, 0.1)',
              color: 'var(--accent-rose)',
              padding: '10px',
              borderRadius: '10px'
            }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>إدارة الهوالك وتالف البضائع</h3>
              <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                سجل السلع التالفة أو المنتهية الصلاحية لخصمها تلقائياً من المخزن والربح الصافي للمحل.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddDamagedModal(true)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--accent-rose)',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 10px rgba(220, 38, 38, 0.2)'
            }}
          >
            <Plus size={18} />
            تسجيل هالك جديد
          </button>
        </div>
      </div>

      {/* KPI stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-amber)' }}>
            <Layers size={24} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">إجمالي كمية الهوالك</span>
            <span className="admin-stat-value">{totalItems.toFixed(2)} وحدة</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              تم خصمها من رصيد المخزن الفعلي
            </span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(220, 38, 38, 0.1)', color: 'var(--accent-rose)' }}>
            <DollarSign size={24} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">قيمة خسائر الهوالك</span>
            <span className="admin-stat-value" style={{ color: 'var(--accent-rose)' }}>
              {totalLoss.toFixed(2)} ج.م
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              مخصومة مباشرة من صافي الأرباح
            </span>
          </div>
        </div>
      </div>

      {/* Table section */}
      <div className="admin-card" style={{ padding: '20px' }}>
        <h4 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 700 }}>سجل العمليات التاريخي للهوالك</h4>
        
        {damagedGoodsList.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px' }}>
            لا يوجد أي سجل للهوالك حالياً.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '12px 8px' }}>الصنف</th>
                  <th style={{ padding: '12px 8px' }}>الرمز</th>
                  <th style={{ padding: '12px 8px' }}>الكمية</th>
                  <th style={{ padding: '12px 8px' }}>السبب</th>
                  <th style={{ padding: '12px 8px' }}>تكلفة الوحدة</th>
                  <th style={{ padding: '12px 8px' }}>إجمالي الخسارة</th>
                  <th style={{ padding: '12px 8px' }}>تاريخ التسجيل</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center' }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {damagedGoodsList.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{item.product_name}</td>
                    <td style={{ padding: '12px 8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.product_barcode}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 700, color: 'var(--accent-rose)' }}>{item.quantity} {item.unit}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{
                        background: item.reason === 'انتهاء صلاحية' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                        color: item.reason === 'انتهاء صلاحية' ? 'var(--accent-amber)' : 'var(--accent-rose)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        {item.reason}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px' }}>{item.cost_price.toFixed(2)} ج.م</td>
                    <td style={{ padding: '12px 8px', fontWeight: 700 }}>{(item.quantity * item.cost_price).toFixed(2)} ج.م</td>
                    <td style={{ padding: '12px 8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        {item.timestamp}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDeleteDamaged(item)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent-rose)',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px'
                        }}
                        title="حذف وإلغاء تسجيل الهالك"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Damaged Goods Modal */}
      {showAddDamagedModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="admin-card" style={{
            width: '420px',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-rose)' }}>تسجيل بضاعة تالفة / هالك</h3>
              <button
                onClick={() => {
                  setShowAddDamagedModal(false)
                  setNewDamagedForm({ barcode: '', quantity: '', reason: 'انتهاء صلاحية' })
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddDamaged} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Barcode input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>باركود الصنف:</label>
                <input
                  type="text"
                  required
                  value={newDamagedForm.barcode}
                  onChange={(e) => setNewDamagedForm({ ...newDamagedForm, barcode: e.target.value })}
                  onKeyDown={handleBarcodeKeyDown}
                  placeholder="مرر الباركود أو اكتبه هنا..."
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem'
                  }}
                  autoFocus
                />
                
                {/* Dynamically resolved product info */}
                {newDamagedForm.barcode && (
                  <div style={{
                    marginTop: '2px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: resolvedProductName.startsWith('⚠️') ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span>{resolvedProductName}</span>
                    {resolvedProductStock !== null && (
                      <span style={{ color: 'var(--text-secondary)' }}>
                        المخزون الحالي: {resolvedProductStock}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Quantity input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>الكمية التالفة:</label>
                <input
                  id="damaged-quantity-input"
                  type="number"
                  step="any"
                  required
                  value={newDamagedForm.quantity}
                  onChange={(e) => setNewDamagedForm({ ...newDamagedForm, quantity: e.target.value })}
                  placeholder="أدخل عدد الوحدات أو الوزن..."
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Reason selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>سبب التلف:</label>
                <select
                  value={newDamagedForm.reason}
                  onChange={(e) => setNewDamagedForm({ ...newDamagedForm, reason: e.target.value })}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="انتهاء صلاحية">انتهاء صلاحية</option>
                  <option value="تلف / كسر">تلف / كسر</option>
                  <option value="عيب مصنعي">عيب مصنعي</option>
                  <option value="سرقة / فقدان">سرقة / فقدان</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <button
                type="submit"
                style={{
                  marginTop: '10px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--accent-rose)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
              >
                تأكيد وتسجيل الهالك
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}
