import React, { useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  DollarSign,
  BarChart2,
  Award,
  AlertTriangle
} from 'lucide-react'

const PERIOD_LABELS = {
  daily:   'آخر 24 ساعة',
  weekly:  'آخر 7 أيام',
  monthly: 'آخر 30 يوماً'
}

const MEDAL = ['🥇', '🥈', '🥉']

export default function BestSellersTab({
  bsPeriod,
  setBsPeriod,
  bsTopSellers,
  bsSlowMovers,
  bsLoading,
  fetchBestSellers
}) {
  // Fetch on mount and whenever the period changes
  useEffect(() => {
    fetchBestSellers(bsPeriod)
  }, [bsPeriod])

  const maxQty = bsTopSellers[0]?.total_qty_sold || 1

  const handlePeriodChange = (p) => {
    setBsPeriod(p)
    fetchBestSellers(p)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .bs-item {
          transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.22s ease, background-color 0.2s ease;
        }
        .bs-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          background-color: var(--bg-card-hover, rgba(255,255,255,0.02)) !important;
        }
        .bs-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 700;
          white-space: nowrap;
          border: 1px solid transparent;
        }
        .bs-badge-gray {
          background: rgba(156, 163, 175, 0.08);
          color: var(--text-secondary);
          border-color: rgba(156, 163, 175, 0.15);
        }
        .bs-badge-blue {
          background: rgba(37, 99, 235, 0.08);
          color: var(--accent-blue);
          border-color: rgba(37, 99, 235, 0.15);
        }
        .bs-badge-emerald {
          background: rgba(5, 150, 105, 0.08);
          color: var(--accent-emerald);
          border-color: rgba(5, 150, 105, 0.15);
        }
        .bs-badge-rose {
          background: rgba(220, 38, 38, 0.08);
          color: var(--accent-rose);
          border-color: rgba(220, 38, 38, 0.15);
        }
      `}} />

      {/* ── Period Selector ───────────────────────────────────────── */}
      <div className="admin-card" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <BarChart2 size={20} style={{ color: 'var(--accent-blue)' }} />
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>الفترة الزمنية:</span>
          {['daily', 'weekly', 'monthly'].map(p => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              style={{
                padding: '7px 18px',
                borderRadius: '8px',
                border: '2px solid',
                borderColor: bsPeriod === p ? 'var(--accent-blue)' : 'var(--border)',
                background: bsPeriod === p ? 'var(--accent-blue)' : 'transparent',
                color: bsPeriod === p ? '#fff' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all .2s'
              }}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
          {bsLoading && (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginRight: 'auto' }}>
              ⏳ جاري التحميل...
            </span>
          )}
        </div>
      </div>

      {/* ── Summary KPI Cards ──────────────────────────────────────── */}
      {(() => {
        const totalRevenue = bsTopSellers.reduce((s, r) => s + (r.total_revenue || 0), 0)
        const totalCost = bsTopSellers.reduce((s, r) => s + ((r.cost || 0) * r.total_qty_sold), 0)
        const totalProfit = totalRevenue - totalCost
        const totalQty = bsTopSellers.reduce((s, r) => s + (r.total_qty_sold || 0), 0)
        const stagnantCapital = bsSlowMovers.reduce((s, r) => s + ((r.cost || 0) * (r.stock || 0)), 0)

        const bestSeller = bsTopSellers[0]
        const bestSellerProfit = bestSeller
          ? bestSeller.total_revenue - (bestSeller.cost || 0) * bestSeller.total_qty_sold
          : 0

        return (
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--accent-blue)' }}>
                <Award size={24} />
              </div>
              <div className="admin-stat-info">
                <span className="admin-stat-label">أكثر منتج مبيعاً</span>
                <span className="admin-stat-value" style={{ fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '220px' }} title={bestSeller?.name || '—'}>
                  {bestSeller?.name || '—'}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {bestSeller ? `مبيعات: ${bestSeller.total_qty_sold.toFixed(0)} ${bestSeller.unit} | ربح: ${bestSellerProfit.toFixed(2)} ج.م` : 'لا توجد مبيعات'}
                </span>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(5,150,105,0.1)', color: 'var(--accent-emerald)' }}>
                <ShoppingCart size={24} />
              </div>
              <div className="admin-stat-info">
                <span className="admin-stat-label">إجمالي وحدات مباعة</span>
                <span className="admin-stat-value">
                  {totalQty.toFixed(2)}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  من أصل {bsTopSellers.length} صنف نشط بالفترة
                </span>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--accent-amber)' }}>
                <DollarSign size={24} />
              </div>
              <div className="admin-stat-info">
                <span className="admin-stat-label">إجمالي إيرادات الأصناف</span>
                <span className="admin-stat-value">
                  {totalRevenue.toFixed(2)} ج.م
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                  صافي أرباح الأصناف: {totalProfit.toFixed(2)} ج.م
                </span>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(220,38,38,0.1)', color: 'var(--accent-rose)' }}>
                <Package size={24} />
              </div>
              <div className="admin-stat-info">
                <span className="admin-stat-label">منتجات راكدة</span>
                <span className="admin-stat-value">{bsSlowMovers.length} صنف</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-rose)', fontWeight: 700 }}>
                  رأس المال الراكد: {stagnantCapital.toFixed(2)} ج.م
                </span>
              </div>
            </div>
          </div>
        )
      })()}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* ── Top Sellers Table ──────────────────────────────────────── */}
        <div className="admin-card" style={{ overflow: 'hidden' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <TrendingUp size={20} style={{ color: 'var(--accent-emerald)' }} />
            الأكثر مبيعاً — {PERIOD_LABELS[bsPeriod]}
          </h3>

          {bsTopSellers.length === 0 && !bsLoading ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
              لا توجد مبيعات في هذه الفترة.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '620px', overflowY: 'auto' }}>
              {bsTopSellers.map((row, idx) => {
                const barWidth = Math.max(4, Math.round((row.total_qty_sold / maxQty) * 100))
                const itemProfit = row.total_revenue - (row.cost || 0) * row.total_qty_sold
                const profitMargin = row.total_revenue > 0 ? ((itemProfit / row.total_revenue) * 100) : 0
                return (
                  <div
                    key={row.barcode}
                    className="bs-item"
                    style={{
                      position: 'relative',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    {/* progress bar background */}
                    <div style={{
                      position: 'absolute', top: 0, right: 0, bottom: 0,
                      width: `${barWidth}%`,
                      background: idx === 0
                        ? 'rgba(37,99,235,0.06)'
                        : idx === 1
                          ? 'rgba(5,150,105,0.05)'
                          : 'rgba(245,158,11,0.04)',
                      pointerEvents: 'none',
                      transition: 'width 0.3s ease'
                    }} />
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', direction: 'rtl' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1, textAlign: 'right' }}>
                        <span style={{ fontSize: '1.2rem', flexShrink: 0, width: '32px', textAlign: 'center' }}>
                          {idx < 3 ? MEDAL[idx] : <span style={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.8rem' }}>##{idx + 1}</span>}
                        </span>
                        <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.name}>
                            {row.name}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', direction: 'rtl' }}>
                            <span className="bs-badge bs-badge-gray">🏷️ {row.barcode}</span>
                            <span className="bs-badge bs-badge-blue">📈 طلب {row.times_ordered} مرات</span>
                            <span className={`bs-badge ${row.stock <= row.reorder_limit ? 'bs-badge-rose' : 'bs-badge-emerald'}`}>
                              📦 مخزن: {row.stock} {row.unit}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'left', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--accent-emerald)', fontSize: '1.05rem' }}>
                          {Number(row.total_qty_sold).toFixed(2)} {row.unit}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {Number(row.total_revenue).toFixed(2)} ج.م
                        </div>
                        <div style={{
                          fontSize: '0.72rem',
                          color: 'var(--accent-emerald)',
                          background: 'rgba(5, 150, 105, 0.08)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          alignSelf: 'flex-end',
                          marginTop: '2px'
                        }}>
                          ربح: {itemProfit.toFixed(2)} ج.م ({profitMargin.toFixed(0)}%)
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Slow Movers Table ──────────────────────────────────────── */}
        <div className="admin-card" style={{ overflow: 'hidden' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <TrendingDown size={20} style={{ color: 'var(--accent-rose)' }} />
            منتجات راكدة — بدون مبيعات خلال {PERIOD_LABELS[bsPeriod]}
          </h3>

          {bsSlowMovers.length === 0 && !bsLoading ? (
            <p style={{ color: 'var(--accent-emerald)', textAlign: 'center', padding: '20px', fontWeight: 600 }}>
              ✅ ممتاز! لا توجد منتجات راكدة في هذه الفترة.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '620px', overflowY: 'auto' }}>
              {bsSlowMovers.map((row) => {
                const isLowStock = row.reorder_limit > 0 && row.stock <= row.reorder_limit
                const stagnantValue = (row.cost || 0) * row.stock
                return (
                  <div
                    key={row.barcode}
                    className="bs-item"
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: 'var(--bg-input)',
                      border: `1px solid ${isLowStock ? 'var(--accent-rose)' : 'var(--border)'}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', direction: 'rtl' }}>
                        {isLowStock && <AlertTriangle size={14} style={{ color: 'var(--accent-rose)', flexShrink: 0 }} />}
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.name}>
                          {row.name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', direction: 'rtl' }}>
                        <span className="bs-badge bs-badge-gray">🏷️ {row.barcode}</span>
                        <span className="bs-badge bs-badge-blue">💵 بيع: {Number(row.price).toFixed(2)} ج.م</span>
                        <span className="bs-badge bs-badge-gray">⚙️ تكلفة: {Number(row.cost || 0).toFixed(2)} ج.م</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'left', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{
                        fontWeight: 800,
                        color: isLowStock ? 'var(--accent-rose)' : 'var(--text-secondary)',
                        fontSize: '1rem'
                      }}>
                        {row.stock} {row.unit}
                      </div>
                      <div style={{
                        fontSize: '0.72rem',
                        color: 'var(--accent-rose)',
                        background: 'rgba(220, 38, 38, 0.08)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        alignSelf: 'flex-end',
                        marginTop: '2px'
                      }}>
                        قيمة: {stagnantValue.toFixed(2)} ج.م
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
