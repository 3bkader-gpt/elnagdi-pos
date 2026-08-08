import React, { useState, useMemo } from 'react'
import { Smartphone, X, Search, ShoppingBag, Plus, Minus, Send, Check } from 'lucide-react'

export default function CustomerMobilePreviewModal({ products = [], onClose }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [cart, setCart] = useState({}) // { barcode: quantity }

  // Extract categories
  const categoriesList = useMemo(() => {
    const map = {}
    products.forEach(p => {
      const cat = p.category && p.category.trim() ? p.category.trim() : 'غير مصنف'
      map[cat] = (map[cat] || 0) + 1
    })
    return Object.keys(map).map(c => ({ name: c, count: map[c] }))
  }, [products])

  const getCategoryIcon = (catName) => {
    if (catName.includes('حلويات')) return '🍫'
    if (catName.includes('عصائر') || catName.includes('ألبان')) return '🧃'
    if (catName.includes('معلبات') || catName.includes('جبن')) return '🥫'
    if (catName.includes('منظفات')) return '🧼'
    if (catName.includes('مياه')) return '🥤'
    if (catName.includes('زيوت')) return '🧈'
    return '📦'
  }

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const cat = p.category && p.category.trim() ? p.category.trim() : 'غير مصنف'
      if (selectedCategory !== 'ALL' && cat !== selectedCategory) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        return (p.name || '').toLowerCase().includes(q) || (p.barcode || '').includes(q)
      }
      return true
    })
  }, [products, selectedCategory, searchQuery])

  // Cart operations
  const updateCartQty = (barcode, delta) => {
    setCart(prev => {
      const curr = prev[barcode] || 0
      const next = curr + delta
      if (next <= 0) {
        const copy = { ...prev }
        delete copy[barcode]
        return copy
      }
      return { ...prev, [barcode]: next }
    })
  }

  // Calculate total count & price
  const cartSummary = useMemo(() => {
    let count = 0
    let total = 0
    Object.keys(cart).forEach(bc => {
      const qty = cart[bc]
      const prod = products.find(p => p.barcode === bc)
      if (prod) {
        count += qty
        total += (parseFloat(prod.retail_price) || 0) * qty
      }
    })
    return { count, total }
  }, [cart, products])

  // Send WhatsApp Order
  const handleSendWhatsAppOrder = () => {
    if (cartSummary.count === 0) return

    let msg = `🛍️ *طلب دليفري جديد من المنيو الرقمي* 🏪\n`
    msg += `--------------------------------\n`

    Object.keys(cart).forEach(bc => {
      const qty = cart[bc]
      const prod = products.find(p => p.barcode === bc)
      if (prod) {
        msg += `• ${qty} × ${prod.name} (${parseFloat(prod.retail_price).toFixed(2)} ج.م)\n`
      }
    })

    msg += `--------------------------------\n`
    msg += `💰 *الإجمالي المتوقع:* ${cartSummary.total.toFixed(2)} ج.م\n`
    msg += `📍 *العنوان والاسم:* (يرجى كتابة عنوانك هنا)`

    const targetPhone = '201023100767'
    const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`
    window.open(waUrl, '_blank')
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '20px'
    }}>
      
      {/* Container holding Phone Frame */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '360px', alignItems: 'center', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>
            <Smartphone size={20} style={{ color: 'var(--accent-emerald)' }} />
            📱 معاينة قائمة الزبون على الموبايل
          </div>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose}
            style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
          >
            إغلاق ✖
          </button>
        </div>

        {/* Smartphone Device Frame */}
        <div style={{
          width: '360px',
          height: '700px',
          backgroundColor: '#0f172a',
          borderRadius: '40px',
          border: '10px solid #1e293b',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}>
          
          {/* Phone Top Notch Bar */}
          <div style={{
            height: '28px',
            backgroundColor: '#090d16',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            fontSize: '0.7rem',
            color: '#94a3b8',
            padding: '0 15px'
          }}>
            <div style={{ width: '80px', height: '14px', backgroundColor: '#1e293b', borderRadius: '10px', position: 'absolute' }}></div>
            <span style={{ marginRight: 'auto', fontSize: '0.65rem' }}>9:41</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>📶 🔋</span>
          </div>

          {/* App Mobile Header */}
          <div style={{
            backgroundColor: '#1e293b',
            padding: '12px 15px',
            borderBottom: '1px solid #334155',
            color: '#fff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>🏪</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 'bold' }}>سوبر ماركت النجدي</h4>
                <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  🟢 متاح الآن • توصيل دليفري سريح
                </span>
              </div>
            </div>

            {/* Search Input */}
            <div style={{ marginTop: '10px', position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text"
                placeholder="ابحث عن أصناف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '20px',
                  padding: '6px 30px 6px 10px',
                  color: '#fff',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Categories Slider */}
          <div style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            padding: '8px 10px',
            backgroundColor: '#0f172a',
            borderBottom: '1px solid #1e293b'
          }}>
            <button 
              onClick={() => setSelectedCategory('ALL')}
              style={{
                backgroundColor: selectedCategory === 'ALL' ? '#2563eb' : '#1e293b',
                color: '#fff',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '15px',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              🚀 الكل
            </button>
            {categoriesList.map(cat => (
              <button 
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                style={{
                  backgroundColor: selectedCategory === cat.name ? '#2563eb' : '#1e293b',
                  color: '#fff',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '15px',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
              >
                {getCategoryIcon(cat.name)} {cat.name}
              </button>
            ))}
          </div>

          {/* Products List Scroll Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px',
            backgroundColor: '#090d16',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {filteredProducts.slice(0, 50).map(p => {
              const qtyInCart = cart[p.barcode] || 0
              return (
                <div 
                  key={p.barcode}
                  style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    padding: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid #334155'
                  }}
                >
                  <div style={{ flex: 1, marginLeft: '8px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#f8fafc' }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold', marginTop: '2px' }}>
                      {parseFloat(p.retail_price).toFixed(2)} ج.م {p.unit ? `(${p.unit})` : ''}
                    </div>
                  </div>

                  {/* Quantity Controller */}
                  {qtyInCart > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#0f172a', padding: '2px 6px', borderRadius: '15px', border: '1px solid #2563eb' }}>
                      <button 
                        onClick={() => updateCartQty(p.barcode, -1)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff', minWidth: '16px', textAlign: 'center' }}>
                        {qtyInCart}
                      </span>
                      <button 
                        onClick={() => updateCartQty(p.barcode, 1)}
                        style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: '2px' }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => updateCartQty(p.barcode, 1)}
                      style={{
                        backgroundColor: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '5px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      ➕ أضف
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Floating Bottom Drawer Cart Bar */}
          {cartSummary.count > 0 && (
            <div style={{
              backgroundColor: '#1e293b',
              borderTop: '2px solid #2563eb',
              padding: '10px 15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 -10px 25px rgba(0,0,0,0.5)'
            }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{cartSummary.count} أصناف مختارة</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#10b981' }}>
                  {cartSummary.total.toFixed(2)} ج.م
                </div>
              </div>

              <button 
                onClick={handleSendWhatsAppOrder}
                style={{
                  backgroundColor: '#059669',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '8px 16px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.4)'
                }}
              >
                <Send size={14} />
                طلب بالواتساب
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
