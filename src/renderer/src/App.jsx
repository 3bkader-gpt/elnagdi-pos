import React, { useState, useEffect, useRef } from 'react'
import {
  ShoppingCart, Lock, User, Clock, CheckCircle, AlertTriangle, Key, LogOut
} from 'lucide-react'

import { playSound, getNowStr} from './lib/utils'
import { executeQuery } from './lib/db'

// Import Custom Hooks
import { useBarcode } from './hooks/useBarcode'
import { useCart } from './hooks/useCart'
import { useShift } from './hooks/useShift'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useAdminController } from './hooks/useAdminController'
import { usePOSController } from './hooks/usePOSController'

// Import POS Components
import CheckoutTerminal from './components/pos/CheckoutTerminal'
import LockScreen from './components/pos/LockScreen'
import AppHeader from './components/pos/AppHeader'

// Import Print Templates
import { generateReceiptHtml, generateReprintHtml } from './lib/printTemplates'

// Import Admin Dashboard Components
import AdminDashboard from './components/admin/AdminDashboard'
import TillsManagerTab from './components/admin/TillsManagerTab'

// Import Modals Components
import AppModals from './components/modals/AppModals'
import ChangePinModal from './components/modals/ChangePinModal'

function App() {
  // Refs
  const barcodeInputRef = useRef(null)
  const searchInputRef = useRef(null)
  const qtyInputRefs = useRef([])
  const adminSearchInputRef = useRef(null)
  const addProductBarcodeRef = useRef(null)
  // Stable ref so usePOSController can call parseScaleBarcode before useBarcode is declared
  const parseScaleBarcodeFnRef = useRef((bc) => ({ barcode: bc, isWeighted: false, qty: 1 }))

  // Global override for native window.alert to prevent blocking Electron popups
  useEffect(() => {
    window.alert = (msg) => {
      console.warn('[Alert Suppressed]:', msg)
      if (triggerCustomAlert) {
        triggerCustomAlert(String(msg || ''))
      }
    }
  }, [])

  // useShift hook
  const {
    currentUser,
    setCurrentUser,
    currentShift,
    setCurrentShift,
    isLocked,
    setIsLocked,
    openShiftModal,
    setOpenShiftModal,
    startingCash,
    setStartingCash,
    momknStartBalance,
    setMomknStartBalance,
    momknStartCash,
    setMomknStartCash,
    vfcashStartBalance,
    setVfcashStartBalance,
    vfcashStartCash,
    setVfcashStartCash,
    closeShiftModal,
    setCloseShiftModal,
    actualEndCash,
    setActualEndCash,
    managerApprovalModal,
    setManagerApprovalModal,
    managerPin,
    setManagerPin,
    pendingAction,
    setPendingAction,
    handleLock: rawHandleLock,
    checkActiveShift
  } = useShift()

  const [showChangePinModal, setShowChangePinModal] = useState(false)
  const [noPrint, setNoPrint] = useState(false)

  // Custom non-blocking alert state
  const [customAlert, setCustomAlert] = useState(null)
  const triggerCustomAlert = (message, title = 'تنبيه', onClose = null) => {
    setCustomAlert({ message, title, onClose })
  }
  const closeCustomAlert = () => {
    if (customAlert && customAlert.onClose) {
      customAlert.onClose()
    }
    setCustomAlert(null)
    setTimeout(() => {
      barcodeInputRef.current?.focus()
    }, 100)
  }

  const [customConfirm, setCustomConfirm] = useState(null)
  const triggerCustomConfirm = (message, onConfirm, onCancel = null, title = 'تأكيد العملية') => {
    setCustomConfirm({ message, title, onConfirm, onCancel })
  }
  const closeCustomConfirm = (confirmed) => {
    if (customConfirm) {
      if (confirmed && customConfirm.onConfirm) {
        customConfirm.onConfirm()
      } else if (!confirmed && customConfirm.onCancel) {
        customConfirm.onCancel()
      }
    }
    setCustomConfirm(null)
    setTimeout(() => {
      barcodeInputRef.current?.focus()
    }, 100)
  }

  // useCart hook
  const {
    cart,
    setCart,
    discount,
    setDiscount,
    paidAmount,
    setPaidAmount,
    paymentType,
    setPaymentType,
    clientName,
    setClientName,
    clientPhone,
    setClientPhone,
    isDelivery,
    setIsDelivery,
    depositChange,
    setDepositChange,
    appliedCredit,
    setAppliedCredit,
    cartTotal,
    changeDue,
    addToCart,
    handleQtyChangeAttempt,
    triggerDeleteItem,
    triggerClearCart,
    updateQty,
    subTotal: cartSubtotal
  } = useCart({
    playSound,
    triggerCustomAlert
  })

  const [currentView, setCurrentView] = useState('pos')
  const [adminTab, setAdminTab] = useState('menu')
  const [toastMessage, setToastMessage] = useState(null)



  // useAdminController hook to manage all admin features & DB reports
  const adminController = useAdminController({
    currentShift,
    currentUser,
    setToastMessage,
    triggerCustomAlert,
    triggerCustomConfirm
  })


  // usePOSController hook — all checkout terminal handlers & states
  const {
    pin,
    setPin,
    handlePinSubmit,
    handleStartShift,
    handleConfirmCloseShift,
    handleLock,
    barcodeInput,
    setBarcodeInput,
    handleBarcodeSubmit,
    searchInput,
    setSearchInput,
    handleSearchChange,
    handleSearchKeyDown,
    searchResults,
    setSearchResults,
    selectedSearchIndex,
    setSelectedSearchIndex,
    clientAddress,
    setClientAddress,
    selectedClient,
    setSelectedClient,
    clientSearchResults,
    setClientSearchResults,
    handleClientNameChange,
    handleClientPhoneChange,
    selectClient,
    handleManagerAuthSubmit,
    handleCheckout,
    handleReprintSale
  } = usePOSController({
    currentUser,
    setCurrentUser,
    currentShift,
    setCurrentShift,
    isLocked,
    setIsLocked,
    openShiftModal,
    setOpenShiftModal,
    startingCash,
    setStartingCash,
    momknStartBalance,
    setMomknStartBalance,
    momknStartCash,
    setMomknStartCash,
    vfcashStartBalance,
    setVfcashStartBalance,
    vfcashStartCash,
    setVfcashStartCash,
    closeShiftModal,
    setCloseShiftModal,
    actualEndCash,
    setActualEndCash,
    managerApprovalModal,
    setManagerApprovalModal,
    managerPin,
    setManagerPin,
    pendingAction,
    setPendingAction,
    rawHandleLock,
    cart,
    setCart,
    discount,
    setDiscount,
    paidAmount,
    setPaidAmount,
    paymentType,
    setPaymentType,
    clientName,
    setClientName,
    clientPhone,
    setClientPhone,
    isDelivery,
    setIsDelivery,
    depositChange,
    setDepositChange,
    appliedCredit,
    setAppliedCredit,
    cartTotal,
    cartSubtotal,
    addToCart,
    triggerClearCart,
    updateQty,
    barcodeInputRef,
    searchInputRef,
    qtyInputRefs,
    printSilent: true,
    noPrint,
    setToastMessage,
    setCurrentView,
    fetchStats: () => adminController.fetchStats(),
    fetchClientsList: () => adminController.fetchClientsList(),
    fetchClientStats: () => adminController.fetchClientStats(),
    fetchAdminData: () => adminController.fetchAdminData(),
    triggerCustomAlert,
    triggerCustomConfirm,
    parseScaleBarcode: (bc) => parseScaleBarcodeFnRef.current(bc)
  })

  // useBarcode after usePOSController so setBarcodeInput is available
  const { parseScaleBarcode } = useBarcode({
    isLocked,
    currentView,
    openShiftModal,
    closeShiftModal,
    managerApprovalModal,
    showAddModal: adminController.showAddModal,
    adminTab,
    customAlert,
    customConfirm,
    barcodeInputRef,
    adminSearchInputRef,
    addProductBarcodeRef,
    setBarcodeInput,
    setAdminSearch: adminController.setAdminSearch,
    setNewProduct: adminController.setNewProduct
  })
  // Keep the ref up-to-date so usePOSController always calls the real function
  parseScaleBarcodeFnRef.current = parseScaleBarcode

  // --- Periodic Cash Audit System ---
  const [showAuditModal, setShowAuditModal] = useState(false)
  const [auditExpectedCash, setAuditExpectedCash] = useState(0)
  const [auditActualCash, setAuditActualCash] = useState('')
  const [auditNotes, setAuditNotes] = useState('')
  const [showReasonModal, setShowReasonModal] = useState(false)
  const [auditDeficitReason, setAuditDeficitReason] = useState('')
  const [reasonAuditId, setReasonAuditId] = useState(null)
  const [auditBreakdown, setAuditBreakdown] = useState(null)
  const lastActivityTime = useRef(Date.now())
  const lastAuditTime = useRef(Date.now())

  // Track keyboard/mouse activity to prevent interrupting active checkout
  useEffect(() => {
    const updateActivity = () => {
      lastActivityTime.current = Date.now()
    }
    window.addEventListener('mousemove', updateActivity)
    window.addEventListener('keypress', updateActivity)
    window.addEventListener('click', updateActivity)
    return () => {
      window.removeEventListener('mousemove', updateActivity)
      window.removeEventListener('keypress', updateActivity)
      window.removeEventListener('click', updateActivity)
    }
  }, [])

  const triggerAuditCheck = async () => {
    if (!currentShift) return
    try {
      const grossRes = await executeQuery(`SELECT IFNULL(SUM(COALESCE(NULLIF(original_amount, 0) - discount, total_amount)), 0) as total FROM sales WHERE shift_id = ${currentShift.id};`)
      const debtRes = await executeQuery(`SELECT IFNULL(SUM(COALESCE(NULLIF(original_amount, 0) - discount, total_amount)), 0) as total FROM sales WHERE shift_id = ${currentShift.id} AND payment_type = 'آجل';`)
      const digitalRes = await executeQuery(`SELECT IFNULL(SUM(COALESCE(NULLIF(original_amount, 0) - discount, total_amount)), 0) as total FROM sales WHERE shift_id = ${currentShift.id} AND payment_type NOT IN ('نقدي', 'آجل');`)
      const repayRes = await executeQuery(`SELECT IFNULL(SUM(amount), 0) as total FROM safe_ledger WHERE shift_id = ${currentShift.id} AND type = 'inflow';`)
      const refundRes = await executeQuery(`SELECT IFNULL(SUM(amount), 0) as total FROM safe_ledger WHERE shift_id = ${currentShift.id} AND type = 'outflow';`)
      
      const grossSales = parseFloat(grossRes[0]?.total) || 0
      const debtSales = parseFloat(debtRes[0]?.total) || 0
      const digitalSales = parseFloat(digitalRes[0]?.total) || 0
      const repayTotal = parseFloat(repayRes[0]?.total) || 0
      const refundTotal = parseFloat(refundRes[0]?.total) || 0
      const initialCash = parseFloat(currentShift.initial_cash) || 0
      
      const expected = initialCash + grossSales - debtSales - digitalSales + repayTotal - refundTotal
      setAuditExpectedCash(expected)
      setAuditBreakdown({ grossSales, debtSales: debtSales + digitalSales, refunds: refundTotal, repay: repayTotal, initialCash })
      setAuditActualCash('')
      setAuditNotes('')
      setShowAuditModal(true)
    } catch (e) {
      console.error('Failed to get expected cash:', e)
      triggerCustomAlert('خطأ برمجي أثناء الجرد: ' + (e.message || e))
    }
  }

  // Periodic check timer (every 10 seconds)
  useEffect(() => {
    if (isLocked || !currentShift) return
    
    const interval = setInterval(async () => {
      const now = Date.now()
      const timeSinceLastAudit = now - lastAuditTime.current
      
      // If 1 hour has passed (3600000 ms)
      if (timeSinceLastAudit >= 3600000) {
        const idleTime = now - lastActivityTime.current
        const isCartEmpty = cart.length === 0
        const isModalOpen = openShiftModal || closeShiftModal || managerApprovalModal || showAuditModal || customAlert || customConfirm
        
        // Idle for 20 seconds, empty cart, no modals open
        if (idleTime >= 20000 && isCartEmpty && !isModalOpen) {
          triggerAuditCheck()
        }
      }
    }, 10000)
    
    return () => clearInterval(interval)
  }, [isLocked, currentShift, cart, openShiftModal, closeShiftModal, managerApprovalModal, showAuditModal, customAlert, customConfirm])

  const submitAudit = async () => {
    const actual = parseFloat(auditActualCash)
    if (isNaN(actual) || actual < 0) {
      triggerCustomAlert('الرجاء إدخال مبلغ فعلي صحيح.')
      return
    }
    
    try {
      const diff = actual - auditExpectedCash
      const nowStr = getNowStr()
      
      // Insert record
      await executeQuery(`
        INSERT INTO shift_audits (shift_id, timestamp, expected_cash, actual_cash, difference, notes)
        VALUES (${currentShift.id}, '${nowStr}', ${auditExpectedCash}, ${actual}, ${diff}, '${auditNotes.replace(/'/g, "''")}');
      `)

      // Fetch last inserted audit row id
      const lastInsertRes = await executeQuery(`SELECT last_insert_rowid() as id;`)
      const auditId = lastInsertRes[0]?.id
      
      setShowAuditModal(false)
      lastAuditTime.current = Date.now() // reset hourly timer
      adminController.fetchAdminData()

      if (diff < 0) {
        triggerCustomConfirm(
          `تم حفظ جرد الدرج الدوري بنجاح. تنبيه: يوجد عجز بقيمة ${diff?.toFixed(2)} ج.م. هل تريد كتابة سبب أو تفاصيل لهذا العجز؟ (اختياري)`,
          () => {
            setAuditDeficitReason('')
            setReasonAuditId(auditId)
            setShowReasonModal(true)
          },
          () => {
            // Dismissed
          },
          'تنبيه عجز بالدرج',
          'تسجيل السبب',
          'تخطي'
        )
      } else {
        triggerCustomAlert('تم حفظ الجرد الدوري بنجاح. شكراً لك.', 'نجاح العملية')
      }
    } catch (e) {
      console.error('Failed to save shift audit:', e)
      triggerCustomAlert('فشلت عملية حفظ الجرد: ' + e.message)
    }
  }

  const snoozeAudit = () => {
    setShowAuditModal(false)
    lastAuditTime.current = Date.now() - 3600000 + 5 * 60 * 1000 // snooze for 5 minutes
    triggerCustomAlert('تم تأجيل الجرد الدوري لمدة 5 دقائق.')
  }

  const skipAudit = () => {
    setShowAuditModal(false)
    lastAuditTime.current = Date.now() // reset hourly timer
    triggerCustomAlert('تم تخطي الجرد الدوري لهذه الساعة.')
  }




  // On App Mount
  useEffect(() => {
    adminController.fetchStats()
    checkActiveShift()
    adminController.fetchChecksDueToday()
  }, [])

  // Global keyboard shortcuts
  useKeyboardShortcuts({
    isLocked,
    customAlert,
    closeCustomAlert,
    handleLock,
    handleCheckout,
    searchInputRef,
    qtyInputRefs,
    triggerClearCart,
    cart,
    triggerDeleteItem
  })

  // Render Pin Authenticator Screen
  if (isLocked) {
    return <LockScreen pin={pin} setPin={setPin} handlePinSubmit={handlePinSubmit} />
  }

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: (typeof toastMessage === 'object' && toastMessage.type === 'error') ? 'var(--accent-rose)' : 'var(--accent-emerald)',
          color: '#fff',
          padding: '16px 32px',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
          zIndex: 99999,
          fontSize: '1.2rem',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          {(typeof toastMessage === 'object' && toastMessage.type === 'error') ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
          {typeof toastMessage === 'object' ? toastMessage.text : toastMessage}
        </div>
      )}
      {/* Top Header */}
      <AppHeader
        currentUser={currentUser}
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentShift={currentShift}
        setCloseShiftModal={setCloseShiftModal}
        setOpenShiftModal={setOpenShiftModal}
        handleLock={handleLock}
        fetchAdminData={adminController.fetchAdminData}
        setShowChangePinModal={setShowChangePinModal}
        onManualAuditTrigger={triggerAuditCheck}
      />

      {currentView === 'admin' && (currentUser?.role === 'admin' || currentUser?.role === 'manager') ? (
        <AdminDashboard
          currentUser={currentUser}
          currentShift={currentShift}
          triggerCustomAlert={triggerCustomAlert}
          triggerCustomConfirm={triggerCustomConfirm}
          adminTab={adminTab}
          setAdminTab={setAdminTab}
          adminSearchInputRef={adminSearchInputRef}
          handleReprintSale={handleReprintSale}
          {...adminController}
        />
      ) : currentView === 'tills' ? (
        <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
          <TillsManagerTab
            currentUser={currentUser}
            currentShift={currentShift}
            triggerCustomAlert={triggerCustomAlert}
            triggerCustomConfirm={triggerCustomConfirm}
          />
        </div>
      ) : (
        <CheckoutTerminal
          cart={cart}
          triggerClearCart={triggerClearCart}
          qtyInputRefs={qtyInputRefs}
          handleQtyChangeAttempt={handleQtyChangeAttempt}
          triggerDeleteItem={triggerDeleteItem}
          cartSubtotal={cartSubtotal}
          discount={discount}
          setDiscount={setDiscount}
          paidAmount={paidAmount}
          setPaidAmount={setPaidAmount}
          changeRemaining={changeDue}
          isDelivery={isDelivery}
          setIsDelivery={setIsDelivery}
          clientName={clientName}
          handleClientNameChange={handleClientNameChange}
          clientPhone={clientPhone}
          handleClientPhoneChange={handleClientPhoneChange}
          clientAddress={clientAddress}
          setClientAddress={setClientAddress}
          clientSearchResults={clientSearchResults}
          selectClient={selectClient}
          paymentType={paymentType}
          setPaymentType={setPaymentType}
          cartTotal={cartTotal}
          depositChange={depositChange}
          setDepositChange={setDepositChange}
          appliedCredit={appliedCredit}
          setAppliedCredit={setAppliedCredit}
          selectedClient={selectedClient}
          handleCheckout={handleCheckout}
          barcodeInputRef={barcodeInputRef}
          barcodeInput={barcodeInput}
          setBarcodeInput={setBarcodeInput}
          handleBarcodeSubmit={handleBarcodeSubmit}
          dbStats={adminController.dbStats}
          noPrint={noPrint}
          setNoPrint={setNoPrint}
          searchInputRef={searchInputRef}
          searchInput={searchInput}
          handleSearchChange={handleSearchChange}
          handleSearchKeyDown={handleSearchKeyDown}
          searchResults={searchResults}
          selectedSearchIndex={selectedSearchIndex}
          addToCart={addToCart}
          setSearchInput={setSearchInput}
          setSearchResults={setSearchResults}
          setSelectedSearchIndex={setSelectedSearchIndex}
          triggerCustomAlert={triggerCustomAlert}
        />
      )}

      <AppModals
        openShiftModal={openShiftModal}
        currentUser={currentUser}
        startingCash={startingCash}
        setStartingCash={setStartingCash}
        momknStartBalance={momknStartBalance}
        setMomknStartBalance={setMomknStartBalance}
        momknStartCash={momknStartCash}
        setMomknStartCash={setMomknStartCash}
        vfcashStartBalance={vfcashStartBalance}
        setVfcashStartBalance={setVfcashStartBalance}
        vfcashStartCash={vfcashStartCash}
        setVfcashStartCash={setVfcashStartCash}
        handleStartShift={handleStartShift}
        closeShiftModal={closeShiftModal}
        currentShift={currentShift}
        actualEndCash={actualEndCash}
        setActualEndCash={setActualEndCash}
        setCloseShiftModal={setCloseShiftModal}
        handleConfirmCloseShift={handleConfirmCloseShift}
        customAlert={customAlert}
        closeCustomAlert={closeCustomAlert}
        customConfirm={customConfirm}
        closeCustomConfirm={closeCustomConfirm}
        managerApprovalModal={managerApprovalModal}
        managerPin={managerPin}
        setManagerPin={setManagerPin}
        setManagerApprovalModal={setManagerApprovalModal}
        setPendingAction={setPendingAction}
        handleManagerAuthSubmit={handleManagerAuthSubmit}
        addProductBarcodeRef={addProductBarcodeRef}
        {...adminController}
      />

      <ChangePinModal
        showChangePinModal={showChangePinModal}
        setShowChangePinModal={setShowChangePinModal}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
      />

      {/* Periodic Safe Audit Dialog Modal */}
      {showAuditModal && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 99999 }}>
          <div 
            className="modal-content" 
            style={{ 
              maxWidth: 480, 
              width: '95%', 
              backgroundColor: '#ffffff', 
              color: '#111827',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#111827', margin: 0, textAlign: 'center' }}>🕒 جرد درج كاشير السوبر ماركت الدوري</h2>
              <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '0.82rem', textAlign: 'center' }}>
                مطابقة مبيعات الكاشير للوردية رقم #{currentShift?.id}
              </p>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ textAlign: 'center', fontSize: '0.92rem', color: '#374151', margin: 0 }}>
                مرحباً <strong>{currentUser?.username}</strong>، يرجى مطابقة وتأكيد كاش مبيعات السوبرماركت بالدرج لتفادي أي عجز بالوردية.
              </p>
              
              <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                <div style={{ fontSize: '0.84rem', color: '#374151', marginBottom: '8px', background: '#ffffff', padding: '8px 10px', borderRadius: '6px', border: '1px dashed #6ee7b7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span>إجمالي مبيعات الفواتير:</span>
                    <strong>{(auditBreakdown?.grossSales || 0).toFixed(2)} ج.م</strong>
                  </div>
                  {(auditBreakdown?.debtSales || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706', marginBottom: '3px' }}>
                      <span>- مبيعات آجل (ديون لم تدخل الدرج):</span>
                      <strong>-{(auditBreakdown?.debtSales || 0).toFixed(2)} ج.م</strong>
                    </div>
                  )}
                  {(auditBreakdown?.refunds || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', marginBottom: '3px' }}>
                      <span>- مرتجع مبيعات / مصروفات (خارج):</span>
                      <strong>-{(auditBreakdown?.refunds || 0).toFixed(2)} ج.م</strong>
                    </div>
                  )}
                  {(auditBreakdown?.repay || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2563eb', marginBottom: '3px' }}>
                      <span>+ تحصيل ديون عملاء (كاش داخل):</span>
                      <strong>+{(auditBreakdown?.repay || 0).toFixed(2)} ج.م</strong>
                    </div>
                  )}
                  {(auditBreakdown?.initialCash || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2563eb', marginBottom: '3px' }}>
                      <span>+ كاش الفكة الافتتاحي بالدرج:</span>
                      <strong>+{(auditBreakdown?.initialCash || 0).toFixed(2)} ج.م</strong>
                    </div>
                  )}
                </div>

                <span style={{ fontSize: '0.9rem', color: '#047857', display: 'block', fontWeight: 'bold', textAlign: 'center' }}>
                  = صافي الكاش الورق المتوقع بالدرج: {(auditExpectedCash || 0).toFixed(2)} ج.م
                </span>
                <button
                  type="button"
                  onClick={() => setAuditActualCash((auditExpectedCash || 0).toFixed(2))}
                  style={{
                    marginTop: '8px',
                    width: '100%',
                    padding: '6px',
                    borderRadius: '6px',
                    border: '1px solid #059669',
                    background: '#ffffff',
                    color: '#059669',
                    fontWeight: 'bold',
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  ← تعبئة صافي الكاش المتوقع تلقائياً ({(auditExpectedCash || 0).toFixed(2)} ج.م)
                </button>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#111827', display: 'block', marginBottom: '4px' }}>
                  المبلغ النقدي الفعلي في الدرج حالياً (ج.م) *
                </label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="0.00"
                  value={auditActualCash}
                  onChange={(e) => setAuditActualCash(e.target.value)}
                  style={{
                    fontSize: '1.4rem',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    backgroundColor: '#ffffff',
                    color: '#111827',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '8px'
                  }}
                  autoFocus
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.82rem', color: '#4b5563', display: 'block', marginBottom: '4px' }}>ملاحظات الجرد (اختياري)</label>
                <textarea 
                  className="form-input" 
                  placeholder="مثال: تم الجرد الدوري والدرج مطابق..."
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  rows={2}
                  style={{
                    fontSize: '0.85rem',
                    backgroundColor: '#ffffff',
                    color: '#111827',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '6px'
                  }}
                />
              </div>
            </div>
            
            <div className="modal-footer" style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #e5e7eb' }}>
              <button className="btn btn-primary" style={{ flex: 1, padding: '10px' }} onClick={submitAudit}>
                تأكيد وحفظ الجرد
              </button>
              <button className="btn btn-secondary" style={{ padding: '10px' }} onClick={snoozeAudit}>
                تأجيل (5 دقائق)
              </button>
              <button className="btn btn-secondary" style={{ color: '#ef4444', borderColor: '#fca5a5', padding: '10px' }} onClick={skipAudit}>
                تخطي
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deficit Reason Modal */}
      {showReasonModal && (
        <div className="modal-overlay" style={{ zIndex: 100000 }}>
          <div className="modal-content glassmorphism-card" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>تسجيل سبب العجز 📝</h2>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>توضيح سبب الفارق المالي بالدرج</span>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>سبب أو ملاحظة العجز (اختياري):</label>
                <textarea 
                  className="form-control" 
                  placeholder="مثال: عجز فكة، أو زبون متبقي له حساب، إلخ..."
                  value={auditDeficitReason}
                  onChange={(e) => setAuditDeficitReason(e.target.value)}
                  rows={3}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }} 
                onClick={async () => {
                  try {
                    await executeQuery(`
                      UPDATE shift_audits 
                      SET notes = '${auditDeficitReason.replace(/'/g, "''")}' 
                      WHERE id = ${reasonAuditId};
                    `)
                    triggerCustomAlert('تم تسجيل سبب العجز بنجاح.', 'تم الحفظ')
                    setShowReasonModal(false)
                    adminController.fetchAdminData()
                  } catch (e) {
                    console.error('Failed to update audit notes:', e)
                  }
                }}
              >
                حفظ التوضيح
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowReasonModal(false)}
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

export default App
