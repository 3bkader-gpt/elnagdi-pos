import React, { useEffect } from 'react'
import {
  DollarSign,
  CheckCircle,
  ShoppingCart,
  AlertTriangle,
  TrendingDown,
  Clock,
  Activity,
  BarChart2
} from 'lucide-react'

const PERIOD_LABELS = {
  daily: '🕒 اليوم',
  weekly: '📅 الأسبوع',
  monthly: '📊 الشهر',
  all: '🌐 الكل (كل الأوقات)'
}

export default function StatsTab({
  dbStats,
  statsPeriod,
  setStatsPeriod,
  periodicAnalytics,
  fetchAnalytics
}) {
  // Fetch when statsPeriod changes
  useEffect(() => {
    fetchAnalytics(statsPeriod)
  }, [statsPeriod])

  const profitMargin = periodicAnalytics?.totalSales > 0
    ? ((periodicAnalytics.netProfit / periodicAnalytics.totalSales) * 100).toFixed(0)
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ── Period Selector ───────────────────────────────────────── */}
      <div className="admin-card" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <BarChart2 size={20} style={{ color: 'var(--accent-blue)' }} />
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>فلترة الملخص المالي:</span>
          {['daily', 'weekly', 'monthly', 'all'].map(p => (
            <button
              key={p}
              onClick={() => setStatsPeriod(p)}
              style={{
                padding: '7px 18px',
                borderRadius: '8px',
                border: '2px solid',
                borderColor: statsPeriod === p ? 'var(--accent-blue)' : 'var(--border)',
                background: statsPeriod === p ? 'var(--accent-blue)' : 'transparent',
                color: statsPeriod === p ? '#fff' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all .2s'
              }}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Dynamic Stats Cards Grid ─────────────────────────────────── */}
      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        
        {/* Card 1: Total Sales */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent-blue)' }}>
            <DollarSign size={24} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">إجمالي المبيعات</span>
            <span className="admin-stat-value">{(periodicAnalytics?.totalSales || 0).toFixed(2)} ج.م</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              عدد العمليات: {periodicAnalytics?.invoiceCount || 0} فاتورة
            </span>
          </div>
        </div>
        
        {/* Card 2: Net Profits */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(5, 150, 105, 0.1)', color: 'var(--accent-emerald)' }}>
            <CheckCircle size={24} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">صافي الأرباح</span>
            <span className="admin-stat-value">{(periodicAnalytics?.netProfit || 0).toFixed(2)} ج.m</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
              هامش ربح المبيعات: {profitMargin}%
            </span>
          </div>
        </div>

        {/* Card 3: Total Expenses */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(220, 38, 38, 0.1)', color: 'var(--accent-rose)' }}>
            <TrendingDown size={24} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">إجمالي المصروفات</span>
            <span className="admin-stat-value" style={{ color: 'var(--accent-rose)' }}>
              {(periodicAnalytics?.totalExpenses || 0).toFixed(2)} ج.م
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              مصاريف تشغيلية مدفوعة
            </span>
          </div>
        </div>

        {/* Card 4: Net Cash Flow */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)' }}>
            <Activity size={24} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">السيولة النقدية (الخزينة)</span>
            <span className="admin-stat-value" style={{ color: (periodicAnalytics?.netCashFlow >= 0) ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
              {(periodicAnalytics?.netCashFlow || 0).toFixed(2)} ج.م
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              السيولة الداخلة (كاش - مصروفات)
            </span>
          </div>
        </div>

        {/* Card 5: Credit/Debt Sales */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-amber)' }}>
            <Clock size={24} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">مبيعات بالآجل (الديون)</span>
            <span className="admin-stat-value" style={{ color: 'var(--accent-amber)' }}>
              {(periodicAnalytics?.outstandingDebt || 0).toFixed(2)} ج.م
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              فواتير ذمم مستحقة على العملاء
            </span>
          </div>
        </div>

        {/* Card 6: Warehouse Snapshot */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent-blue)' }}>
            <ShoppingCart size={24} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">المخزن وحد الطلب</span>
            <span className="admin-stat-value">{dbStats?.totalItems || 0} صنف</span>
            <span style={{ fontSize: '0.75rem', color: dbStats?.lowStock > 0 ? 'var(--accent-rose)' : 'var(--text-secondary)', fontWeight: 700 }}>
              {dbStats?.lowStock > 0 ? `⚠️ يوجد ${dbStats.lowStock} صنف تحت حد الطلب` : '✅ جميع الأصناف متوفرة'}
            </span>
          </div>
        </div>

      </div>
      
      {/* ── Explanatory Box ────────────────────────────────────────── */}
      <div className="admin-card">
        <h3>ملخص مالي سريع</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          يقوم هذا الملخص بحساب الإيرادات، الأرباح، المصروفات والسيولة النقدية الفعلية بناءً على العمليات المسجلة خلال الفترة المحددة أعلاه. 
          تؤخذ بالاعتبار مبيعات الآجل لتحديد مستحقات العملاء، بينما تُحسب السيولة بناءً على النقد المحصل فعلياً مطروحاً منه المصروفات التشغيلية.
        </p>
      </div>
    </div>
  )
}
