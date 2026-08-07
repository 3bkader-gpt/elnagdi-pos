import React, { useState, useEffect, useCallback } from 'react'
import { Calendar, User, DollarSign, Calculator, Smartphone, Wallet, ArrowLeft, ArrowRight, Award, AlertTriangle, CheckCircle, Clock, Printer } from 'lucide-react'
import { executeQuery } from '../../lib/db'
import { generateMonthlyReportHtml } from '../../lib/printTemplates'

const fmt = (v) => (Number(v) || 0).toFixed(2)

export default function MonthlyReportsTab() {
  const [periods, setPeriods] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const [summary, setSummary] = useState(null)
  const [cashiers, setCashiers] = useState([])
  const [loading, setLoading] = useState(false)

  // 1. Generate monthly periods based on data
  // Period format: starts on day 6 of month N, ends on day 5 of month N+1
  // First period starts from the earliest shift date (2026-07-21) and ends on 2026-08-05
  const generatePeriods = useCallback(async () => {
    try {
      const rows = await executeQuery(`SELECT MIN(start_time) as first_date, MAX(start_time) as last_date FROM shifts;`)
      if (!rows || !rows[0] || !rows[0].first_date) {
        setPeriods([])
        return
      }

      const firstDate = new Date(rows[0].first_date)
      const lastDate = new Date() // Current date

      const generated = []
      let currentStart = new Date(firstDate)
      
      // We want to loop month by month
      while (currentStart <= lastDate) {
        const year = currentStart.getFullYear()
        const month = currentStart.getMonth() // 0-indexed

        // Current period end date is day 5 of the next month (or current month if start is earlier)
        let periodEnd = new Date(year, month, 5, 23, 59, 59)
        
        // If currentStart is already past day 5 of this month, the end is day 5 of next month
        if (currentStart.getDate() > 5) {
          periodEnd = new Date(year, month + 1, 5, 23, 59, 59)
        }

        // Adjust start of period: 
        // If it's the very first period, it starts from firstDate.
        // Otherwise, it starts from day 6 of the previous month.
        let periodStart = new Date(periodEnd)
        periodStart.setMonth(periodEnd.getMonth() - 1)
        periodStart.setDate(6)
        periodStart.setHours(0, 0, 0, 0)

        if (periodStart < firstDate) {
          periodStart = new Date(firstDate)
        }

        // Format dates
        const startStr = periodStart.toISOString().split('T')[0] + ' 00:00:00'
        const endStr = periodEnd.toISOString().split('T')[0] + ' 23:59:59'
        const label = `من ${periodStart.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })} إلى ${periodEnd.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}`
        const key = `${startStr}_${endStr}`

        // Avoid adding duplicate ranges
        if (!generated.some(p => p.key === key)) {
          generated.push({ key, label, start: startStr, end: endStr, year: periodEnd.getFullYear(), month: periodEnd.getMonth() + 1 })
        }

        // Move to the next period start
        currentStart = new Date(periodEnd)
        currentStart.setDate(6)
      }

      // Sort periods descending (latest first)
      const sorted = generated.reverse()
      setPeriods(sorted)
      if (sorted.length > 0) {
        setSelectedPeriod(sorted[0])
      }
    } catch (e) {
      console.error('Failed to generate monthly periods:', e)
    }
  }, [])

  // 2. Fetch stats for the selected period
  const fetchPeriodStats = useCallback(async (period) => {
    if (!period) return
    setLoading(true)
    try {
      const { start, end } = period

      // Fetch closed shifts in this period
      const shifts = await executeQuery(`
        SELECT s.*, u.username 
        FROM shifts s
        JOIN users u ON s.user_id = u.id
        WHERE s.status = 'closed' AND s.start_time >= '${start}' AND s.start_time <= '${end}';
      `)

      const shiftIds = shifts.map(s => s.id).join(',')

      // Overall calculations
      let supermarketSales = 0
      let cashSales = 0
      let debtSales = 0
      let digitalSales = 0
      let discounts = 0
      let expenses = 0
      let supplierPayments = 0
      let customerInflows = 0
      let netSalesProfit = 0

      let expectedSupermarket = 0
      let actualSupermarket = 0
      let difference = 0
      let positiveDiffs = 0
      let negativeDiffs = 0

      let momknCash = 0
      let momknDigital = 0
      let momknCommission = 0
      let momknCount = 0

      let mmCash = 0
      let mmDigital = 0
      let mmCommission = 0
      let mmCount = 0

      if (shifts.length > 0) {
        // Supermarket sales
        const salesRes = await executeQuery(`
          SELECT 
            COALESCE(SUM(total_amount), 0) as total,
            COALESCE(SUM(CASE WHEN payment_type='نقدي' THEN total_amount ELSE 0 END), 0) as cash,
            COALESCE(SUM(CASE WHEN payment_type='آجل' THEN total_amount ELSE 0 END), 0) as debt,
            COALESCE(SUM(CASE WHEN payment_type NOT IN ('نقدي','آجل') THEN total_amount ELSE 0 END), 0) as digital,
            COALESCE(SUM(discount), 0) as discount
          FROM sales WHERE shift_id IN (${shiftIds});
        `)
        if (salesRes && salesRes[0]) {
          supermarketSales = salesRes[0].total
          cashSales = salesRes[0].cash
          debtSales = salesRes[0].debt
          digitalSales = salesRes[0].digital
          discounts = salesRes[0].discount
        }

        // Net Sales Profit based on cost_price
        const profitRes = await executeQuery(`
          SELECT SUM((si.unit_price - COALESCE(NULLIF(si.cost_price, 0), p.cost_price, 0)) * (si.quantity - si.returned_qty)) as profit
          FROM sale_items si
          JOIN sales s ON si.sale_id = s.id
          LEFT JOIN products p ON si.product_barcode = p.barcode
          WHERE s.shift_id IN (${shiftIds});
        `)
        netSalesProfit = profitRes[0]?.profit || 0

        // Expenses
        const expRes = await executeQuery(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE shift_id IN (${shiftIds});`)
        expenses = expRes[0]?.total || 0

        // Inflows and outflows in safe ledger
        const inflowsRes = await executeQuery(`SELECT COALESCE(SUM(amount), 0) as total FROM safe_ledger WHERE shift_id IN (${shiftIds}) AND type='inflow';`)
        customerInflows = inflowsRes[0]?.total || 0

        const supplierOutRes = await executeQuery(`
          SELECT COALESCE(SUM(amount), 0) as total 
          FROM safe_ledger 
          WHERE shift_id IN (${shiftIds}) AND type='outflow' AND (description LIKE 'دفعة لمورد%' OR description LIKE 'سداد دين مورد%');
        `)
        supplierPayments = supplierOutRes[0]?.total || 0

        // Totals from shifts table
        shifts.forEach(s => {
          expectedSupermarket += s.expected_end_cash || 0
          actualSupermarket += s.actual_end_cash || 0
          const diff = s.difference || 0
          difference += diff
          if (diff > 0) positiveDiffs += diff
          if (diff < 0) negativeDiffs += Math.abs(diff)
        })

        // Momkn Transactions
        const momknRes = await executeQuery(`
          SELECT 
            COALESCE(SUM(cash_impact), 0) as cash,
            COALESCE(SUM(digital_impact), 0) as digital,
            COALESCE(SUM(commission), 0) as comm,
            COUNT(*) as cnt
          FROM momkn_transactions WHERE shift_id IN (${shiftIds});
        `)
        if (momknRes && momknRes[0]) {
          momknCash = momknRes[0].cash
          momknDigital = momknRes[0].digital
          momknCommission = momknRes[0].comm
          momknCount = momknRes[0].cnt
        }

        // Mobile Money Transactions
        const mmRes = await executeQuery(`
          SELECT 
            COALESCE(SUM(cash_impact), 0) as cash,
            COALESCE(SUM(digital_impact), 0) as digital,
            COALESCE(SUM(commission), 0) as comm,
            COUNT(*) as cnt
          FROM mobile_money_transactions WHERE shift_id IN (${shiftIds});
        `)
        if (mmRes && mmRes[0]) {
          mmCash = mmRes[0].cash
          mmDigital = mmRes[0].digital
          mmCommission = mmRes[0].comm
          mmCount = mmRes[0].cnt
        }
      }

      setSummary({
        shiftsCount: shifts.length,
        supermarketSales,
        cashSales,
        debtSales,
        digitalSales,
        discounts,
        expenses,
        supplierPayments,
        customerInflows,
        expectedSupermarket,
        actualSupermarket,
        difference,
        positiveDiffs,
        negativeDiffs,
        momknCash,
        momknDigital,
        momknCommission,
        momknCount,
        mmCash,
        mmDigital,
        mmCommission,
        mmCount,
        netSalesProfit,
        netProfit: netSalesProfit - expenses + (momknCommission + mmCommission)
      })

      // Fetch stats aggregated per cashier
      if (shifts.length > 0) {
        const cashiersData = await executeQuery(`
          SELECT 
            u.username,
            COUNT(s.id) as shifts_worked,
            COALESCE((SELECT SUM(total_amount) FROM sales WHERE shift_id IN (${shiftIds}) AND shift_id IN (SELECT id FROM shifts WHERE user_id = u.id)), 0) as sales_total,
            COALESCE((SELECT SUM(total_amount) FROM sales WHERE shift_id IN (${shiftIds}) AND payment_type='نقدي' AND shift_id IN (SELECT id FROM shifts WHERE user_id = u.id)), 0) as sales_cash,
            COALESCE((SELECT SUM(total_amount) FROM sales WHERE shift_id IN (${shiftIds}) AND payment_type='آجل' AND shift_id IN (SELECT id FROM shifts WHERE user_id = u.id)), 0) as sales_debt,
            COALESCE((SELECT SUM(difference) FROM shifts WHERE id IN (${shiftIds}) AND user_id = u.id), 0) as net_diff,
            COALESCE((SELECT SUM(CASE WHEN difference < 0 THEN difference ELSE 0 END) FROM shifts WHERE id IN (${shiftIds}) AND user_id = u.id), 0) as total_shortage,
            COALESCE((SELECT SUM(CASE WHEN difference > 0 THEN difference ELSE 0 END) FROM shifts WHERE id IN (${shiftIds}) AND user_id = u.id), 0) as total_surplus
          FROM users u
          JOIN shifts s ON s.user_id = u.id
          WHERE s.id IN (${shiftIds})
          GROUP BY u.id;
        `)
        setCashiers(cashiersData || [])
      } else {
        setCashiers([])
      }
    } catch (e) {
      console.error('Failed to load period stats:', e)
    }
    setLoading(false)
  }, [])

  const handlePrintReport = async () => {
    if (!selectedPeriod || !summary) return
    const html = generateMonthlyReportHtml({
      periodLabel: selectedPeriod.label,
      summary,
      cashiers
    })
    if (window.api && window.api.printer && window.api.printer.print) {
      try {
        await window.api.printer.print(html)
      } catch (e) {
        console.error('Failed to print monthly report:', e)
      }
    }
  }

  useEffect(() => {
    generatePeriods()
  }, [generatePeriods])

  useEffect(() => {
    fetchPeriodStats(selectedPeriod)
  }, [selectedPeriod, fetchPeriodStats])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* Selector Card */}
      <div className="admin-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Calendar size={22} color="var(--accent-blue)" />
          <h3 style={{ margin: 0 }}>التقرير المالي وجرد الكاشيرات الشهري</h3>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {summary && (
            <button 
              onClick={handlePrintReport} 
              className="btn btn-secondary" 
              style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold', background: 'var(--accent-blue)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <Printer size={15} /> طباعة تقرير الشهر
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>اختر الشهر المالي:</span>
            <select 
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontFamily: 'inherit', fontWeight: 700 }}
              value={selectedPeriod ? selectedPeriod.key : ''}
              onChange={(e) => {
                const selected = periods.find(p => p.key === e.target.value)
                setSelectedPeriod(selected)
              }}
            >
              {periods.map(p => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: 50, color: 'var(--text-muted)' }}>جاري تحميل التقرير المالي للشهر المختار...</div>
      ) : summary ? (
        <>
          {/* Main stats layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            
            {/* Supermarket Summary */}
            <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#2563eb', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
                <Calculator size={18} /> درج كاش السوبر ماركت الرئيسي
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>إجمالي مبيعات كاش بالدرج:</span>
                  <strong style={{ color: '#16a34a' }}>+ {fmt(summary.cashSales)} ج.م</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>مقبوضات ديون عملاء (دخلت الدرج):</span>
                  <strong style={{ color: '#16a34a' }}>+ {fmt(summary.customerInflows)} ج.م</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>مدفوعات لموردين (خرجت من الدرج):</span>
                  <strong style={{ color: '#dc2626' }}>- {fmt(summary.supplierPayments)} ج.م</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>نثريات ومصاريف عامة:</span>
                  <strong style={{ color: '#dc2626' }}>- {fmt(summary.expenses)} ج.م</strong>
                </div>
                <div style={{ borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                  <span style={{ fontWeight: 700 }}>صافي المتوقع التراكمي بالدرج:</span>
                  <strong style={{ color: '#2563eb' }}>{fmt(summary.expectedSupermarket)} ج.م</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                  <span style={{ fontWeight: 700 }}>إجمالي الفعلي المستلم للمالك:</span>
                  <strong style={{ color: '#10b981' }}>{fmt(summary.actualSupermarket)} ج.م</strong>
                </div>
              </div>
            </div>

            {/* Profitability Analysis */}
            <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
                <DollarSign size={18} /> تحليل صافي الأرباح وهوامش الربح
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>صافي ربح المنتجات المباعة:</span>
                  <strong style={{ color: '#16a34a' }}>+ {fmt(summary.netSalesProfit)} ج.م</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>أرباح عمولات ماكينة ممكن:</span>
                  <strong style={{ color: '#16a34a' }}>+ {fmt(summary.momknCommission)} ج.م</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>أرباح عمولات المحافظ الرقمية:</span>
                  <strong style={{ color: '#16a34a' }}>+ {fmt(summary.mmCommission)} ج.م</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>المصاريف والنثريات العامة:</span>
                  <strong style={{ color: '#dc2626' }}>- {fmt(summary.expenses)} ج.م</strong>
                </div>
                <div style={{ borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: '0.98rem' }}>
                  <span style={{ fontWeight: 700 }}>صافي الربح الفعلي للمحل:</span>
                  <strong style={{ color: '#10b981', fontSize: '1.1rem' }}>{fmt(summary.netProfit)} ج.م</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <span>هامش الربح (Profit Margin):</span>
                  <strong>{summary.supermarketSales > 0 ? fmt((summary.netProfit / summary.supermarketSales) * 100) : '0.00'} %</strong>
                </div>
              </div>
            </div>

            {/* Reconciliation Discrepancies */}
            <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#d97706', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
                <AlertTriangle size={18} /> جرد الفروقات والعجوزات التراكمية
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>عدد الورديات المقفلة بالشهر:</span>
                  <strong>{summary.shiftsCount} وردية</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>إجمالي العجوزات التراكمية:</span>
                  <strong style={{ color: '#dc2626' }}>- {fmt(summary.negativeDiffs)} ج.م</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>إجمالي الزيادات التراكمية:</span>
                  <strong style={{ color: '#16a34a' }}>+ {fmt(summary.positiveDiffs)} ج.م</strong>
                </div>
                <div style={{ borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: '0.98rem' }}>
                  <span style={{ fontWeight: 700 }}>صافي عجز / زيادة الشهر بالكامل:</span>
                  <strong style={{ color: summary.difference < 0 ? '#dc2626' : summary.difference > 0 ? '#16a34a' : 'inherit' }}>
                    {summary.difference > 0 ? `+${fmt(summary.difference)}` : fmt(summary.difference)} ج.م
                  </strong>
                </div>
                <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 6, background: summary.difference === 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${summary.difference === 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}>
                  {summary.difference >= 0 ? <CheckCircle size={14} color="#16a34a" /> : <AlertTriangle size={14} color="#dc2626" />}
                  <span>{summary.difference >= 0 ? 'حسابات هذا الشهر مستقرة إجمالاً وبلا عجز صافي.' : `الدرج الرئيسي به عجز مالي متراكم بقيمة ${fmt(Math.abs(summary.difference))} ج.م.`}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Sales Distribution CSS Progress Bars */}
          <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>📊 توزيع طرق دفع المبيعات للشهر المالي</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Cash progress bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                  <span>💵 مبيعات نقدي (كاش)</span>
                  <strong>{summary.supermarketSales > 0 ? fmt((summary.cashSales / summary.supermarketSales) * 100) : '0.00'}% ({fmt(summary.cashSales)} ج.م)</strong>
                </div>
                <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${summary.supermarketSales > 0 ? (summary.cashSales / summary.supermarketSales) * 100 : 0}%`, height: '100%', background: '#16a34a', borderRadius: 4 }} />
                </div>
              </div>

              {/* Debt progress bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                  <span>👥 مبيعات آجل (شكك / ديون)</span>
                  <strong>{summary.supermarketSales > 0 ? fmt((summary.debtSales / summary.supermarketSales) * 100) : '0.00'}% ({fmt(summary.debtSales)} ج.م)</strong>
                </div>
                <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${summary.supermarketSales > 0 ? (summary.debtSales / summary.supermarketSales) * 100 : 0}%`, height: '100%', background: '#d97706', borderRadius: 4 }} />
                </div>
              </div>

              {/* Digital progress bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                  <span>⚡️ تحويلات رقمية (فيزا / انستا باي)</span>
                  <strong>{summary.supermarketSales > 0 ? fmt((summary.digitalSales / summary.supermarketSales) * 100) : '0.00'}% ({fmt(summary.digitalSales)} ج.م)</strong>
                </div>
                <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${summary.supermarketSales > 0 ? (summary.digitalSales / summary.supermarketSales) * 100 : 0}%`, height: '100%', background: '#7c3aed', borderRadius: 4 }} />
                </div>
              </div>
            </div>
          </div>

          {/* Cashiers performance card */}
          <div className="admin-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Award size={18} color="var(--accent-orange)" />
                <h3 style={{ margin: 0 }}>تقرير الكاشيرات الفردي وجرد العجوزات</h3>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>أداء كل كاشير خلال الفترة المالية المختارة</span>
            </div>
            
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>الكاشير</th>
                    <th>عدد الورديات</th>
                    <th>إجمالي مبيعاته الكلية</th>
                    <th>مبيعات الكاش</th>
                    <th>مبيعات الآجل (الديون)</th>
                    <th>إجمالي عجوزات الوردية</th>
                    <th>إجمالي زيادات الوردية</th>
                    <th>صافي فرق الكاشير للشهر</th>
                  </tr>
                </thead>
                <tbody>
                  {cashiers.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد ورديات مسجلة لكاشيرات خلال هذا الشهر المالي.</td>
                    </tr>
                  ) : (
                    cashiers.map(c => {
                      const net = c.total_surplus + c.total_shortage
                      return (
                        <tr key={c.username}>
                          <td style={{ fontWeight: 'bold' }}>{c.username}</td>
                          <td>{c.shifts_worked} وردية</td>
                          <td style={{ fontWeight: 600 }}>{fmt(c.sales_total)} ج.م</td>
                          <td style={{ color: '#16a34a' }}>{fmt(c.sales_cash)} ج.م</td>
                          <td style={{ color: '#d97706' }}>{fmt(c.sales_debt)} ج.م</td>
                          <td style={{ color: '#dc2626', fontWeight: 'bold' }}>{c.total_shortage < 0 ? `${fmt(c.total_shortage)}` : '0.00'} ج.م</td>
                          <td style={{ color: '#16a34a' }}>{c.total_surplus > 0 ? `+${fmt(c.total_surplus)}` : '0.00'} ج.م</td>
                          <td style={{ fontWeight: 'bold', color: net < 0 ? '#dc2626' : net > 0 ? '#16a34a' : 'inherit' }}>
                            {net > 0 ? `+${fmt(net)}` : fmt(net)} ج.م
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="admin-card" style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>لا توجد أي بيانات مالية مسجلة للنظام حتى الآن.</div>
      )}
    </div>
  )
}
