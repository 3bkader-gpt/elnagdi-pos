import React, { useEffect } from 'react'
import { useCashierPerformance } from '../../hooks/useCashierPerformance'
import { Calendar, RefreshCw, ArrowRight, TrendingUp, TrendingDown, DollarSign, ShoppingCart, AlertTriangle, CheckCircle, Award, Clock, CreditCard, Package, BarChart2, Users } from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt  = (n) => (n || 0).toFixed(2)
const fmtI = (n) => Math.round(n || 0).toLocaleString('ar-EG')

const QUICK_BTNS = [
  { key: 'today',     label: '⏰ اليوم'  },
  { key: 'yesterday', label: '📅 أمس'    },
  { key: '3days',     label: '3 أيام'    },
  { key: 'week',      label: '📊 أسبوع'  },
  { key: 'month',     label: '🗓️ شهر'    },
  { key: 'all',       label: '🌐 الكل'   },
]

const COMPARE_OPTS = [
  { key: 'totalSales',    label: 'المبيعات'          },
  { key: 'totalInvoices', label: 'الفواتير'          },
  { key: 'profitMargin',  label: 'هامش الربح %'      },
  { key: 'score',         label: 'درجة الأداء'       },
]

const PALETTE = ['#3b82f6','#10b981','#f59e0b','#ec4899','#8b5cf6']

// ── Small reusable atoms ─────────────────────────────────────────────────────
function Panel({ children, style }) {
  return (
    <div style={{ background:'var(--glass-bg)', border:'1px solid var(--glass-border)', borderRadius:14, padding:'18px 20px', boxShadow:'var(--glass-shadow)', ...style }}>
      {children}
    </div>
  )
}

function SectionTitle({ icon, title }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, paddingBottom:10, borderBottom:'2px solid var(--border-color)', marginBottom:14 }}>
      <span style={{ color:'var(--accent-blue)', opacity:.85 }}>{icon}</span>
      <h3 style={{ margin:0, fontSize:'1rem', fontWeight:800 }}>{title}</h3>
    </div>
  )
}

function KpiRow({ label, value, sub, color }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid var(--border-color)' }}>
      <span style={{ fontSize:'0.8rem', color:'var(--text-muted)', fontWeight:600 }}>{label}</span>
      <div style={{ textAlign:'left' }}>
        <span style={{ fontSize:'0.9rem', fontWeight:800, color: color || 'var(--text-primary)' }}>{value}</span>
        {sub && <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{sub}</div>}
      </div>
    </div>
  )
}

function ScoreBar({ score, color }) {
  return (
    <div style={{ background:'var(--bg-secondary)', borderRadius:6, height:12, overflow:'hidden', margin:'6px 0' }}>
      <div style={{ width:`${score}%`, height:'100%', background: color, borderRadius:6, transition:'width .6s ease' }} />
    </div>
  )
}

function BarChart({ data, valueKey, labelKey, colors }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data.map(d => Math.abs(d[valueKey] || 0)), 1)
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:10, height:150, padding:'0 4px 8px', overflowX:'auto' }}>
      {data.map((d,i) => {
        const val = d[valueKey] || 0
        const pct = (Math.abs(val) / max) * 100
        const c   = colors ? colors[i % colors.length] : '#3b82f6'
        return (
          <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flex:'1 1 0', minWidth:60 }}>
            <span style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:700, textAlign:'center' }}>
              {typeof val === 'number' && val > 1000 ? `${(val/1000).toFixed(1)}k` : fmt(val)}
            </span>
            <div style={{ width:'100%', maxWidth:56, height:`${Math.max(pct,2)}%`, background:c, borderRadius:'4px 4px 0 0', opacity:.85, transition:'height .4s', minHeight:4 }} />
            <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', textAlign:'center', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:70 }}>
              {d[labelKey]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Alert banner ─────────────────────────────────────────────────────────────
function AlertBanner({ alerts }) {
  if (!alerts || alerts.length === 0) return null
  const colors = { danger:'#ef4444', warning:'#f59e0b', success:'#10b981' }
  const bgs    = { danger:'rgba(239,68,68,.07)', warning:'rgba(245,158,11,.07)', success:'rgba(16,185,129,.07)' }
  return (
    <Panel>
      <SectionTitle icon={<AlertTriangle size={16}/>} title="التنبيهات الذكية" />
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {alerts.map((a,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, background:bgs[a.type]||bgs.warning, border:`1px solid ${colors[a.type]}30` }}>
            <span style={{ color:colors[a.type], fontSize:'0.8rem' }}>
              {a.type==='danger'?'🔴':a.type==='warning'?'🟡':'🟢'}
            </span>
            <span style={{ fontSize:'0.85rem', fontWeight:600, color:'var(--text-primary)' }}>{a.msg}</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}

// ── Cashier card (overview) ──────────────────────────────────────────────────
function CashierCard({ c, rank, onSelect, color }) {
  const rankLabels = ['🥇','🥈','🥉','#4','#5']
  return (
    <div onClick={() => onSelect(c)}
      style={{ background:'var(--glass-bg)', border:`2px solid ${color}30`, borderRadius:14, padding:'18px 20px', cursor:'pointer', transition:'all .2s', position:'relative', overflow:'hidden' }}
      onMouseEnter={e => e.currentTarget.style.borderColor=color}
      onMouseLeave={e => e.currentTarget.style.borderColor=`${color}30`}>

      {/* Rank badge */}
      <div style={{ position:'absolute', top:12, left:12, fontSize:'1.4rem' }}>{rankLabels[rank] || `#${rank+1}`}</div>

      {/* Header */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, marginBottom:14, marginTop:8 }}>
        <div style={{ width:52, height:52, borderRadius:'50%', background:`${color}20`, border:`3px solid ${color}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem', fontWeight:800, color }}>
          {c.username.charAt(0)}
        </div>
        <span style={{ fontWeight:800, fontSize:'1rem' }}>{c.username}</span>
        <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', background:'var(--bg-secondary)', borderRadius:6, padding:'2px 10px' }}>
          {c.grade.emoji} {c.grade.label}
        </span>
      </div>

      {/* Score bar */}
      <div style={{ textAlign:'center', marginBottom:4 }}>
        <span style={{ fontSize:'1.6rem', fontWeight:900, color:c.grade.color }}>{c.score}</span>
        <span style={{ fontSize:'0.8rem', color:'var(--text-muted)', fontWeight:600 }}>/100</span>
      </div>
      <ScoreBar score={c.score} color={c.grade.color} />

      {/* Quick KPIs */}
      <div style={{ marginTop:12, display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
        {[
          { label:'المبيعات',    val:`${fmt(c.totalSales)} ج`  },
          { label:'الفواتير',   val:`${fmtI(c.totalInvoices)}` },
          { label:'هامش الربح', val:`${fmt(c.profitMargin)}%`  },
          { label:'الورديات',   val:`${c.shiftCount}`          },
          { label:'متوسط فاتورة', val:`${fmt(c.avgInvoice)} ج` },
          { label:'المرتجعات',  val:`${fmtI(c.totalReturnCount)}` },
        ].map((item,i) => (
          <div key={i} style={{ background:'var(--bg-secondary)', borderRadius:8, padding:'6px 8px' }}>
            <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:600 }}>{item.label}</div>
            <div style={{ fontSize:'0.82rem', fontWeight:800 }}>{item.val}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop:10, textAlign:'center', fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:600 }}>
        انقر لعرض التفاصيل الكاملة ←
      </div>
    </div>
  )
}

// ── Drilldown profile ────────────────────────────────────────────────────────
function DrilldownView({ cashier, drilldown, loading, onBack }) {
  if (loading || !drilldown) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:300, gap:16 }}>
        <div style={{ width:40, height:40, border:'4px solid var(--border-color)', borderTop:'4px solid var(--accent-blue)', borderRadius:'50%', animation:'spin 0.9s linear infinite' }} />
        <span style={{ color:'var(--text-muted)', fontWeight:700 }}>جاري تحميل تفاصيل {cashier?.username}...</span>
        <button onClick={onBack} style={{ padding:'6px 14px', borderRadius:8, border:'1px solid var(--border-color)', background:'transparent', color:'var(--text-muted)', cursor:'pointer', fontFamily:'inherit', fontWeight:600, fontSize:'0.82rem' }}>
          العودة
        </button>
      </div>
    )
  }


  const peakHour = drilldown.peakHours.length > 0
    ? drilldown.peakHours.reduce((a,b) => b.sales > a.sales ? b : a)
    : null

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      {/* Back + header */}
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={onBack}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'1px solid var(--border-color)', background:'transparent', color:'var(--text-primary)', cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:'0.85rem' }}>
          <ArrowRight size={16}/> عودة للمقارنة
        </button>
        <h3 style={{ margin:0, fontSize:'1.1rem', fontWeight:800 }}>
          {cashier.grade.emoji} ملف {cashier.username} التفصيلي — درجة الأداء: <span style={{ color:cashier.grade.color }}>{cashier.score}/100</span>
        </h3>
      </div>

      {/* KPIs */}
      <Panel>
        <SectionTitle icon={<BarChart2 size={16}/>} title="ملخص الأداء الكامل" />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:10 }}>
          {[
            { label:'إجمالي المبيعات',       val:`${fmt(cashier.totalSales)} ج.م`,       color:'#3b82f6' },
            { label:'صافي الربح',            val:`${fmt(cashier.totalProfit)} ج.م`,      color:'#10b981' },
            { label:'هامش الربح',            val:`${fmt(cashier.profitMargin)}%`,         color:'#10b981' },
            { label:'عدد الفواتير',          val:`${fmtI(cashier.totalInvoices)}`,        color:null       },
            { label:'متوسط الفاتورة',        val:`${fmt(cashier.avgInvoice)} ج.م`,        color:null       },
            { label:'أعلى فاتورة',           val:`${fmt(cashier.maxInvoice)} ج.م`,        color:'#f59e0b' },
            { label:'عدد الورديات',          val:`${cashier.shiftCount}`,                 color:null       },
            { label:'متوسط مبيعات الوردية', val:`${fmt(cashier.avgSalesPerShift)} ج.م`,  color:null       },
            { label:'إجمالي المرتجعات',      val:`${fmtI(cashier.totalReturnCount)} عملية`, color:'#ec4899'},
            { label:'معدل المرتجعات',        val:`${fmt(cashier.returnRate)}%`,           color: cashier.returnRate>10?'#ef4444':'var(--text-primary)' },
            { label:'مبيعات آجل',            val:`${fmt(cashier.debtPct)}%`,             color:'#f59e0b' },
            { label:'فارق الخزينة الكلي',   val:`${cashier.totalCashDiff>=0?'+':''}${fmt(cashier.totalCashDiff)} ج.م`, color: cashier.totalCashDiff>=0?'#10b981':'#ef4444' },
          ].map((item,i) => (
            <div key={i} style={{ background:'var(--bg-secondary)', borderRadius:8, padding:'10px 12px' }}>
              <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontWeight:600, marginBottom:2 }}>{item.label}</div>
              <div style={{ fontSize:'0.95rem', fontWeight:800, color:item.color||'var(--text-primary)' }}>{item.val}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Daily trend */}
      {drilldown.daily.length > 0 && (
        <Panel>
          <SectionTitle icon={<TrendingUp size={16}/>} title="المبيعات اليومية" />
          <BarChart data={drilldown.daily} valueKey="sales" labelKey="day" colors={[cashier.grade.color]} />
        </Panel>
      )}

      {/* Shifts table */}
      {drilldown.shifts.length > 0 && (
        <Panel>
          <SectionTitle icon={<Clock size={16}/>} title="تفاصيل كل وردية" />
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.8rem' }}>
              <thead>
                <tr style={{ borderBottom:'2px solid var(--border-color)', color:'var(--text-muted)', fontWeight:700 }}>
                  {['#','البداية','النهاية','المدة','فواتير','مبيعات','ربح','فارق الخزينة','الحالة'].map((h,i) => (
                    <th key={i} style={{ padding:'8px 6px', textAlign:'center' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {drilldown.shifts.map((sh,i) => (
                  <tr key={sh.shift_id} style={{ borderBottom:'1px solid var(--border-color)', background: i%2===0?'transparent':'rgba(0,0,0,.015)' }}>
                    <td style={{ padding:'8px 6px', textAlign:'center', fontWeight:800, color:'var(--text-muted)' }}>#{sh.shift_id}</td>
                    <td style={{ padding:'8px 6px', textAlign:'center', color:'var(--text-muted)', fontSize:'0.75rem' }}>{sh.start_time?.slice(0,16)||'-'}</td>
                    <td style={{ padding:'8px 6px', textAlign:'center', color:'var(--text-muted)', fontSize:'0.75rem' }}>{sh.end_time?.slice(0,16)||'🔴 مفتوحة'}</td>
                    <td style={{ padding:'8px 6px', textAlign:'center' }}>{sh.duration?`${sh.duration}س`:'-'}</td>
                    <td style={{ padding:'8px 6px', textAlign:'center', fontWeight:700 }}>{fmtI(sh.invoices)}</td>
                    <td style={{ padding:'8px 6px', textAlign:'center', fontWeight:700, color:'#3b82f6' }}>{fmt(sh.sales)}</td>
                    <td style={{ padding:'8px 6px', textAlign:'center', fontWeight:700, color:sh.profit>0?'#10b981':'#ef4444' }}>{fmt(sh.profit)}</td>
                    <td style={{ padding:'8px 6px', textAlign:'center', fontWeight:800, color:sh.difference===null?'var(--text-muted)':sh.difference>=0?'#10b981':'#ef4444' }}>
                      {sh.difference===null?'-':`${sh.difference>=0?'+':''}${fmt(sh.difference)}`}
                    </td>
                    <td style={{ padding:'8px 6px', textAlign:'center' }}>
                      <span style={{ fontSize:'0.72rem', padding:'2px 8px', borderRadius:6, background: sh.status==='open'?'rgba(239,68,68,.1)':'rgba(16,185,129,.1)', color:sh.status==='open'?'#ef4444':'#10b981', fontWeight:700 }}>
                        {sh.status==='open'?'مفتوحة':'مغلقة'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* Peak hours + top products */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        {drilldown.peakHours.length > 0 && (
          <Panel>
            <SectionTitle icon={<Clock size={16}/>} title="توزيع الساعات" />
            {peakHour && (
              <div style={{ marginBottom:10, fontSize:'0.8rem', fontWeight:700, color:'#f59e0b' }}>
                ⚡ أعلى ساعة: {peakHour.hour}:00 ({fmt(peakHour.sales)} ج.م)
              </div>
            )}
            <BarChart data={drilldown.peakHours} valueKey="sales" labelKey="hour" colors={['#f59e0b']} />
          </Panel>
        )}
        {drilldown.topProducts.length > 0 && (
          <Panel>
            <SectionTitle icon={<Package size={16}/>} title="أعلى 5 منتجات باعها" />
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {drilldown.topProducts.map((p,i) => {
                const maxQ = drilldown.topProducts[0].qty || 1
                return (
                  <div key={i}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.78rem', marginBottom:2 }}>
                      <span style={{ fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'60%' }}>
                        {i+1}. {p.product_name}
                      </span>
                      <span style={{ color:'var(--text-muted)' }}>{fmtI(p.qty)} وحدة</span>
                    </div>
                    <div style={{ background:'var(--bg-secondary)', borderRadius:3, height:5 }}>
                      <div style={{ width:`${(p.qty/maxQ)*100}%`, height:'100%', background: i===0?'#f59e0b':'#3b82f6', borderRadius:3, opacity:.8 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Panel>
        )}
      </div>

      {/* Payment breakdown */}
      {drilldown.payment && drilldown.payment.length > 0 && (
        <Panel>
          <SectionTitle icon={<CreditCard size={16}/>} title="توزيع طرق الدفع" />
          <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
            {drilldown.payment.map((p,i) => {
              const totalAll = drilldown.payment.reduce((s,x)=>s+(x.total||0),0)
              const pct = totalAll>0 ? ((p.total/totalAll)*100).toFixed(1) : 0
              const c = ['#3b82f6','#f59e0b'][i%2]
              return (
                <div key={i} style={{ flex:'1', minWidth:120, background:'var(--bg-secondary)', borderRadius:10, padding:'12px 14px' }}>
                  <div style={{ fontSize:'0.8rem', fontWeight:700, marginBottom:4 }}>{p.payment_type}</div>
                  <div style={{ fontSize:'1.2rem', fontWeight:900, color:c }}>{pct}%</div>
                  <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{fmt(p.total)} ج.م — {fmtI(p.count)} فاتورة</div>
                  <div style={{ background:'rgba(255,255,255,.1)', borderRadius:4, height:6, marginTop:6 }}>
                    <div style={{ width:`${pct}%`, height:'100%', background:c, borderRadius:4 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>
      )}
    </div>
  )
}

// ── Main tab ─────────────────────────────────────────────────────────────────
export default function CashierPerformanceTab() {
  const {
    loading, error, fromDate, setFromDate, toDate, setToDate,
    setQuickFilter, runAnalysis,
    cashiers, alerts, comparisonKey, setComparisonKey,
    selectedCashier, setSelectedCashier,
    drilldown, loadDrilldown
  } = useCashierPerformance()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { runAnalysis() }, [])

  const handleSelectCashier = (c) => {
    setSelectedCashier(c)
    loadDrilldown(c)
  }

  // If drilldown is open
  if (selectedCashier) {
    return (
      <DrilldownView
        cashier={selectedCashier}
        drilldown={drilldown}
        loading={loading}
        onBack={() => { setSelectedCashier(null) }}
      />
    )
  }

  // Loading full-page spinner (only on initial load when no data yet)
  if (loading && cashiers.length === 0) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:300, gap:16 }}>
        <div style={{ width:48, height:48, border:'4px solid var(--border-color)', borderTop:'4px solid var(--accent-blue)', borderRadius:'50%', animation:'spin 0.9s linear infinite' }} />
        <span style={{ color:'var(--text-muted)', fontWeight:700, fontSize:'0.95rem' }}>جاري تحليل بيانات الكاشيرات...</span>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18, direction:'rtl' }}>

      {/* ── Filter ─────────────────────────────────────── */}
      <Panel>
        <SectionTitle icon={<Calendar size={16}/>} title="تخصيص الفترة الزمنية" />
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
          {QUICK_BTNS.map(b => (
            <button key={b.key} onClick={() => setQuickFilter(b.key)}
              style={{ padding:'6px 14px', borderRadius:8, border:'1.5px solid var(--border-color)', background:'transparent', color:'var(--text-primary)', fontWeight:700, fontSize:'0.82rem', cursor:'pointer', fontFamily:'inherit' }}>
              {b.label}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:600 }}>من</label>
            <input type="datetime-local" value={fromDate} onChange={e=>setFromDate(e.target.value)}
              style={{ padding:'8px 12px', borderRadius:8, border:'1.5px solid var(--border-color)', background:'var(--bg-primary)', color:'var(--text-primary)', fontSize:'0.9rem', fontFamily:'inherit' }} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:600 }}>إلى</label>
            <input type="datetime-local" value={toDate} onChange={e=>setToDate(e.target.value)}
              style={{ padding:'8px 12px', borderRadius:8, border:'1.5px solid var(--border-color)', background:'var(--bg-primary)', color:'var(--text-primary)', fontSize:'0.9rem', fontFamily:'inherit' }} />
          </div>
          <button onClick={runAnalysis} disabled={loading}
            style={{ padding:'9px 24px', borderRadius:8, border:'none', background:'var(--accent-blue)', color:'#fff', fontWeight:800, fontSize:'0.95rem', cursor:'pointer', display:'flex', alignItems:'center', gap:8, fontFamily:'inherit', opacity:loading?.7:1 }}>
            <RefreshCw size={16} style={{ animation:loading?'spin 1s linear infinite':'none' }} />
            {loading ? 'جاري...' : 'تحديث التقييمات'}
          </button>
        </div>
      </Panel>

      {/* ── Alerts ─────────────────────────────────────── */}
      <AlertBanner alerts={alerts} />

      {/* ── Error state ───────────────────────────────── */}
      {error && (
        <Panel style={{ textAlign:'center', padding:30, borderColor:'#ef444440' }}>
          <div style={{ fontSize:'2rem', marginBottom:8 }}>⚠️</div>
          <div style={{ fontWeight:700, color:'#ef4444', marginBottom:6 }}>{error}</div>
          <button onClick={runAnalysis}
            style={{ padding:'8px 20px', borderRadius:8, border:'none', background:'var(--accent-blue)', color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            إعادة المحاولة
          </button>
        </Panel>
      )}

      {/* Empty state */}
      {!loading && !error && cashiers.length === 0 && (
        <Panel style={{ textAlign:'center', padding:50, color:'var(--text-muted)' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:10 }}>👥</div>
          <div style={{ fontWeight:700, fontSize:'1rem' }}>لا توجد ورديات في الفترة المحددة</div>
          <div style={{ fontSize:'0.85rem', marginTop:6 }}>جرب تحديد فترة أوسع أو اضغط "الكل"</div>
        </Panel>
      )}

      {cashiers.length > 0 && (
        <>
          {/* ── Cashier cards (leaderboard) ────────────── */}
          <Panel>
            <SectionTitle icon={<Award size={16}/>} title="لوحة الترتيب — تقييم الكاشيرات" />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:16 }}>
              {cashiers.map((c,i) => (
                <CashierCard key={c.user_id} c={c} rank={i} onSelect={handleSelectCashier} color={PALETTE[i%PALETTE.length]} />
              ))}
            </div>
          </Panel>

          {/* ── Visual comparison bar chart ─────────────── */}
          <Panel>
            <SectionTitle icon={<BarChart2 size={16}/>} title="مقارنة بصرية بين الكاشيرات" />
            <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
              {COMPARE_OPTS.map(o => (
                <button key={o.key} onClick={() => setComparisonKey(o.key)}
                  style={{ padding:'5px 12px', borderRadius:6, border:'1.5px solid', borderColor: comparisonKey===o.key?'var(--accent-blue)':'var(--border-color)', background: comparisonKey===o.key?'var(--accent-blue)':'transparent', color: comparisonKey===o.key?'#fff':'var(--text-muted)', fontWeight:700, fontSize:'0.78rem', cursor:'pointer', fontFamily:'inherit' }}>
                  {o.label}
                </button>
              ))}
            </div>
            <BarChart
              data={cashiers.map(c => ({ ...c, label: c.username }))}
              valueKey={comparisonKey}
              labelKey="username"
              colors={PALETTE}
            />
          </Panel>

          {/* ── Full KPI comparison table ───────────────── */}
          <Panel>
            <SectionTitle icon={<Users size={16}/>} title="جدول المقارنة التفصيلية" />
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.8rem', textAlign:'center' }}>
                <thead>
                  <tr style={{ borderBottom:'2px solid var(--border-color)', color:'var(--text-muted)', fontWeight:700 }}>
                    {['الترتيب','الكاشير','الدرجة','التقدير','المبيعات','الفواتير','متوسط فاتورة','هامش الربح %','الورديات','المرتجعات%','فارق الخزينة','آجل%'].map((h,i)=>(
                      <th key={i} style={{ padding:'9px 8px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cashiers.map((c,i) => (
                    <tr key={c.user_id}
                      onClick={() => handleSelectCashier(c)}
                      style={{ borderBottom:'1px solid var(--border-color)', cursor:'pointer', background: i%2===0?'transparent':'rgba(0,0,0,.015)' }}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(59,130,246,.04)'}
                      onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'transparent':'rgba(0,0,0,.015)'}>
                      <td style={{ padding:'9px 8px', fontWeight:800, fontSize:'1.1rem' }}>{['🥇','🥈','🥉'][i]||`#${i+1}`}</td>
                      <td style={{ padding:'9px 8px', fontWeight:800 }}>{c.username}</td>
                      <td style={{ padding:'9px 8px' }}>
                        <span style={{ fontWeight:900, color:c.grade.color, fontSize:'1rem' }}>{c.score}</span>
                      </td>
                      <td style={{ padding:'9px 8px' }}>
                        <span style={{ fontSize:'0.75rem', padding:'3px 8px', borderRadius:6, background:`${c.grade.color}15`, color:c.grade.color, fontWeight:700 }}>
                          {c.grade.emoji} {c.grade.label}
                        </span>
                      </td>
                      <td style={{ padding:'9px 8px', fontWeight:700, color:'#3b82f6' }}>{fmt(c.totalSales)} ج</td>
                      <td style={{ padding:'9px 8px', fontWeight:700 }}>{fmtI(c.totalInvoices)}</td>
                      <td style={{ padding:'9px 8px' }}>{fmt(c.avgInvoice)} ج</td>
                      <td style={{ padding:'9px 8px', fontWeight:700, color: c.profitMargin>=15?'#10b981':c.profitMargin>=8?'#f59e0b':'#ef4444' }}>
                        {fmt(c.profitMargin)}%
                      </td>
                      <td style={{ padding:'9px 8px' }}>{c.shiftCount}</td>
                      <td style={{ padding:'9px 8px', color: c.returnRate>10?'#ef4444':'var(--text-primary)', fontWeight: c.returnRate>10?800:400 }}>
                        {fmt(c.returnRate)}%
                      </td>
                      <td style={{ padding:'9px 8px', fontWeight:800, color: c.totalCashDiff>=0?'#10b981':'#ef4444' }}>
                        {c.totalCashDiff>=0?'+':''}{fmt(c.totalCashDiff)}
                      </td>
                      <td style={{ padding:'9px 8px', color: c.debtPct>30?'#f59e0b':'var(--text-primary)' }}>
                        {fmt(c.debtPct)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </div>
  )
}
