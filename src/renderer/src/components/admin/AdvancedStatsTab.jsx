import React, { useEffect } from 'react'
import { useAdvancedAnalytics } from '../../hooks/useAdvancedAnalytics'
import {
  BarChart2, Calendar, TrendingUp, TrendingDown, DollarSign,
  ShoppingCart, Clock, Activity, Users, Award, RefreshCw,
  Package, CreditCard, AlertTriangle, Zap
} from 'lucide-react'

// ─── Small helpers ──────────────────────────────────────────────────
const fmt = (n) => (n || 0).toFixed(2)
const fmtInt = (n) => Math.round(n || 0).toLocaleString('ar-EG')

function StatCard({ icon, label, value, sub, color = '#3b82f6', bgColor }) {
  const bg = bgColor || `rgba(59,130,246,0.08)`
  return (
    <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ background: bg, color, borderRadius: 10, padding: 10, flexShrink: 0 }}>{icon}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{value}</span>
        {sub && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>{sub}</span>}
      </div>
    </div>
  )
}

function SectionTitle({ icon, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 0 10px', borderBottom: '2px solid var(--border-color)', marginBottom: 16 }}>
      <span style={{ color: 'var(--accent-blue)', opacity: 0.85 }}>{icon}</span>
      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>{title}</h3>
    </div>
  )
}

// CSS-only bar chart component
function BarChartCSS({ data, valueKey, labelKey, color = '#3b82f6' }) {
  if (!data || data.length === 0) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30, fontSize: '0.85rem' }}>لا توجد بيانات</div>
  const max = Math.max(...data.map(d => d[valueKey] || 0))
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140, overflowX: 'auto', padding: '0 4px 8px' }}>
      {data.map((d, i) => {
        const val = d[valueKey] || 0
        const pct = max > 0 ? (val / max) * 100 : 0
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: '0 0 auto', minWidth: 36 }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600 }}>{fmt(val)}</span>
            <div style={{ width: 28, height: `${Math.max(pct, 2)}%`, background: color, borderRadius: '4px 4px 0 0', transition: 'height 0.4s', minHeight: 4, opacity: 0.85 }} />
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: 40, wordBreak: 'break-all' }}>{d[labelKey]}</span>
          </div>
        )
      })}
    </div>
  )
}

function Stars({ count }) {
  return (
    <span style={{ color: '#f59e0b', fontSize: '0.85rem' }}>
      {'★'.repeat(count)}{'☆'.repeat(3 - count)}
    </span>
  )
}

// ─── Main Component ─────────────────────────────────────────────────
export default function AdvancedStatsTab() {
  const {
    loading, fromDate, setFromDate, toDate, setToDate,
    setQuickFilter, runAnalysis,
    summary, shiftRows, peakHours, dailyTrend, topProducts, paymentBreakdown
  } = useAdvancedAnalytics()

  // Run on first mount (today by default)
  useEffect(() => {
    runAnalysis()
  }, [])

  const QUICK_BTNS = [
    { key: 'today', label: '⏰ اليوم' },
    { key: 'yesterday', label: '📅 أمس' },
    { key: '3days', label: '3 أيام' },
    { key: 'week', label: '📊 أسبوع' },
    { key: 'month', label: '🗓️ شهر' },
    { key: 'all', label: '🌐 الكل' },
  ]

  // Peak hour
  const peakHour = peakHours.length > 0
    ? peakHours.reduce((a, b) => (b.total_sales > a.total_sales ? b : a))
    : null

  // Best day
  const bestDay = dailyTrend.length > 0
    ? dailyTrend.reduce((a, b) => (b.total_sales > a.total_sales ? b : a))
    : null

  // Smart summary text
  const smartSummary = (() => {
    if (!summary || summary.totalSales === 0) return 'لا توجد بيانات كافية لإنشاء الملخص الذكي للفترة المحددة.'
    const parts = []
    parts.push(`خلال الفترة المحددة حقق المتجر مبيعات بقيمة ${fmt(summary.totalSales)} ج.م من خلال ${fmtInt(summary.invoiceCount)} فاتورة.`)
    parts.push(`صافي الربح ${fmt(summary.netProfit)} ج.م بهامش ربح ${fmt(summary.profitMargin)}%.`)
    if (bestDay) parts.push(`أفضل يوم مبيعاً: ${bestDay.day} بإجمالي ${fmt(bestDay.total_sales)} ج.م.`)
    if (peakHour) parts.push(`أعلى ساعة مبيعاً: الساعة ${peakHour.hour}:00 (${fmt(peakHour.total_sales)} ج.م).`)
    if (topProducts.length > 0) parts.push(`الصنف الأكثر مبيعاً: ${topProducts[0].product_name} (${fmtInt(topProducts[0].qty_sold)} وحدة).`)
    if (summary.totalExpenses > 0) parts.push(`إجمالي المصروفات: ${fmt(summary.totalExpenses)} ج.م.`)
    return parts.join(' ')
  })()

  const panelStyle = { background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 14, padding: '18px 20px', boxShadow: 'var(--glass-shadow)' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, direction: 'rtl' }}>

      {/* ── Filter Panel ─────────────────────────────────────── */}
      <div style={panelStyle}>
        <SectionTitle icon={<Calendar size={18} />} title="تخصيص الفترة الزمنية" />

        {/* Quick buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {QUICK_BTNS.map(b => (
            <button key={b.key} onClick={() => setQuickFilter(b.key)}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit' }}>
              {b.label}
            </button>
          ))}
        </div>

        {/* Custom date inputs */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>من تاريخ وساعة</label>
            <input type="datetime-local" value={fromDate} onChange={e => setFromDate(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>حتى تاريخ وساعة</label>
            <input type="datetime-local" value={toDate} onChange={e => setToDate(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit' }} />
          </div>
          <button onClick={runAnalysis} disabled={loading}
            style={{ padding: '9px 24px', borderRadius: 8, border: 'none', background: 'var(--accent-blue)', color: '#fff', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
            <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'جاري التحليل...' : 'تشغيل التحليل'}
          </button>
        </div>
      </div>

      {/* No data state */}
      {!loading && summary && summary.totalSales === 0 && (
        <div style={{ ...panelStyle, textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🔍</div>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>لا توجد ورديات أو مبيعات في الفترة المحددة</div>
          <div style={{ fontSize: '0.85rem', marginTop: 6 }}>جرب تحديد فترة زمنية مختلفة أو اضغط على "الكل"</div>
        </div>
      )}

      {summary && summary.totalSales > 0 && (
        <>
          {/* ── KPI Summary Cards ─────────────────────────────── */}
          <div style={panelStyle}>
            <SectionTitle icon={<BarChart2 size={18} />} title="الملخص المالي الكامل" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              <StatCard icon={<DollarSign size={20} />} label="إجمالي المبيعات" value={`${fmt(summary.totalSales)} ج.م`} sub={`${fmtInt(summary.invoiceCount)} فاتورة`} color="#3b82f6" bgColor="rgba(59,130,246,0.1)" />
              <StatCard icon={<TrendingUp size={20} />} label="صافي الربح" value={`${fmt(summary.netProfit)} ج.م`} sub={`هامش الربح: ${fmt(summary.profitMargin)}%`} color="#10b981" bgColor="rgba(16,185,129,0.1)" />
              <StatCard icon={<TrendingDown size={20} />} label="إجمالي المصروفات" value={`${fmt(summary.totalExpenses)} ج.م`} sub="مصاريف تشغيلية" color="#ef4444" bgColor="rgba(239,68,68,0.1)" />
              <StatCard icon={<Activity size={20} />} label="السيولة النقدية" value={`${fmt(summary.netCashFlow)} ج.م`} sub="نقد داخل - مصروفات" color={summary.netCashFlow >= 0 ? '#10b981' : '#ef4444'} bgColor={summary.netCashFlow >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'} />
              <StatCard icon={<ShoppingCart size={20} />} label="متوسط الفاتورة" value={`${fmt(summary.avgInvoice)} ج.م`} sub="متوسط قيمة عملية شراء" color="#8b5cf6" bgColor="rgba(139,92,246,0.1)" />
              <StatCard icon={<Award size={20} />} label="أعلى فاتورة" value={`${fmt(summary.maxInvoice)} ج.م`} sub="أعلى قيمة فاتورة واحدة" color="#f59e0b" bgColor="rgba(245,158,11,0.1)" />
              <StatCard icon={<CreditCard size={20} />} label="مبيعات آجل" value={`${fmt(summary.debtSales)} ج.م`} sub="مبيعات على حساب عملاء" color="#f59e0b" bgColor="rgba(245,158,11,0.1)" />
              <StatCard icon={<RefreshCw size={20} />} label="إجمالي المرتجعات" value={`${fmt(summary.totalReturns)} ج.م`} sub={`${fmtInt(summary.returnCount)} عملية مرتجع`} color="#ec4899" bgColor="rgba(236,72,153,0.1)" />
              {summary.damagedCost > 0 && <StatCard icon={<AlertTriangle size={20} />} label="تكلفة التوالف" value={`${fmt(summary.damagedCost)} ج.م`} sub="بضائع تالفة مخصومة من الربح" color="#ef4444" bgColor="rgba(239,68,68,0.1)" />}
            </div>
          </div>

          {/* ── Daily Trend Chart ─────────────────────────────── */}
          {dailyTrend.length > 1 && (
            <div style={panelStyle}>
              <SectionTitle icon={<TrendingUp size={18} />} title="مبيعات كل يوم في الفترة" />
              {bestDay && (
                <div style={{ marginBottom: 12, fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  🏆 أفضل يوم: <strong style={{ color: 'var(--text-primary)' }}>{bestDay.day}</strong> — {fmt(bestDay.total_sales)} ج.م ({fmtInt(bestDay.invoice_count)} فاتورة)
                </div>
              )}
              <BarChartCSS data={dailyTrend} valueKey="total_sales" labelKey="day" color="var(--accent-blue)" />
            </div>
          )}

          {/* ── Peak Hours ────────────────────────────────────── */}
          {peakHours.length > 0 && (
            <div style={panelStyle}>
              <SectionTitle icon={<Zap size={18} />} title="ساعات الذروة وتوزيع المبيعات" />
              {peakHour && (
                <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(245,158,11,0.08)', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-amber, #f59e0b)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  ⚡ أعلى ساعة مبيعاً: الساعة <strong>{peakHour.hour}:00</strong> — {fmt(peakHour.total_sales)} ج.م ({fmtInt(peakHour.invoice_count)} فاتورة، متوسط {fmt(peakHour.avg_sale)} ج.م)
                </div>
              )}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'center' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 700 }}>
                      <th style={{ padding: '8px 6px', textAlign: 'right' }}>الساعة</th>
                      <th style={{ padding: '8px 6px' }}>عدد الفواتير</th>
                      <th style={{ padding: '8px 6px' }}>إجمالي المبيعات</th>
                      <th style={{ padding: '8px 6px' }}>متوسط الفاتورة</th>
                      <th style={{ padding: '8px 6px' }}>مؤشر النشاط</th>
                    </tr>
                  </thead>
                  <tbody>
                    {peakHours.map((h, i) => {
                      const maxSales = Math.max(...peakHours.map(x => x.total_sales || 0))
                      const pct = maxSales > 0 ? (h.total_sales / maxSales) * 100 : 0
                      const isPeak = h.total_sales === maxSales
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', background: isPeak ? 'rgba(245,158,11,0.06)' : 'transparent' }}>
                          <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 800 }}>
                            {isPeak ? '⚡ ' : ''}{h.hour}:00
                          </td>
                          <td style={{ padding: '8px 6px', fontWeight: 600 }}>{fmtInt(h.invoice_count)}</td>
                          <td style={{ padding: '8px 6px', fontWeight: 700, color: isPeak ? '#f59e0b' : 'var(--text-primary)' }}>{fmt(h.total_sales)} ج.م</td>
                          <td style={{ padding: '8px 6px' }}>{fmt(h.avg_sale)} ج.م</td>
                          <td style={{ padding: '8px 6px' }}>
                            <div style={{ background: 'var(--bg-secondary)', borderRadius: 4, overflow: 'hidden', height: 8 }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: isPeak ? '#f59e0b' : 'var(--accent-blue)', borderRadius: 4, transition: 'width 0.4s' }} />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Per-Shift Table ───────────────────────────────── */}
          {shiftRows.length > 0 && (
            <div style={panelStyle}>
              <SectionTitle icon={<Clock size={18} />} title="تفاصيل كل وردية في الفترة" />
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 700 }}>
                      <th style={{ padding: '9px 6px', textAlign: 'right' }}>#</th>
                      <th style={{ padding: '9px 6px', textAlign: 'right' }}>الكاشير</th>
                      <th style={{ padding: '9px 6px' }}>البداية</th>
                      <th style={{ padding: '9px 6px' }}>النهاية</th>
                      <th style={{ padding: '9px 6px' }}>المدة</th>
                      <th style={{ padding: '9px 6px' }}>فواتير</th>
                      <th style={{ padding: '9px 6px' }}>مبيعات</th>
                      <th style={{ padding: '9px 6px' }}>ربح</th>
                      <th style={{ padding: '9px 6px' }}>مصروفات</th>
                      <th style={{ padding: '9px 6px' }}>آجل</th>
                      <th style={{ padding: '9px 6px' }}>فارق الوردية</th>
                      <th style={{ padding: '9px 6px' }}>تقييم</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shiftRows.map((sh, i) => {
                      const diff = sh.difference
                      const diffColor = diff === null ? 'var(--text-muted)' : diff > 0 ? '#10b981' : diff < 0 ? '#ef4444' : 'var(--text-muted)'
                      return (
                        <tr key={sh.id} style={{ borderBottom: '1px solid var(--border-color)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)' }}>
                          <td style={{ padding: '9px 6px', fontWeight: 800, color: 'var(--text-muted)' }}>#{sh.id}</td>
                          <td style={{ padding: '9px 6px', fontWeight: 700, textAlign: 'right' }}>{sh.username}</td>
                          <td style={{ padding: '9px 6px', textAlign: 'center', color: 'var(--text-muted)' }}>{sh.start_time?.slice(0, 16) || '-'}</td>
                          <td style={{ padding: '9px 6px', textAlign: 'center', color: 'var(--text-muted)' }}>{sh.end_time?.slice(0, 16) || '🔴 مفتوحة'}</td>
                          <td style={{ padding: '9px 6px', textAlign: 'center' }}>{sh.durationHrs ? `${sh.durationHrs}س` : '-'}</td>
                          <td style={{ padding: '9px 6px', textAlign: 'center', fontWeight: 700 }}>{fmtInt(sh.invoices)}</td>
                          <td style={{ padding: '9px 6px', textAlign: 'center', fontWeight: 700, color: 'var(--accent-blue)' }}>{fmt(sh.sales)}</td>
                          <td style={{ padding: '9px 6px', textAlign: 'center', fontWeight: 700, color: sh.profit > 0 ? '#10b981' : '#ef4444' }}>{fmt(sh.profit)}</td>
                          <td style={{ padding: '9px 6px', textAlign: 'center', color: '#ef4444' }}>{fmt(sh.expenses)}</td>
                          <td style={{ padding: '9px 6px', textAlign: 'center', color: '#f59e0b' }}>{fmt(sh.debt)}</td>
                          <td style={{ padding: '9px 6px', textAlign: 'center', fontWeight: 800, color: diffColor }}>
                            {diff === null ? '-' : `${diff > 0 ? '+' : ''}${fmt(diff)}`}
                          </td>
                          <td style={{ padding: '9px 6px', textAlign: 'center' }}><Stars count={sh.stars} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Top 10 Products + Payment Breakdown ──────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Top 10 */}
            {topProducts.length > 0 && (
              <div style={panelStyle}>
                <SectionTitle icon={<Package size={18} />} title="أعلى 10 منتجات مبيعاً" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {topProducts.map((p, i) => {
                    const maxQty = topProducts[0].qty_sold || 1
                    const pct = (p.qty_sold / maxQty) * 100
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                            <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>{i + 1}.</span>
                            {p.product_name}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>{fmtInt(p.qty_sold)} وحدة | {fmt(p.revenue)} ج</span>
                        </div>
                        <div style={{ background: 'var(--bg-secondary)', borderRadius: 3, height: 5, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: i === 0 ? '#f59e0b' : 'var(--accent-blue)', borderRadius: 3, opacity: 0.8 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Payment Breakdown */}
            {paymentBreakdown.length > 0 && (
              <div style={panelStyle}>
                <SectionTitle icon={<CreditCard size={18} />} title="توزيع طرق الدفع" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
                  {paymentBreakdown.map((p, i) => {
                    const totalAll = paymentBreakdown.reduce((s, x) => s + (x.total || 0), 0)
                    const pct = totalAll > 0 ? ((p.total / totalAll) * 100).toFixed(1) : 0
                    const colors = ['#3b82f6', '#f59e0b', '#10b981', '#ec4899']
                    const c = colors[i % colors.length]
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 700 }}>{p.payment_type}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{fmt(p.total)} ج.م ({pct}%) — {fmtInt(p.count)} فاتورة</span>
                        </div>
                        <div style={{ background: 'var(--bg-secondary)', borderRadius: 6, height: 10, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: c, borderRadius: 6, transition: 'width 0.5s' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Smart Summary ─────────────────────────────────── */}
          <div style={{ ...panelStyle, background: 'linear-gradient(135deg, rgba(59,130,246,0.05), rgba(16,185,129,0.05))' }}>
            <SectionTitle icon={<Users size={18} />} title="الملخص الذكي للفترة" />
            <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: '1.8', color: 'var(--text-primary)', fontWeight: 500 }}>
              {smartSummary}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
