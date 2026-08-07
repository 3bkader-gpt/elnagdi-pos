import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useManagerStore } from '../src/store/useManagerStore'

export default function ManagerDashboardScreen() {
  const { stats, activeShift, latestSales, setDashboardData, isLoading, setLoading } = useManagerStore()
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  const fetchLiveDashboard = async () => {
    setLoading(true)
    try {
      // Connect to Cloudflare Worker API
      const res = await fetch('https://elnagdi-cloud-sync-worker.workers.dev/api/dashboard/live')
      const data = await res.json()
      if (data.success) {
        setDashboardData(data)
      }
    } catch (err) {
      console.log('Error fetching live dashboard:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchLiveDashboard()
    // Auto refresh feed every 10 seconds
    const timer = setInterval(fetchLiveDashboard, 10000)
    return () => clearInterval(timer)
  }, [])

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLiveDashboard(); }} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏪 سوبر ماركت النجدي</Text>
        <Text style={styles.headerSubtitle}>شاشة المراقبة اللحظية للمالك 🟢 Live</Text>
      </View>

      {/* Navigation Quick Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/scanner')}>
          <Text style={styles.navBtnText}>📷 مسح الباركود والتعديل</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/debts')}>
          <Text style={styles.navBtnText}>📖 دفتر الديون (الشكك)</Text>
        </TouchableOpacity>
      </View>

      {/* Active Shift Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>📊 الوردية الحالية (# {activeShift?.id || '—'})</Text>
          <Text style={styles.statusBadge}>{activeShift?.status === 'open' ? '🟢 مفتوحة' : '🔴 مغلقة'}</Text>
        </View>
        <Text style={styles.shiftTime}>⏰ بداية الوردية: {activeShift?.start_time || '—'}</Text>
        <Text style={styles.shiftCash}>💵 الكاش الابتدائي: {(activeShift?.initial_cash || 0).toFixed(2)} ج.م</Text>
      </View>

      {/* Live Sales Aggregate Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statBox, { backgroundColor: '#10b981' }]}>
          <Text style={styles.statLabel}>إجمالي مبيعات الشيفت</Text>
          <Text style={styles.statValue}>{(stats.total_sales || 0).toFixed(2)} ج.م</Text>
          <Text style={styles.statSub}>عدد الفواتير: {stats.invoice_count || 0}</Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: '#3b82f6' }]}>
          <Text style={styles.statLabel}>الكاش الورقي بالدرج</Text>
          <Text style={styles.statValue}>{(stats.cash_sales || 0).toFixed(2)} ج.م</Text>
          <Text style={styles.statSub}>نقدي كاشير</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statBox, { backgroundColor: '#f59e0b' }]}>
          <Text style={styles.statLabel}>مبيعات آجل (شكك)</Text>
          <Text style={styles.statValue}>{(stats.debt_sales || 0).toFixed(2)} ج.م</Text>
          <Text style={styles.statSub}>ديون محسبة</Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: '#8b5cf6' }]}>
          <Text style={styles.statLabel}>محافظ رقمية (فودافون/انستا)</Text>
          <Text style={styles.statValue}>{(stats.digital_sales || 0).toFixed(2)} ج.م</Text>
          <Text style={styles.statSub}>تحويلات رقمية</Text>
        </View>
      </View>

      {/* Latest Sales Feed */}
      <View style={styles.feedSection}>
        <Text style={styles.sectionTitle}>⚡ الفواتير المبيعة حديثاً (لحظة بلحظة)</Text>
        
        {latestSales && latestSales.length > 0 ? (
          latestSales.map((sale) => (
            <View key={sale.id} style={styles.saleRow}>
              <View>
                <Text style={styles.saleId}>فاتورة #{sale.id} • {sale.payment_type}</Text>
                <Text style={styles.saleClient}>{sale.client_name || 'عميل كاشير'}</Text>
                <Text style={styles.saleTime}>{sale.timestamp}</Text>
              </View>
              <Text style={styles.salePrice}>{(sale.total_amount || 0).toFixed(2)} ج.م</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>لا توجد فواتير مبيعة بالوردية الحالية حتى الآن</Text>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  header: { marginBottom: 12, paddingTop: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#f8fafc', textAlign: 'right' },
  headerSubtitle: { fontSize: 14, color: '#38bdf8', textAlign: 'right', marginTop: 4 },
  navBar: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 16 },
  navBtn: { flex: 1, backgroundColor: '#1e293b', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#334155', marginHorizontal: 4, alignItems: 'center' },
  navBtnText: { color: '#38bdf8', fontSize: 12, fontWeight: 'bold' },
  card: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#f1f5f9' },
  statusBadge: { backgroundColor: '#065f46', color: '#34d399', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 12, fontWeight: 'bold' },
  shiftTime: { color: '#94a3b8', fontSize: 13, textAlign: 'right' },
  shiftCash: { color: '#cbd5e1', fontSize: 14, fontWeight: 'bold', textAlign: 'right', marginTop: 4 },
  statsGrid: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 12 },
  statBox: { flex: 1, marginHorizontal: 4, padding: 14, borderRadius: 12, alignItems: 'flex-end' },
  statLabel: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  statValue: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginVertical: 4 },
  statSub: { color: '#e2e8f0', fontSize: 11 },
  feedSection: { marginTop: 12, marginBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#f1f5f9', textAlign: 'right', marginBottom: 12 },
  saleRow: { backgroundColor: '#1e293b', padding: 14, borderRadius: 10, marginBottom: 8, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  saleId: { fontSize: 14, fontWeight: 'bold', color: '#f8fafc', textAlign: 'right' },
  saleClient: { fontSize: 12, color: '#94a3b8', textAlign: 'right', marginTop: 2 },
  saleTime: { fontSize: 11, color: '#64748b', textAlign: 'right', marginTop: 2 },
  salePrice: { fontSize: 16, fontWeight: 'bold', color: '#34d399' },
  emptyText: { color: '#64748b', textAlign: 'center', marginVertical: 20 }
})
