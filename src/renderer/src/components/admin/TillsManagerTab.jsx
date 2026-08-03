import React, { useState, useEffect, useCallback } from 'react'
import { executeQuery } from '../../lib/db'
import { getFriendlyErrorMessage } from '../../lib/utils'
import { useMomknTill } from '../../hooks/useMomknTill'
import { useMobileMoneyTill } from '../../hooks/useMobileMoneyTill'
import MomknOperationModal from '../modals/MomknOperationModal'
import MobileMoneyOperationModal from '../modals/MobileMoneyOperationModal'
import { generateMomknReportHtml, generateMobileMoneyReportHtml } from '../../lib/printTemplates'

// Helper for ultra-safe currency formatting
const formatVal = (val, dec = 2) => {
  const num = parseFloat(val)
  return isNaN(num) ? (0).toFixed(dec) : num?.toFixed(dec)
}

const TillsManagerTab = ({
  currentUser,
  currentShift,
  triggerCustomAlert,
  triggerCustomConfirm
}) => {
  const [activeSubTab, setActiveSubTab] = useState('supermarket') // 'supermarket', 'momkn', 'mobile_money'
  const [mainDrawerSummary, setMainDrawerSummary] = useState({
    initialCash: 0,
    expectedCash: 0,
    cashSales: 0,
    inflows: 0,
    expenses: 0,
    supplierPayments: 0,
    returns: 0
  })

  const isAdmin = currentUser?.role === 'admin'
  const isSeifFayez = currentUser?.username === 'سيف فايز'

  // Initialize hooks
  const momkn = useMomknTill({ currentShift, triggerCustomAlert, triggerCustomConfirm })
  const mobileMoney = useMobileMoneyTill({ currentShift, triggerCustomAlert, triggerCustomConfirm })

  // 1. Fetch Main Supermarket Drawer Summary
  const fetchMainDrawerData = useCallback(async () => {
    if (!currentShift) return
    const shiftId = currentShift.id
    const initialCash = currentShift.initial_cash || 0

    try {
      const allSalesRes = await executeQuery(`
        SELECT IFNULL(SUM(COALESCE(NULLIF(original_amount, 0) - discount, total_amount)), 0) as total 
        FROM sales 
        WHERE shift_id = ${shiftId};
      `)
      const cashSalesRes = await executeQuery(`
        SELECT IFNULL(SUM(COALESCE(NULLIF(original_amount, 0) - discount, total_amount)), 0) as total 
        FROM sales 
        WHERE shift_id = ${shiftId} AND payment_type = 'نقدي';
      `)
      const debtRes = await executeQuery(`
        SELECT IFNULL(SUM(COALESCE(NULLIF(original_amount, 0) - discount, total_amount)), 0) as total 
        FROM sales 
        WHERE shift_id = ${shiftId} AND payment_type = 'آجل';
      `)
      const digitalSalesRes = await executeQuery(`
        SELECT IFNULL(SUM(COALESCE(NULLIF(original_amount, 0) - discount, total_amount)), 0) as total 
        FROM sales 
        WHERE shift_id = ${shiftId} AND payment_type NOT IN ('نقدي', 'آجل');
      `)
      const repayRes = await executeQuery(`
        SELECT IFNULL(SUM(amount), 0) as total
        FROM safe_ledger
        WHERE shift_id = ${shiftId} AND type = 'inflow';
      `)
      
      // Split outflows: Returns, Supplier Payments, General Expenses
      const returnsRes = await executeQuery(`
        SELECT IFNULL(SUM(amount), 0) as total
        FROM safe_ledger
        WHERE shift_id = ${shiftId} AND type = 'outflow' AND (description LIKE 'مرتجع%' OR description LIKE 'إرجاع%');
      `)
      const supplierRes = await executeQuery(`
        SELECT IFNULL(SUM(amount), 0) as total
        FROM safe_ledger
        WHERE shift_id = ${shiftId} AND type = 'outflow' AND (description LIKE 'دفعة لمورد%' OR description LIKE 'سداد دين مورد%');
      `)
      const expensesRes = await executeQuery(`
        SELECT IFNULL(SUM(amount), 0) as total
        FROM safe_ledger
        WHERE shift_id = ${shiftId} AND type = 'outflow' AND (description NOT LIKE 'مرتجع%' AND description NOT LIKE 'إرجاع%' AND description NOT LIKE 'دفعة لمورد%' AND description NOT LIKE 'سداد دين مورد%');
      `)

      const allSalesTotal = parseFloat(allSalesRes[0]?.total) || 0
      const cashSalesTotal = parseFloat(cashSalesRes[0]?.total) || 0
      const debtSalesTotal = parseFloat(debtRes[0]?.total) || 0
      const digitalSalesTotal = parseFloat(digitalSalesRes[0]?.total) || 0
      const repayTotal = parseFloat(repayRes[0]?.total) || 0
      const returnsTotal = parseFloat(returnsRes[0]?.total) || 0
      const supplierTotal = parseFloat(supplierRes[0]?.total) || 0
      const expensesTotal = parseFloat(expensesRes[0]?.total) || 0
      
      const expected = initialCash + allSalesTotal - debtSalesTotal - digitalSalesTotal + repayTotal - returnsTotal - supplierTotal - expensesTotal

      setMainDrawerSummary({
        initialCash,
        expectedCash: expected,
        allSales: allSalesTotal,
        cashSales: cashSalesTotal,
        debtSales: debtSalesTotal,
        digitalSales: digitalSalesTotal,
        inflows: repayTotal,
        returns: returnsTotal,
        supplierPayments: supplierTotal,
        expenses: expensesTotal
      })
    } catch (err) {
      console.error('fetchMainDrawerData error:', err)
    }
  }, [currentShift])

  // Fetch all data on mount or shift change
  useEffect(() => {
    if (currentShift) {
      fetchMainDrawerData()
      momkn.fetchMomknData()
      mobileMoney.fetchMobileMoneyData()
    }
  }, [currentShift, fetchMainDrawerData])


  // Print Handlers (Admin Only)
  const handlePrintMomknReport = () => {
    if (!isAdmin) {
      triggerCustomAlert('طباعة التقارير مخصصة للمدير فقط!')
      return
    }
    if (!window.api || !window.api.printer || !window.api.printer.print) {
      triggerCustomAlert('طابعة الفواتير غير متصلة أو غير معرفة!')
      return
    }

    const html = generateMomknReportHtml({
      shift: { ...currentShift, username: currentUser.username },
      transactions: momkn.transactions,
      summary: momkn.summary
    })

    window.api.printer.print(html)
      .then(() => triggerCustomAlert('تم إرسال تقرير ممكن للطابعة بنجاح.'))
      .catch(e => triggerCustomAlert('فشل الطباعة: ' + getFriendlyErrorMessage(e)))
  }

  const handlePrintMobileMoneyReport = () => {
    if (!isAdmin) {
      triggerCustomAlert('طباعة التقارير مخصصة للمدير فقط!')
      return
    }
    if (!window.api || !window.api.printer || !window.api.printer.print) {
      triggerCustomAlert('طابعة الفواتير غير متصلة أو غير معرفة!')
      return
    }

    const html = generateMobileMoneyReportHtml({
      shift: { ...currentShift, username: currentUser.username },
      transactions: mobileMoney.rawTransactions, // rawTransactions bypasses platformFilter
      summary: mobileMoney.summary
    })

    window.api.printer.print(html)
      .then(() => triggerCustomAlert('تم إرسال تقرير المحافظ للطابعة بنجاح.'))
      .catch(e => triggerCustomAlert('فشل الطباعة: ' + getFriendlyErrorMessage(e)))
  }

  return (
    <div className="tab-container" style={{ padding: '15px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Sub-Tabs Selector */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>
        <button 
          className={`btn ${activeSubTab === 'supermarket' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('supermarket')}
          style={{ padding: '8px 16px', fontWeight: 'bold' }}
        >
          🏪 درج السوبر ماركت (كاش)
        </button>
        <button 
          className={`btn ${activeSubTab === 'momkn' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('momkn')}
          style={{ padding: '8px 16px', fontWeight: 'bold' }}
        >
          📊 درج ماكينة ممكن
        </button>
        <button 
          className={`btn ${activeSubTab === 'mobile_money' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('mobile_money')}
          style={{ padding: '8px 16px', fontWeight: 'bold' }}
        >
          💰 درج المحافظ والتحويلات
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Tab 1: Supermarket Till */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeSubTab === 'supermarket' && (
        <div>
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div className="stat-card" style={{ padding: '15px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ color: '#4b5563', fontSize: '12px', fontWeight: '600' }}>العهدة الافتتاحية الكاش</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px', color: '#111827' }}>{formatVal(mainDrawerSummary.initialCash)} ج.م</div>
            </div>
            <div className="stat-card" style={{ padding: '15px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ color: '#4b5563', fontSize: '12px', fontWeight: '600' }}>إجمالي مبيعات الفواتير بالكامل</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px', color: '#10b981' }}>+{formatVal(mainDrawerSummary.allSales)} ج.م</div>
            </div>
            {(mainDrawerSummary.debtSales > 0 || mainDrawerSummary.digitalSales > 0) && (
              <div className="stat-card" style={{ padding: '15px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ color: '#4b5563', fontSize: '12px', fontWeight: '600' }}>آجل وتحويلات (لم تدخل كاش)</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px', color: '#f59e0b' }}>-{formatVal(mainDrawerSummary.debtSales + mainDrawerSummary.digitalSales)} ج.م</div>
              </div>
            )}
            <div className="stat-card" style={{ padding: '15px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ color: '#4b5563', fontSize: '12px', fontWeight: '600' }}>سداد ديون عملاء (دخل الخزنة)</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px', color: '#10b981' }}>+{formatVal(mainDrawerSummary.inflows)} ج.م</div>
            </div>
            <div className="stat-card" style={{ padding: '15px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ color: '#4b5563', fontSize: '12px', fontWeight: '600' }}>مدفوعات موردين (كاش - خرج)</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px', color: '#ef4444' }}>-{formatVal(mainDrawerSummary.supplierPayments)} ج.م</div>
            </div>
            <div className="stat-card" style={{ padding: '15px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ color: '#4b5563', fontSize: '12px', fontWeight: '600' }}>مصروفات ونثريات (كاش - خرج)</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px', color: '#ef4444' }}>-{formatVal(mainDrawerSummary.expenses)} ج.م</div>
            </div>
            <div className="stat-card" style={{ padding: '15px', backgroundColor: '#dcfce7', borderRadius: '8px', border: '1px solid #bbf7d0', gridColumn: 'span 3', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ color: '#15803d', fontSize: '13px', fontWeight: 'bold' }}>صافي الكاش المتوقع في الدرج حالياً</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '5px', color: '#15803d' }}>{formatVal(mainDrawerSummary.expectedCash)} ج.م</div>
            </div>
          </div>
          <div className="text-center" style={{ color: '#4b5563', padding: '20px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <p style={{ margin: 0 }}>ℹ️ يتم احتساب عمليات مبيعات الكاش والمدفوعات العامة تلقائياً بناءً على مبيعات الوردية النشطة وسجل حركة الخزنة.</p>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Tab 2: Momkn Till */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeSubTab === 'momkn' && (
        <div>
          {/* Summary Grid */}
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div className="stat-card" style={{ padding: '15px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ color: '#4b5563', fontSize: '12px', fontWeight: '600' }}>رصيد ماكينة ممكن الافتتاحي</div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '5px', color: '#111827' }}>{formatVal(momkn.summary?.startBalance)} ج.م</div>
            </div>
            <div className="stat-card" style={{ padding: '15px', backgroundColor: '#dbeafe', borderRadius: '8px', border: '1px solid #bfdbfe', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ color: '#1e40af', fontSize: '12px', fontWeight: 'bold' }}>رصيد ماكينة ممكن المتوقع حالياً</div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '5px', color: '#1e40af' }}>{formatVal(momkn.summary?.expectedDigitalBalance)} ج.م</div>
              <small style={{ color: '#6b7280', fontSize: '10px' }}>بداية الوردية + التأثير الرقمي</small>
            </div>
            <div className="stat-card" style={{ padding: '15px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ color: '#4b5563', fontSize: '12px', fontWeight: '600' }}>كاش فكة درج المكنة الافتتاحي</div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '5px', color: '#111827' }}>{formatVal(momkn.summary?.startCash)} ج.م</div>
            </div>
            <div className="stat-card" style={{ padding: '15px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ color: '#4b5563', fontSize: '12px', fontWeight: '600' }}>تأثير العمليات على كاش الدرج</div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '5px', color: (momkn.summary?.totalCashImpact || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                {(momkn.summary?.totalCashImpact || 0) >= 0 ? '+' : ''}{formatVal(momkn.summary?.totalCashImpact)} ج.م
              </div>
            </div>
            <div className="stat-card" style={{ padding: '15px', backgroundColor: '#dcfce7', borderRadius: '8px', border: '1px solid #bbf7d0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ color: '#15803d', fontSize: '12px', fontWeight: 'bold' }}>صافي الكاش الورق المتوقع بالدرج</div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '5px', color: '#15803d' }}>{formatVal(momkn.summary?.expectedCash)} ج.م</div>
              <small style={{ color: '#15803d', fontSize: '10px' }}>الفكة + تأثير العمليات</small>
            </div>
            <div className="stat-card" style={{ padding: '15px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ color: '#4b5563', fontSize: '12px', fontWeight: '600' }}>صافي عمولات ممكن للوردية</div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '5px', color: '#3b82f6' }}>{formatVal(momkn.summary?.totalCommission)} ج.م</div>
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <button className="btn btn-success" onClick={() => momkn.setModalOpen(true)}>
              ➕ تسجيل حركة رصيد / كاش
            </button>
            {isAdmin && (
              <button className="btn btn-primary" onClick={handlePrintMomknReport}>
                🖨️ طباعة تقرير الجرد
              </button>
            )}
          </div>

          {/* Transactions Table */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden', marginTop: '15px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', color: '#1f2937' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#4b5563' }}>التوقيت</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#4b5563' }}>نوع العملية</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#4b5563' }}>الوصف</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#4b5563' }}>الرصيد الرقمي</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#4b5563' }}>الكاش المتأثر</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#4b5563' }}>العمولة</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#4b5563' }}>ملاحظات</th>
                  {isAdmin && <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#4b5563' }}>إجراءات</th>}
                </tr>
              </thead>
              <tbody>
                {(!momkn.transactions || momkn.transactions.length === 0) ? (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 7} style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                      لا توجد عمليات مسجلة لماكينة ممكن في هذا الشفت بعد.
                    </td>
                  </tr>
                ) : (
                  momkn.transactions.map((t, idx) => (
                    <tr 
                      key={t.id} 
                      style={{ 
                        borderBottom: '1px solid #e5e7eb', 
                        backgroundColor: idx % 2 === 0 ? 'transparent' : '#f9fafb'
                      }}
                    >
                      <td style={{ padding: '12px 16px', color: '#1f2937' }}>{t.timestamp ? (t.timestamp.split(' ')[1] || t.timestamp) : '-'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span 
                          style={{ 
                            padding: '4px 10px', 
                            borderRadius: '6px', 
                            fontSize: '0.78rem', 
                            fontWeight: '600',
                            backgroundColor: t.operation_type === 'payment' ? 'rgba(59,130,246,0.1)' : t.operation_type === 'recharge' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            color: t.operation_type === 'payment' ? '#1e40af' : t.operation_type === 'recharge' ? '#065f46' : '#991b1b',
                            border: t.operation_type === 'payment' ? '1px solid rgba(59,130,246,0.2)' : t.operation_type === 'recharge' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)',
                            display: 'inline-block' 
                          }}
                        >
                          {t.operation_type === 'payment' && 'دفع لعميل'}
                          {t.operation_type === 'recharge' && 'شحن المكنة'}
                          {t.operation_type === 'refund' && 'مرتجع عملية'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '500', color: '#111827' }}>{t.description}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: (t.digital_impact || 0) >= 0 ? '#10b981' : '#ef4444', fontWeight: '700' }}>
                        {(t.digital_impact || 0) >= 0 ? '+' : ''}{formatVal(t.digital_impact)} ج.م
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: (t.cash_impact || 0) >= 0 ? '#10b981' : '#ef4444', fontWeight: '700' }}>
                        {(t.cash_impact || 0) >= 0 ? '+' : ''}{formatVal(t.cash_impact)} ج.م
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: '#1e40af', fontWeight: '600' }}>{formatVal(t.commission)} ج.م</td>
                      <td style={{ padding: '12px 16px', color: '#4b5563' }}>{t.notes || '-'}</td>
                      {isAdmin && (
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '4px 10px', fontSize: '0.78rem', borderRadius: '5px' }}
                            onClick={() => momkn.handleDeleteTransaction(t.id)}
                          >
                            حذف
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Tab 3: Mobile Money Till */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeSubTab === 'mobile_money' && (
        <div>
          {/* Summary Grid */}
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div className="stat-card" style={{ padding: '15px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ color: '#4b5563', fontSize: '11px', fontWeight: '600' }}>كاش درج فودافون الافتتاحي</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '5px', color: '#111827' }}>{formatVal(mobileMoney.summary?.startCash)} ج.م</div>
            </div>
            <div className="stat-card" style={{ padding: '15px', backgroundColor: '#dcfce7', borderRadius: '8px', border: '1px solid #bbf7d0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ color: '#15803d', fontSize: '11px', fontWeight: 'bold' }}>صافي الكاش الورق المتوقع بالدرج</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '5px', color: '#15803d' }}>{formatVal(mobileMoney.summary?.expectedCash)} ج.م</div>
            </div>
            
            <div className="stat-card" style={{ padding: '15px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ color: '#4b5563', fontSize: '11px', fontWeight: '600' }}>رصيد فودافون الافتتاحي</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '5px', color: '#111827' }}>{formatVal(mobileMoney.summary?.startBalance)} ج.م</div>
            </div>
            <div className="stat-card" style={{ padding: '15px', backgroundColor: '#dcfce7', borderRadius: '8px', border: '1px solid #bbf7d0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ color: '#15803d', fontSize: '11px', fontWeight: 'bold' }}>رصيد فودافون كاش المتوقع</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '5px', color: '#15803d' }}>{formatVal(mobileMoney.summary?.expectedVfcashDigitalBalance)} ج.م</div>
            </div>
            <div className="stat-card" style={{ padding: '15px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ color: '#4b5563', fontSize: '11px', fontWeight: '600' }}>متحصلات انستا باي (ديجيتال)</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '5px', color: '#10b981' }}>{formatVal(mobileMoney.summary?.expectedInstapayDigitalBalance)} ج.م</div>
            </div>
            <div className="stat-card" style={{ padding: '15px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ color: '#4b5563', fontSize: '11px', fontWeight: '600' }}>متحصلات تحويل بنكي (ديجيتال)</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '5px', color: '#10b981' }}>{formatVal(mobileMoney.summary?.expectedBankDigitalBalance)} ج.م</div>
            </div>
            <div className="stat-card" style={{ padding: '15px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ color: '#4b5563', fontSize: '11px', fontWeight: '600' }}>التأثير الصافي على الكاش</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '5px', color: (mobileMoney.summary?.totalCashImpact || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                {(mobileMoney.summary?.totalCashImpact || 0) >= 0 ? '+' : ''}{formatVal(mobileMoney.summary?.totalCashImpact)} ج.م
              </div>
            </div>
            <div className="stat-card" style={{ padding: '15px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ color: '#4b5563', fontSize: '11px', fontWeight: '600' }}>صافي عمولات المحافظ</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '5px', color: '#3b82f6' }}>{formatVal(mobileMoney.summary?.totalCommission)} ج.م</div>
            </div>
          </div>

          {/* Filters & Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', gap: '15px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button className="btn btn-success" onClick={() => mobileMoney.setModalOpen(true)}>
                ➕ تسجيل حركة محفظة
              </button>
              {isAdmin && (
                <button className="btn btn-primary" onClick={handlePrintMobileMoneyReport}>
                  🖨️ طباعة تقرير الجرد
                </button>
              )}
            </div>

            {/* Platform Filter */}
            <div style={{ display: 'flex', gap: '5px', backgroundColor: '#ffffff', padding: '4px', borderRadius: '6px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <button 
                className="btn" 
                style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: mobileMoney.platformFilter === 'all' ? '#10b981' : 'transparent', color: mobileMoney.platformFilter === 'all' ? '#fff' : '#4b5563' }}
                onClick={() => mobileMoney.setPlatformFilter('all')}
              >
                الكل
              </button>
              <button 
                className="btn" 
                style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: mobileMoney.platformFilter === 'vodafone_cash' ? '#10b981' : 'transparent', color: mobileMoney.platformFilter === 'vodafone_cash' ? '#fff' : '#4b5563' }}
                onClick={() => mobileMoney.setPlatformFilter('vodafone_cash')}
              >
                فودافون كاش
              </button>
              <button 
                className="btn" 
                style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: mobileMoney.platformFilter === 'instapay' ? '#10b981' : 'transparent', color: mobileMoney.platformFilter === 'instapay' ? '#fff' : '#4b5563' }}
                onClick={() => mobileMoney.setPlatformFilter('instapay')}
              >
                انستاباي
              </button>
              <button 
                className="btn" 
                style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: mobileMoney.platformFilter === 'bank_transfer' ? '#10b981' : 'transparent', color: mobileMoney.platformFilter === 'bank_transfer' ? '#fff' : '#4b5563' }}
                onClick={() => mobileMoney.setPlatformFilter('bank_transfer')}
              >
                تحويل بنكي
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden', marginTop: '15px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', color: '#1f2937' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#4b5563' }}>التوقيت</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#4b5563' }}>المنصة</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#4b5563' }}>نوع العملية</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#4b5563' }}>الرصيد الرقمي</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#4b5563' }}>الكاش المتأثر</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#4b5563' }}>العمولة</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#4b5563' }}>المستلم/الهاتف</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#4b5563' }}>ملاحظات</th>
                  {isAdmin && <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#4b5563' }}>إجراءات</th>}
                </tr>
              </thead>
              <tbody>
                {(!mobileMoney.transactions || mobileMoney.transactions.length === 0) ? (
                  <tr>
                    <td colSpan={isAdmin ? 9 : 8} style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                      لا توجد عمليات تطابق الفلتر المختار لهذا الشفت.
                    </td>
                  </tr>
                ) : (
                  mobileMoney.transactions.map((t, idx) => (
                    <tr 
                      key={t.id} 
                      style={{ 
                        borderBottom: '1px solid #e5e7eb', 
                        backgroundColor: idx % 2 === 0 ? 'transparent' : '#f9fafb'
                      }}
                    >
                      <td style={{ padding: '12px 16px', color: '#1f2937' }}>{t.timestamp ? (t.timestamp.split(' ')[1] || t.timestamp) : '-'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#111827' }}>
                          {t.platform === 'vodafone_cash' && '🔴 فودافون كاش'}
                          {t.platform === 'instapay' && '⚡ انستاباي'}
                          {t.platform === 'bank_transfer' && '🏦 تحويل بنكي'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span 
                          style={{ 
                            padding: '4px 10px', 
                            borderRadius: '6px', 
                            fontSize: '0.78rem', 
                            fontWeight: '600',
                            backgroundColor: t.operation_type === 'withdraw_from_client' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            color: t.operation_type === 'withdraw_from_client' ? '#065f46' : '#991b1b',
                            border: t.operation_type === 'withdraw_from_client' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)',
                            display: 'inline-block' 
                          }}
                        >
                          {t.operation_type === 'withdraw_from_client' ? 'سحب من زبون (سائل)' : 'إيداع لزبون (رصيد)'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: (t.digital_impact || 0) >= 0 ? '#10b981' : '#ef4444', fontWeight: '700' }}>
                        {(t.digital_impact || 0) >= 0 ? '+' : ''}{formatVal(t.digital_impact)} ج.م
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: (t.cash_impact || 0) >= 0 ? '#10b981' : '#ef4444', fontWeight: '700' }}>
                        {(t.cash_impact || 0) >= 0 ? '+' : ''}{formatVal(t.cash_impact)} ج.m
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: '#1e40af', fontWeight: '600' }}>{formatVal(t.commission)} ج.م</td>
                      <td style={{ padding: '12px 16px', color: '#111827' }}>
                        {t.recipient_name ? `${t.recipient_name} | ` : ''}
                        <span style={{ direction: 'ltr', display: 'inline-block' }}>{t.phone_or_account || '-'}</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#4b5563' }}>{t.notes || '-'}</td>
                      {isAdmin && (
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '4px 10px', fontSize: '0.78rem', borderRadius: '5px' }}
                            onClick={() => mobileMoney.handleDeleteTransaction(t.id)}
                          >
                            حذف
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Modals Mounting */}
      {/* ───────────────────────────────────────────────────────────── */}
      <MomknOperationModal 
        isOpen={momkn.modalOpen}
        onClose={() => momkn.setModalOpen(false)}
        onSubmit={momkn.handleAddTransaction}
      />
      <MobileMoneyOperationModal 
        isOpen={mobileMoney.modalOpen}
        onClose={() => mobileMoney.setModalOpen(false)}
        onSubmit={mobileMoney.handleAddTransaction}
      />
    </div>
  )
}

export default TillsManagerTab
