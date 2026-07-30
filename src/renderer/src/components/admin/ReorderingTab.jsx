import React, { useState, useEffect } from 'react'
import { executeQuery } from '../../lib/db'
import { parseLocaleDateString, getNowStr } from '../../lib/utils'
import {
  Cpu,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Copy,
  Check,
  Search,
  RefreshCw
} from 'lucide-react'

export default function ReorderingTab() {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [salesMap, setSalesMap] = useState({})
  const [targetDays, setTargetDays] = useState(15) // Cover next 15 days
  const [searchQuery, setSearchQuery] = useState('')
  const [copied, setCopied] = useState(false)

  // Fetch products and compute sales velocity
  const calculateReordering = async () => {
    setLoading(true)
    try {
      // 1. Fetch all products
      const allProducts = await executeQuery(
        'SELECT barcode, name, stock_qty as stock, reorder_limit, unit, cost_price as cost, price FROM products;'
      )

      // 2. Fetch shifts in the last 30 days
      const sinceDate = new Date()
      sinceDate.setDate(sinceDate.getDate() - 30)
      sinceDate.setHours(0, 0, 0, 0)

      const sinceStr = getNowStr(sinceDate)
      const matchingShifts = await executeQuery(`SELECT id FROM shifts WHERE start_time >= '${sinceStr}';`)
      const shiftIds = matchingShifts.map((sh) => sh.id)

      // 3. Fetch sales quantity for these shifts
      let salesData = []
      if (shiftIds.length > 0) {
        const query = `
          SELECT product_barcode, SUM(quantity) as total_qty
          FROM sale_items si
          JOIN sales s ON si.sale_id = s.id
          WHERE s.shift_id IN (${shiftIds.join(',')})
          GROUP BY product_barcode;
        `
        salesData = await executeQuery(query)
      }

      // Map sales
      const sMap = {}
      salesData.forEach((row) => {
        sMap[row.product_barcode] = row.total_qty || 0
      })

      setSalesMap(sMap)
      setProducts(allProducts)
    } catch (e) {
      console.error('Reordering calculator error:', e)
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    calculateReordering()
  }, [])

  // Process data based on targetDays
  const items = products.map((p) => {
    const sold30 = salesMap[p.barcode] || 0
    const dailyVelocity = sold30 / 30
    const neededForPeriod = dailyVelocity * targetDays
    
    let recommended = Math.ceil(neededForPeriod - p.stock)
    
    // Safety check: if product is below reorder limit, recommend ordering at least 2x limit
    if (p.stock <= p.reorder_limit) {
      const safetyAmt = p.reorder_limit > 0 ? p.reorder_limit * 2 : 5
      recommended = Math.max(recommended, safetyAmt)
    }

    recommended = Math.max(0, recommended)
    const estCost = recommended * (p.cost || 0)

    return {
      ...p,
      sold30,
      dailyVelocity,
      recommended,
      estCost
    }
  }).filter(item => {
    // Only show items that have a recommended order quantity > 0
    if (item.recommended <= 0) return false
    if (searchQuery.trim() === '') return true
    return item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.barcode.includes(searchQuery)
  })

  // Aggregates
  const totalItemsToOrder = items.length
  const totalEstimatedCost = items.reduce((sum, item) => sum + item.estCost, 0)

  const handleCopyOrder = () => {
    if (items.length === 0) return
    let text = `📋 طلبية شراء مقترحة - سوبر ماركت النجدي\n`
    text += `تاريخ الطلب: ${new Date().toLocaleDateString('ar-EG')}\n`
    text += `فترة التغطية المطلوبة: ${targetDays} يوم\n`
    text += `===================================\n`
    items.forEach((item, index) => {
      text += `${index + 1}. ${item.name} (${item.barcode})\n`
      text += `   - الكمية المقترحة: ${item.recommended} ${item.unit}\n`
      text += `   - المخزون الحالي: ${item.stock} ${item.unit}\n`
      text += `-----------------------------------\n`
    })
    text += `إجمالي الأصناف: ${totalItemsToOrder} صنف\n`
    text += `إجمالي التكلفة التقديرية: ${totalEstimatedCost.toFixed(2)} ج.م\n`

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportPDF = async () => {
    if (items.length === 0) return
    try {
      const mappedItems = items.map((item) => ({
        name: item.name,
        stock_qty: item.stock,
        min_limit: item.reorder_limit
      }))
      await window.api.generateShortagesPdf(mappedItems)
    } catch (e) {
      console.error('PDF export error:', e)
    }
  }

  const handlePrintInstant = async () => {
    if (items.length === 0) return
    try {
      const mappedItems = items.map((item) => ({
        name: item.name,
        stock_qty: item.stock,
        min_limit: item.reorder_limit
      }))
      await window.api.printShortagesToPrinter(mappedItems)
    } catch (e) {
      console.error('Instant print error:', e)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', direction: 'rtl' }}>
      
      {/* Header controls */}
      <div className="admin-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'rgba(5, 150, 105, 0.1)',
              color: 'var(--accent-emerald)',
              padding: '10px',
              borderRadius: '10px'
            }}>
              <Cpu size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>مساعد الطلبيات الذكي (AI Reorder)</h3>
              <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                يقوم النظام بتحليل حركة مبيعات البضائع خلال الـ 30 يوماً الماضية واقتراح الكميات المناسبة للشراء.
              </p>
            </div>
          </div>
          <button
            className="btn-refresh"
            onClick={calculateReordering}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg-input)',
              color: 'var(--text-main)',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            تحديث البيانات
          </button>
        </div>
      </div>

      {/* Adjust cover days */}
      <div className="admin-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>فترة التغطية المطلوبة للبضاعة:</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[7, 15, 30, 45].map((days) => (
              <button
                key={days}
                onClick={() => setTargetDays(days)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  border: '2px solid',
                  borderColor: targetDays === days ? 'var(--accent-emerald)' : 'var(--border)',
                  background: targetDays === days ? 'var(--accent-emerald)' : 'transparent',
                  color: targetDays === days ? '#fff' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all .2s'
                }}
              >
                📅 {days} يوم
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-amber)' }}>
            <ShoppingCart size={24} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">أصناف بحاجة للطلب</span>
            <span className="admin-stat-value">{totalItemsToOrder} صنف</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              مخزونها الحالي لا يكفي فترة التغطية
            </span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(5, 150, 105, 0.1)', color: 'var(--accent-emerald)' }}>
            <DollarSign size={24} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">التكلفة التقديرية للشراء</span>
            <span className="admin-stat-value" style={{ color: 'var(--accent-emerald)' }}>
              {totalEstimatedCost.toFixed(2)} ج.م
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              محسوبة بناءً على سعر تكلفة الجملة
            </span>
          </div>
        </div>
      </div>

      {/* Main content table */}
      <div className="admin-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          {/* Search bar */}
          <div style={{ position: 'relative', width: '300px' }}>
            <input
              type="text"
              placeholder="ابحث عن صنف بالاسم أو الباركود..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-input)',
                color: 'var(--text-main)',
                fontSize: '0.85rem'
              }}
            />
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handlePrintInstant}
              disabled={items.length === 0}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--accent-blue)',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem'
              }}
            >
              🖨️ طباعة فورية (حراري)
            </button>
            <button
              onClick={handleExportPDF}
              disabled={items.length === 0}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem'
              }}
            >
              📑 حفظ PDF
            </button>
            <button
              onClick={handleCopyOrder}
              disabled={items.length === 0}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                background: copied ? 'var(--accent-emerald)' : 'var(--accent-blue)',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                transition: 'background-color 0.2s'
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'تم نسخ الطلبية!' : 'نسخ قائمة الطلبية (واتساب)'}
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px' }}>
            لا توجد أصناف بحاجة للطلب حالياً. مخزونك ممتاز!
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '12px 8px' }}>الصنف</th>
                  <th style={{ padding: '12px 8px' }}>الرمز</th>
                  <th style={{ padding: '12px 8px' }}>المخزون الحالي</th>
                  <th style={{ padding: '12px 8px' }}>حد الطلب</th>
                  <th style={{ padding: '12px 8px' }}>المبيعات (30 يوم)</th>
                  <th style={{ padding: '12px 8px', color: 'var(--accent-emerald)' }}>الطلب المقترح</th>
                  <th style={{ padding: '12px 8px' }}>سعر التكلفة</th>
                  <th style={{ padding: '12px 8px' }}>التكلفة الكلية</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const isLow = row.stock <= row.reorder_limit
                  return (
                    <tr key={row.barcode} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 600 }}>{row.name}</td>
                      <td style={{ padding: '12px 8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{row.barcode}</td>
                      <td style={{ padding: '12px 8px', color: isLow ? 'var(--accent-rose)' : 'var(--text-main)', fontWeight: isLow ? 700 : 'normal' }}>
                        {row.stock} {row.unit}
                        {isLow && <span style={{ fontSize: '0.7rem', marginRight: '6px', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--accent-rose)', padding: '2px 6px', borderRadius: '4px' }}>ناقص</span>}
                      </td>
                      <td style={{ padding: '12px 8px' }}>{row.reorder_limit} {row.unit}</td>
                      <td style={{ padding: '12px 8px' }}>{row.sold30.toFixed(1)}</td>
                      <td style={{ padding: '12px 8px', fontWeight: 700, color: 'var(--accent-emerald)' }}>{row.recommended} {row.unit}</td>
                      <td style={{ padding: '12px 8px' }}>{(row.cost || 0).toFixed(2)} ج.م</td>
                      <td style={{ padding: '12px 8px', fontWeight: 700 }}>{row.estCost.toFixed(2)} ج.م</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
