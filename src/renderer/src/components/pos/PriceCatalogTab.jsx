import React, { useState, useEffect, useMemo } from 'react'
import { Search, Tag, Grid, List, Printer, Share2, Filter, RefreshCw, CheckCircle, Award } from 'lucide-react'
import { executeQuery } from '../../lib/db'

export default function PriceCatalogTab({ onAddToCart }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list' | 'menu'
  const [copiedNotification, setCopiedNotification] = useState(false)
  const [priceFilter, setPriceFilter] = useState('ALL') // 'ALL' | 'UNDER_10' | '10_TO_50' | 'ABOVE_50'

  // Fetch all active products
  const fetchCatalogProducts = async () => {
    setLoading(true)
    try {
      const rows = await executeQuery(`
        SELECT barcode, name, retail_price, cost_price, category, unit, stock_qty 
        FROM products 
        ORDER BY CASE WHEN category IS NULL OR category = '' THEN 1 ELSE 0 END, category, name;
      `)
      setProducts(rows || [])
    } catch (err) {
      console.error('Failed to load catalog products:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCatalogProducts()
  }, [])

  // Extract list of categories with counts
  const categoriesList = useMemo(() => {
    const map = {}
    products.forEach(p => {
      const cat = p.category && p.category.trim() ? p.category.trim() : 'غير مصنف'
      map[cat] = (map[cat] || 0) + 1
    })
    const list = Object.keys(map).map(catName => ({
      name: catName,
      count: map[catName]
    }))
    list.sort((a, b) => b.count - a.count)
    return list
  }, [products])

  // Category Icon Mapping Helper
  const getCategoryIcon = (catName) => {
    if (catName.includes('حلويات')) return '🍫'
    if (catName.includes('عصائر') || catName.includes('ألبان')) return '🧃'
    if (catName.includes('معلبات') || catName.includes('جبن')) return '🥫'
    if (catName.includes('منظفات') || catName.includes('ورقيات')) return '🧼'
    if (catName.includes('مياه') || catName.includes('غازية')) return '🥤'
    if (catName.includes('زيوت') || catName.includes('سمنات')) return '🧈'
    if (catName.includes('بقوليات')) return '🌾'
    if (catName.includes('مجمدات')) return '🧊'
    if (catName.includes('فودز')) return '🍔'
    return '📦'
  }

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Category filter
      const cat = p.category && p.category.trim() ? p.category.trim() : 'غير مصنف'
      if (selectedCategory !== 'ALL' && cat !== selectedCategory) {
        return false
      }

      // Price filter
      const price = parseFloat(p.retail_price) || 0
      if (priceFilter === 'UNDER_10' && price > 10) return false
      if (priceFilter === '10_TO_50' && (price < 10 || price > 50)) return false
      if (priceFilter === 'ABOVE_50' && price < 50) return false

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const nameMatch = (p.name || '').toLowerCase().includes(q)
        const barcodeMatch = (p.barcode || '').includes(q)
        const catMatch = cat.toLowerCase().includes(q)
        return nameMatch || barcodeMatch || catMatch
      }

      return true
    })
  }, [products, selectedCategory, searchQuery, priceFilter])

  // Copy WhatsApp Text Price List
  const handleCopyWhatsAppList = () => {
    if (filteredProducts.length === 0) return

    let text = `🛍️ *قائمة أسعار سوبر ماركت النجدي* 🏪\n`
    text += `📅 بتاريخ: ${new Date().toLocaleDateString('ar-EG')}\n`
    text += `📞 للطلبات والتوصيل: 01023100767\n`
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`

    // Group by category
    const grouped = {}
    filteredProducts.forEach(p => {
      const cat = p.category && p.category.trim() ? p.category.trim() : 'متنوعات'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(p)
    })

    Object.keys(grouped).forEach(catName => {
      text += `*${getCategoryIcon(catName)} ${catName}*\n`
      grouped[catName].slice(0, 30).forEach(p => {
        text += `• ${p.name}: *${parseFloat(p.retail_price).toFixed(2)} ج.م*\n`
      })
      text += `\n`
    })

    text += `━━━━━━━━━━━━━━━━━━━━\n`
    text += `🛒 أهلاً بكم في أي وقت!`

    navigator.clipboard.writeText(text)
    setCopiedNotification(true)
    setTimeout(() => setCopiedNotification(false), 3000)
  }

  // Print Price Catalog Sheet
  const handlePrintCatalog = () => {
    if (filteredProducts.length === 0) return

    const grouped = {}
    filteredProducts.forEach(p => {
      const cat = p.category && p.category.trim() ? p.category.trim() : 'متنوعات'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(p)
    })

    let sectionsHtml = ''
    Object.keys(grouped).forEach(catName => {
      sectionsHtml += `
        <div class="category-block">
          <div class="category-header">
            <span>${getCategoryIcon(catName)}</span>
            <h2>${catName}</h2>
          </div>
          <div class="items-grid">
            ${grouped[catName].map(p => `
              <div class="item-row">
                <span class="item-name">${p.name}</span>
                <span class="dots"></span>
                <span class="item-price">${parseFloat(p.retail_price).toFixed(2)} ج.م</span>
              </div>
            `).join('')}
          </div>
        </div>
      `
    })

    const printHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>ليستة أسعار سوبرماركت النجدي</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
          body {
            font-family: 'Cairo', sans-serif;
            margin: 0;
            padding: 20px;
            color: #1e293b;
            background: #ffffff;
          }
          .header {
            text-align: center;
            border-bottom: 3px double #2563eb;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 26px;
            color: #1e3a8a;
          }
          .header p {
            margin: 4px 0 0 0;
            font-size: 13px;
            color: #64748b;
          }
          .category-block {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          .category-header {
            background: #f1f5f9;
            border-right: 4px solid #2563eb;
            padding: 6px 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            border-radius: 4px;
            margin-bottom: 10px;
          }
          .category-header h2 {
            margin: 0;
            font-size: 16px;
            color: #0f172a;
          }
          .items-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px 25px;
          }
          .item-row {
            display: flex;
            align-items: baseline;
            font-size: 13px;
          }
          .item-name {
            font-weight: 600;
            white-space: nowrap;
          }
          .dots {
            flex: 1;
            border-bottom: 1px dotted #94a3b8;
            margin: 0 8px;
          }
          .item-price {
            font-weight: 800;
            color: #059669;
            white-space: nowrap;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏪 سوبر ماركت النجدي</h1>
          <p>قائمة الأسعار المحدثة • خدمة الدليفري والطلبات: 01023100767</p>
        </div>
        ${sectionsHtml}
        <div class="footer">
          تم التوليد تلقائياً بواسطة نظام سوبرماركت النجدي POS • ${new Date().toLocaleDateString('ar-EG')}
        </div>
      </body>
      </html>
    `

    const printWin = window.open('', '_blank')
    printWin.document.write(printHtml)
    printWin.document.close()
    setTimeout(() => {
      printWin.print()
    }, 500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '15px', padding: '15px' }}>
      
      {/* Top Controls Header Bar */}
      <div className="admin-card" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '10px', 
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}>
              <Tag size={22} style={{ color: '#fff' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>📋 قائمة الأسعار الرقمية التفاعلية</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                إجمالي المعروض: <strong style={{ color: 'var(--accent-blue)' }}>{filteredProducts.length}</strong> صنف من أصل {products.length}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-secondary" 
              onClick={handleCopyWhatsAppList}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <Share2 size={16} />
              {copiedNotification ? '✅ تم النسخ للواتساب!' : '📱 نسخ للواتساب'}
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handlePrintCatalog}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <Printer size={16} />
              🖨️ طباعة ليستة PDF
            </button>
          </div>

        </div>

        {/* Search & Price Filter Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '12px', alignItems: 'center' }}>
          
          {/* Search bar */}
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              className="form-input"
              placeholder="ابحث باسم الصنف، الباركود، أو القسم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingRight: '38px', height: '40px', fontSize: '0.9rem' }}
            />
          </div>

          {/* Price Range Selector */}
          <select 
            className="form-input" 
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            style={{ height: '40px', fontSize: '0.85rem' }}
          >
            <option value="ALL">💰 كل نطاقات الأسعار</option>
            <option value="UNDER_10">🟢 أقل من 10 ج.م</option>
            <option value="10_TO_50">🟡 من 10 إلى 50 ج.م</option>
            <option value="ABOVE_50">🔴 أكبر من 50 ج.م</option>
          </select>

          {/* View mode toggle buttons */}
          <div style={{ display: 'flex', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '3px' }}>
            <button 
              type="button"
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : ''}`}
              style={{ padding: '6px 10px', borderRadius: '6px', background: viewMode === 'grid' ? 'var(--accent-blue)' : 'transparent', border: 'none', cursor: 'pointer' }}
              onClick={() => setViewMode('grid')}
              title="عرض كروت فاخرة"
            >
              <Grid size={16} />
            </button>
            <button 
              type="button"
              className={`btn btn-sm ${viewMode === 'menu' ? 'btn-primary' : ''}`}
              style={{ padding: '6px 10px', borderRadius: '6px', background: viewMode === 'menu' ? 'var(--accent-blue)' : 'transparent', border: 'none', cursor: 'pointer' }}
              onClick={() => setViewMode('menu')}
              title="عرض منيو رايق"
            >
              <List size={16} />
            </button>
          </div>

        </div>

        {/* Categories Bar */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
          <button 
            type="button"
            className={`btn btn-sm ${selectedCategory === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              borderRadius: '20px', 
              padding: '4px 14px', 
              fontSize: '0.8rem', 
              whiteSpace: 'nowrap',
              backgroundColor: selectedCategory === 'ALL' ? 'var(--accent-blue)' : 'transparent'
            }}
            onClick={() => setSelectedCategory('ALL')}
          >
            🚀 جميع الأقسام ({products.length})
          </button>

          {categoriesList.map(cat => (
            <button 
              key={cat.name}
              type="button"
              className={`btn btn-sm ${selectedCategory === cat.name ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                borderRadius: '20px', 
                padding: '4px 14px', 
                fontSize: '0.8rem', 
                whiteSpace: 'nowrap',
                backgroundColor: selectedCategory === cat.name ? 'var(--accent-blue)' : 'transparent'
              }}
              onClick={() => setSelectedCategory(cat.name)}
            >
              {getCategoryIcon(cat.name)} {cat.name} ({cat.count})
            </button>
          ))}
        </div>

      </div>

      {/* Main Catalog View Container */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
            <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
            <p>جاري تحميل قائمة الأسعار...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="admin-card" style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
            <Tag size={48} style={{ opacity: 0.3, marginBottom: '10px' }} />
            <h3>لا توجد أصناف مطابقة للفلتر أو البحث الحالية</h3>
            <p style={{ fontSize: '0.85rem' }}>جرب تغيير القسم أو تصفية البحث فوق</p>
          </div>
        ) : viewMode === 'grid' ? (
          
          /* GRID VIEW */
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
            gap: '12px' 
          }}>
            {filteredProducts.map(p => (
              <div 
                key={p.barcode}
                className="admin-card"
                style={{ 
                  padding: '14px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  gap: '10px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.borderColor = 'var(--accent-blue)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = 'var(--border-color)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      background: 'rgba(37, 99, 235, 0.1)', 
                      color: 'var(--accent-blue)', 
                      padding: '2px 8px', 
                      borderRadius: '12px',
                      fontWeight: '600'
                    }}>
                      {getCategoryIcon(p.category || '')} {p.category || 'متنوع'}
                    </span>
                    {p.unit && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {p.unit}
                      </span>
                    )}
                  </div>

                  <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-main)', lineHeight: '1.3' }}>
                    {p.name}
                  </h4>

                  <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                    #{p.barcode}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '10px', marginTop: '4px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>سعر البيع:</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-emerald)' }}>
                      {parseFloat(p.retail_price).toFixed(2)} <span style={{ fontSize: '0.75rem' }}>ج.م</span>
                    </span>
                  </div>

                  {onAddToCart && (
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => onAddToCart(p)}
                      style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px' }}
                      title="إضافة للفاتورة"
                    >
                      ➕ للفاتورة
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

        ) : (

          /* MENU VIEW (أنطولوجيا المنيو) */
          <div className="admin-card" style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {Object.entries(
                filteredProducts.reduce((acc, p) => {
                  const cat = p.category && p.category.trim() ? p.category.trim() : 'متنوعات'
                  if (!acc[cat]) acc[cat] = []
                  acc[cat].push(p)
                  return acc
                }, {})
              ).map(([catName, catItems]) => (
                <div key={catName} style={{ background: 'var(--bg-main)', padding: '15px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ margin: '0 0 12px 0', borderBottom: '2px solid var(--accent-blue)', paddingBottom: '6px', fontSize: '1rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{getCategoryIcon(catName)}</span>
                    {catName}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: 'auto' }}>({catItems.length})</span>
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {catItems.map(p => (
                      <div key={p.barcode} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{p.name}</span>
                        <span style={{ flex: 1, borderBottom: '1px dotted var(--border-color)', margin: '0 8px' }}></span>
                        <span style={{ fontWeight: '800', color: 'var(--accent-emerald)', whiteSpace: 'nowrap' }}>
                          {parseFloat(p.retail_price).toFixed(2)} ج.م
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        )}
      </div>

    </div>
  )
}
