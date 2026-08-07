import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet, TextInput } from 'react-native'

export default function CustomerDebtsScreen() {
  const [search, setSearch] = useState('')
  const [debts, setDebts] = useState([
    { id: 1, name: 'أحمد محمود', phone: '01012345678', balance: 350.50, last_sale: '2026-08-06' },
    { id: 2, name: 'محمد علي', phone: '01123456789', balance: 120.00, last_sale: '2026-08-05' },
    { id: 3, name: 'حسام حسن', phone: '01234567890', balance: 540.00, last_sale: '2026-08-04' },
  ])

  const sendWhatsAppReminder = (phone, name, balance) => {
    const formattedPhone = phone.startsWith('0') ? `2${phone}` : phone
    const message = encodeURIComponent(
      `السلام عليكم أستاذ ${name} 👋\nتذكير ودي لطيف من سوبر ماركت النجدي 🏪\nالمبلغ المتبقي لحسابكم المسجل هو: ${balance.toFixed(2)} ج.م.\nشكراً لتعاملكم معنا! 🌹`
    )
    const url = `whatsapp://send?phone=${formattedPhone}&text=${message}`
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url)
      } else {
        Linking.openURL(`https://wa.me/${formattedPhone}?text=${message}`)
      }
    })
  }

  const filteredDebts = debts.filter(d => d.name.includes(search) || d.phone.includes(search))

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📖 دفتر ديون العملاء (الشكك)</Text>
      <Text style={styles.subtitle}>تذكير بنقرة واحدة عبر الواتساب</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="ابحث باسم العميل أو رقم الموبايل..."
        placeholderTextColor="#64748b"
        value={search}
        onChangeText={setSearch}
      />

      {filteredDebts.map(item => (
        <View key={item.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.balance}>{item.balance.toFixed(2)} ج.م</Text>
          </View>
          <Text style={styles.info}>📱 {item.phone} • آخر حركة: {item.last_sale}</Text>

          <TouchableOpacity
            style={styles.whatsappBtn}
            onPress={() => sendWhatsAppReminder(item.phone, item.name, item.balance)}
          >
            <Text style={styles.whatsappBtnText}>💬 إرسال تذكير بالواتساب بنقرة واحدة</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#f8fafc', textAlign: 'right', marginTop: 20 },
  subtitle: { fontSize: 13, color: '#38bdf8', textAlign: 'right', marginBottom: 16, marginTop: 4 },
  searchInput: { backgroundColor: '#1e293b', color: '#f8fafc', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#334155', textAlign: 'right', marginBottom: 16 },
  card: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#f1f5f9' },
  balance: { fontSize: 16, fontWeight: 'bold', color: '#f43f5e' },
  info: { fontSize: 12, color: '#94a3b8', textAlign: 'right', marginBottom: 12 },
  whatsappBtn: { backgroundColor: '#25D366', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  whatsappBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 }
})
