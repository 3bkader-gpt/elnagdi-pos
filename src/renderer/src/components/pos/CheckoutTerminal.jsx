import React from 'react'
import {
  Trash2, DollarSign, CreditCard, BookOpen, CheckCircle, Key, Search, AlertTriangle
} from 'lucide-react'

function CheckoutTerminal({
  cart,
  triggerClearCart,
  qtyInputRefs,
  handleQtyChangeAttempt,
  triggerDeleteItem,
  cartSubtotal,
  discount,
  setDiscount,
  paidAmount,
  setPaidAmount,
  changeRemaining,
  isDelivery,
  setIsDelivery,
  clientName,
  handleClientNameChange,
  clientPhone,
  handleClientPhoneChange,
  clientAddress,
  setClientAddress,
  clientSearchResults,
  selectClient,
  paymentType,
  setPaymentType,
  cartTotal,
  handleCheckout,
  barcodeInputRef,
  barcodeInput,
  setBarcodeInput,
  handleBarcodeSubmit,
  dbStats,
  searchInputRef,
  searchInput,
  handleSearchChange,
  handleSearchKeyDown,
  searchResults,
  selectedSearchIndex,
  addToCart,
  setSearchInput,
  setSearchResults,
  setSelectedSearchIndex,
  noPrint,
  setNoPrint,
  depositChange,
  setDepositChange,
  appliedCredit,
  setAppliedCredit,
  selectedClient
}) {
  const handlePrintShortages = async () => {
    if (!dbStats.lowStockItems || dbStats.lowStockItems.length === 0) return
    try {
      const mappedItems = dbStats.lowStockItems.map((item) => ({
        name: item.name,
        stock_qty: item.stock_qty,
        min_limit: item.reorder_limit
      }))
      await window.api.generateShortagesPdf(mappedItems)
    } catch (e) {
      console.error('PDF export error:', e)
    }
  }

  const handlePrintShortagesToPaper = async () => {
    if (!dbStats.lowStockItems || dbStats.lowStockItems.length === 0) return
    try {
      const mappedItems = dbStats.lowStockItems.map((item) => ({
        name: item.name,
        stock_qty: item.stock_qty,
        min_limit: item.reorder_limit
      }))
      await window.api.printShortagesToPrinter(mappedItems)
    } catch (e) {
      console.error('Direct print error:', e)
    }
  }

  return (
    <>
      <main className="pos-grid">
        {/* Left Panel - Current Invoice Cart */}
        <section className="cart-panel">
          <div className="cart-header">
            <h2>فاتورة المبيعات الحالية</h2>
            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={triggerClearCart}>
              <Trash2 size={14} />
              تفريغ السلة (Esc)
            </button>
          </div>

          <div className="cart-table-wrapper">
            <table className="cart-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>م</th>
                  <th>الباركود</th>
                  <th>اسم الصنف</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>الكمية</th>
                  <th style={{ width: '100px' }}>السعر</th>
                  <th style={{ width: '110px' }}>الإجمالي</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                      الفاتورة فارغة. يرجى مسح باركود أو البحث لإضافة أصناف.
                    </td>
                  </tr>
                ) : (
                  cart.map((item, index) => (
                    <tr key={item.barcode}>
                      <td>{index + 1}</td>
                      <td style={{ fontFamily: 'monospace' }}>{item.barcode}</td>
                      <td style={{ fontWeight: '600' }}>{item.name}</td>
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="number" 
                          className="qty-input"
                          value={item.qty}
                          ref={el => qtyInputRefs.current[index] = el}
                          onChange={(e) => handleQtyChangeAttempt(item.barcode, e.target.value)}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value)
                            if (isNaN(val) || val <= 0) {
                              triggerDeleteItem(item.barcode)
                            }
                          }}
                          min="0.01"
                          step="any"
                        />
                      </td>
                      <td>{item.price?.toFixed(2)} ج.م</td>
                      <td style={{ fontWeight: '700', color: 'var(--accent-emerald)' }}>
                        {item.total?.toFixed(2)} ج.م
                      </td>
                      <td>
                        <button className="delete-btn" onClick={() => triggerDeleteItem(item.barcode)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Cart Bottom Checkout Box */}
          <div className="checkout-panel">
            <div className="summary-grid">
              <div className="summary-box">
                <label>إجمالي الفاتورة</label>
                <div className="summary-value">{cartSubtotal?.toFixed(2)} ج.م</div>
              </div>
              <div className="summary-box">
                <label>الخصم المسموح به</label>
                <input 
                  type="number" 
                  className="summary-input"
                  value={discount === 0 ? '' : discount}
                  placeholder="0.00"
                  onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                />
              </div>
              <div className="summary-box">
                <label>المدفوع من العميل</label>
                <input 
                  type="number" 
                  className="summary-input"
                  value={paidAmount}
                  placeholder="0.00"
                  onChange={(e) => setPaidAmount(e.target.value)}
                />
              </div>
              <div className="summary-box">
                <label>المتبقي للعميل (الباقي)</label>
                <div className="summary-value change">{changeRemaining?.toFixed(2)} ج.م</div>
              </div>
            </div>

            {/* Customer details & Optional Delivery */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', position: 'relative', zIndex: 10 }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input 
                    type="checkbox" 
                    id="delivery-check"
                    checked={isDelivery} 
                    onChange={(e) => setIsDelivery(e.target.checked)} 
                  />
                  <label htmlFor="delivery-check" style={{ fontSize: '0.85rem', cursor: 'pointer', fontWeight: 'bold' }}>طلب توصيل (دليفري)</label>
                </div>
                
                <input 
                  type="text" 
                  placeholder="اسم العميل..." 
                  className="form-input" 
                  style={{ flex: 1, minWidth: '150px', padding: '4px 8px', fontSize: '0.85rem' }} 
                  value={clientName}
                  onChange={(e) => handleClientNameChange(e.target.value)}
                />
                <input 
                  type="text" 
                  placeholder="رقم الهاتف..." 
                  className="form-input" 
                  style={{ flex: 1, minWidth: '150px', padding: '4px 8px', fontSize: '0.85rem' }}
                  value={clientPhone}
                  onChange={(e) => handleClientPhoneChange(e.target.value)}
                />
              </div>
              {isDelivery && (
                <input 
                  type="text" 
                  placeholder="عنوان التوصيل بالتفصيل..." 
                  className="form-input" 
                  style={{ width: '100%', padding: '4px 8px', fontSize: '0.85rem' }}
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                />
              )}
              
              {/* تفاصيل رصيد العميل وخيار استهلاك الرصيد */}
              {selectedClient && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px', width: '100%' }}>
                  <div>
                    {selectedClient.debt_balance < 0 ? (
                      <span style={{ color: 'var(--accent-emerald)', fontWeight: 'bold' }}>
                        رصيد متوفر للعميل: {Math.abs(selectedClient.debt_balance)?.toFixed(2)} ج.م
                      </span>
                    ) : selectedClient.debt_balance > 0 ? (
                      <span style={{ color: 'var(--accent-rose)', fontWeight: 'bold' }}>
                        مديونية سابقة على العميل: {selectedClient.debt_balance?.toFixed(2)} ج.م
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>ليس لديه رصيد أو مديونية</span>
                    )}
                  </div>
                  {selectedClient.debt_balance < 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn"
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.75rem',
                          background: appliedCredit > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontFamily: 'inherit'
                        }}
                        onClick={() => {
                          if (appliedCredit > 0) {
                            setAppliedCredit(0)
                          } else {
                            const maxUsable = Math.min(Math.abs(selectedClient.debt_balance), cartTotal + appliedCredit)
                            setAppliedCredit(maxUsable)
                          }
                        }}
                      >
                        {appliedCredit > 0 ? 'إلغاء الخصم' : 'خصم من الرصيد'}
                      </button>
                      {appliedCredit > 0 && (
                        <span style={{ fontWeight: 'bold', color: 'var(--accent-emerald)' }}>
                          تم خصم: {appliedCredit?.toFixed(2)} ج.م
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* خيار حفظ الباقي بالرصيد */}
              {changeRemaining > 0 && selectedClient && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', background: 'rgba(245,158,11,0.08)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.2)', width: '100%' }}>
                  <label htmlFor="deposit-change-input" style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                    المبلغ المراد حفظه كـ رصيد للعميل:
                  </label>
                  <input
                    type="number"
                    id="deposit-change-input"
                    value={depositChange}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '' || (!isNaN(val) && parseFloat(val) >= 0)) {
                        setDepositChange(val)
                      }
                    }}
                    placeholder="0.00"
                    max={changeRemaining}
                    min={0}
                    step="0.01"
                    style={{
                      width: '80px',
                      padding: '3px 6px',
                      borderRadius: '4px',
                      background: 'var(--bg-main)',
                      border: '1px solid #f59e0b',
                      color: '#f59e0b',
                      fontWeight: 'bold',
                      fontSize: '0.85rem'
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    (الحد الأقصى: {changeRemaining?.toFixed(2)} ج.م)
                  </span>
                </div>
              )}
              {clientSearchResults.length > 0 && (
                <div className="client-autocomplete-dropdown" style={{
                  position: 'absolute',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                  width: 'calc(100% - 20px)',
                  left: '10px',
                  top: '100%',
                  zIndex: 100,
                  marginTop: '4px',
                  overflow: 'hidden'
                }}>
                  {clientSearchResults.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => selectClient(c)}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background 0.2s',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ fontWeight: 'bold' }}>{c.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {c.phone ? `📞 ${c.phone}` : ''} {c.debt_balance > 0 ? `| 💸 دين: ${c.debt_balance?.toFixed(2)} ج.م` : ''} {c.points > 0 ? `| ⭐️ نقاط: ${c.points}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="checkout-actions">
              <div style={{ display: 'flex', gap: '8px', width: '260px', flexWrap: 'wrap' }}>
                <button 
                  className={`btn ${paymentType === 'نقدي' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPaymentType('نقدي')}
                  style={{ padding: '6px 12px', fontSize: '0.85rem', flex: 1 }}
                >
                  <DollarSign size={16} />
                  نقدي
                </button>
                <button 
                  className={`btn ${paymentType === 'فودافون كاش' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPaymentType('فودافون كاش')}
                  style={{ padding: '6px 12px', fontSize: '0.85rem', flex: 1 }}
                >
                  <CreditCard size={16} />
                  فودافون
                </button>
                <button 
                  className={`btn ${paymentType === 'انستا باي' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPaymentType('انستا باي')}
                  style={{ padding: '6px 12px', fontSize: '0.85rem', flex: 1 }}
                >
                  <CreditCard size={16} />
                  انستا باي
                </button>
                <button 
                  className={`btn ${paymentType === 'آجل' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    if (!clientName.trim()) {
                      alert('يرجى تحديد العميل أولاً لإجراء عملية بيع آجل!')
                      return
                    }
                    setPaymentType('آجل')
                  }}
                  style={{ padding: '6px 12px', fontSize: '0.85rem', flex: 1 }}
                >
                  <BookOpen size={16} />
                  آجل
                </button>
              </div>

              <div className="summary-box" style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>المبلغ الصافي المطلوب</div>
                <div className="summary-value total" style={{ fontSize: '2.0rem', lineHeight: '1' }}>
                  {cartTotal?.toFixed(2)} ج.م
                </div>
              </div>

              <button
                className={`btn ${noPrint ? 'btn-danger' : 'btn-success'}`}
                style={{ width: '220px', fontSize: '1rem', height: '48px' }}
                onClick={handleCheckout}
              >
                <CheckCircle size={20} />
                {noPrint ? 'تأكيد (بدون فاتورة) (F1)' : 'تأكيد الدفع (F1)'}
              </button>
              <button
                className={`btn ${noPrint ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 12px', fontSize: '0.78rem', height: '48px', whiteSpace: 'nowrap' }}
                onClick={() => setNoPrint(p => !p)}
                title={noPrint ? 'الطباعة معطّلة — اضغط لتفعيلها' : 'الطباعة مفعّلة — اضغط لإيقافها'}
              >
                {noPrint ? '🚫 فاتورة' : '🖨️ فاتورة'}
              </button>
            </div>
          </div>
        </section>

        {/* Right Panel - Scanner, Search, Alerts & Shortcuts */}
        <section className="control-panel">
          {/* Active Scanner Field */}
          <div className="panel-card" style={{ padding: '12px' }}>
            <form onSubmit={handleBarcodeSubmit} className="scanner-box">
              <input 
                type="text" 
                className="scanner-input" 
                ref={barcodeInputRef}
                onFocus={(e) => {
                  e.target.select()
                }}
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="امسح باركود السلعة..."
              />
              <Key className="scanner-icon" size={20} />
            </form>
          </div>

          {/* Quick Item Instant Search */}
          <div className="panel-card catalog-search-wrapper">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ fontWeight: 'bold' }}>البحث السريع في الأصناف (F2)</span>
              <span style={{ color: 'var(--text-muted)' }}>إجمالي: {dbStats.totalItems} صنف</span>
            </div>
            
            <div className="search-input-box">
              <input 
                type="text" 
                className="search-input" 
                ref={searchInputRef}
                value={searchInput}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                placeholder="ابحث بالاسم أو الباركود..."
              />
              <Search 
                size={16} 
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
              />
            </div>

            {searchInput && (
              <div className="search-results-list">
                {searchResults.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    لا توجد نتائج مطابقة
                  </div>
                ) : (
                searchResults.map((item, index) => (
                  <div 
                    key={item.barcode} 
                    className={`search-item ${index === selectedSearchIndex ? 'selected' : ''}`}
                    onClick={() => {
                      addToCart(item)
                      setSearchInput('')
                      setSearchResults([])
                      setSelectedSearchIndex(-1)
                      barcodeInputRef.current?.focus()
                    }}
                  >
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      <span className="item-barcode">{item.barcode}</span>
                    </div>
                    <div className="item-price-stock">
                      <span className="item-price">{item.retail_price?.toFixed(2)} ج.م</span>
                      <span className={`item-stock ${item.stock_qty <= item.reorder_limit ? 'low-stock' : ''}`}>
                        مخزون: {item.stock_qty} {item.unit}
                        {item.stock_qty <= item.reorder_limit && ' ⚠️'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            )}
          </div>

          {/* Active Shortcuts & Warnings info card */}
          <div className="panel-card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '8px', flexShrink: 0 }}>
              <h3 style={{ fontSize: '0.85rem', margin: 0 }}>قواعد الجرد ونواقص المخزون</h3>
              {dbStats.lowStock > 0 && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    type="button" 
                    title="طباعة النواقص على الفاتورة" 
                    onClick={handlePrintShortagesToPaper}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-emerald)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', fontSize: '1rem' }}
                  >
                    🖨️
                  </button>
                  <button 
                    type="button" 
                    title="تصدير النواقص كـ PDF" 
                    onClick={handlePrintShortages}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', fontSize: '1rem' }}
                  >
                    📄
                  </button>
                </div>
              )}
            </div>
            {dbStats.lowStock > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: 'rgba(244, 63, 94, 0.08)', borderRadius: '6px', color: 'var(--accent-rose)', fontSize: '0.8rem', fontWeight: 'bold', flexShrink: 0 }}>
                  <AlertTriangle size={16} />
                  <span>هناك ({dbStats.lowStock}) صنف تحت حد الطلب!</span>
                </div>
                
                {/* List of shortaged items */}
                <div style={{ 
                  flex: 1, 
                  overflowY: 'auto', 
                  fontSize: '0.75rem', 
                  background: 'rgba(255,255,255,0.01)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '6px',
                  padding: '6px'
                }}>
                  {dbStats.lowStockItems && dbStats.lowStockItems.map((item, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      padding: '4px 2px', 
                      borderBottom: idx < dbStats.lowStockItems.length - 1 ? '1px dashed var(--border-color)' : 'none',
                      color: 'var(--text-main)'
                    }}>
                      <span style={{ fontWeight: '600' }}>• {item.name}</span>
                      <span style={{ color: 'var(--accent-rose)', fontWeight: 'bold' }}>
                        ({item.stock_qty} / {item.reorder_limit} {item.unit})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--accent-emerald)', fontSize: '0.8rem', padding: '4px' }}>مستويات المخزون آمنة حالياً.</div>
            )}
            
            <div className="shortcut-list" style={{ marginTop: '5px' }}>
              <div className="shortcut-row">
                <span className="shortcut-text">دفع الفاتورة فورياً</span>
                <span className="shortcut-badge">F1</span>
              </div>
              <div className="shortcut-row">
                <span className="shortcut-text">الذهاب لمربع البحث</span>
                <span className="shortcut-badge">F2</span>
              </div>
              <div className="shortcut-row">
                <span className="shortcut-text">تغيير كمية أول صنف</span>
                <span className="shortcut-badge">F3</span>
              </div>
              <div className="shortcut-row">
                <span className="shortcut-text">حذف آخر صنف مضاف</span>
                <span className="shortcut-badge">F4</span>
              </div>
              <div className="shortcut-row">
                <span className="shortcut-text">إلغاء وتفريغ السلة</span>
                <span className="shortcut-badge">Esc</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer shortcut bar */}
      <footer className="shortcuts-bar">
        <div className="shortcut-tag">
          <span className="shortcut-key">F1</span>
          <span>تأكيد المبيعات</span>
        </div>
        <div className="shortcut-tag">
          <span className="shortcut-key">F2</span>
          <span>بحث أصناف</span>
        </div>
        <div className="shortcut-tag">
          <span className="shortcut-key">F3</span>
          <span>كمية السلعة</span>
        </div>
        <div className="shortcut-tag">
          <span className="shortcut-key">F4</span>
          <span>حذف آخر صنف</span>
        </div>
        <div className="shortcut-tag">
          <span className="shortcut-key">Esc</span>
          <span>تفريغ الفاتورة</span>
        </div>
        <div className="shortcut-tag">
          <span className="shortcut-key">Ctrl + Alt + L</span>
          <span>قفل الشاشة مؤقتاً</span>
        </div>
      </footer>
    </>
  )
}

export default CheckoutTerminal
