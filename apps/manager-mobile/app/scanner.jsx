import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'

export default function BarcodeScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const [barcode, setBarcode] = useState('')
  const [productName, setProductName] = useState('')
  const [currentPrice, setCurrentPrice] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [loading, setLoading] = useState(false)

  if (!permission) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#38bdf8" /></View>
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>يحتاج التطبيق إذن الكاميرا لمسح باركود المنتجات</Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={requestPermission}>
          <Text style={styles.btnText}>منح إذن الكاميرا 📷</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const handleBarCodeScanned = ({ data }) => {
    if (scanned) return
    setScanned(true)
    setBarcode(data)
    // Simulate/Fetch product lookup
    setProductName(`منتج باركود: ${data}`)
    setCurrentPrice('25.00')
    setNewPrice('')
  }

  const handleUpdatePrice = async () => {
    if (!newPrice || isNaN(newPrice) || parseFloat(newPrice) <= 0) {
      Alert.alert('تنبيه', 'برجاء إدخال سعر صحراوي جديد صحيح')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('https://elnagdi-cloud-sync-worker.workers.dev/api/products/update-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: barcode,
          new_price: parseFloat(newPrice),
          updated_by: 'المالك من الموبايل'
        })
      })

      const resData = await response.json()
      if (resData.success) {
        Alert.alert('تم بنجاح 🚀', `تم تعديل سعر الصنف إلى ${newPrice} ج.م وإرسال التنبيه فوراً`)
        setScanned(false)
        setBarcode('')
      } else {
        Alert.alert('خطأ', resData.message || 'فشل تعديل السعر')
      }
    } catch (err) {
      Alert.alert('خطأ شبكة', 'فشل الاتصال بالسيرفر السحابي')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      {!scanned ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'code128', 'qr'],
            }}
          />
          <View style={styles.overlay}>
            <View style={styles.targetFrame} />
            <Text style={styles.scanNotice}>وجه الكاميرا نحو باركود المنتج لمسحه فوراً</Text>
          </View>
        </View>
      ) : (
        <View style={styles.editCard}>
          <Text style={styles.productTitle}>{productName}</Text>
          <Text style={styles.barcodeSub}>الباركود: {barcode}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>السعر الحالي للمستهلك:</Text>
            <Text style={styles.priceOld}>{currentPrice} ج.م</Text>
          </View>

          <Text style={styles.label}>السعر الجديد المطلوب:</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#64748b"
            keyboardType="decimal-pad"
            value={newPrice}
            onChangeText={setNewPrice}
          />

          <TouchableOpacity style={styles.btnPrimary} onPress={handleUpdatePrice} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>تأكيد وتحديث السعر فورا ⚡</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSecondary} onPress={() => setScanned(false)}>
            <Text style={styles.btnSecText}>إلغاء وإعادة المسح 🔄</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  cameraContainer: { flex: 1, width: '100%', position: 'relative' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  targetFrame: { width: 250, height: 150, borderWidth: 2, borderColor: '#38bdf8', borderRadius: 12, backgroundColor: 'transparent' },
  scanNotice: { color: '#f8fafc', fontSize: 14, fontWeight: '600', marginTop: 20 },
  permissionText: { color: '#f8fafc', fontSize: 16, textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  editCard: { width: '90%', maxWidth: 400, backgroundColor: '#1e293b', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  productTitle: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc', textAlign: 'right', marginBottom: 4 },
  barcodeSub: { fontSize: 13, color: '#94a3b8', textAlign: 'right', marginBottom: 16 },
  priceRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#334155' },
  priceLabel: { color: '#cbd5e1', fontSize: 14 },
  priceOld: { color: '#f43f5e', fontSize: 16, fontWeight: 'bold' },
  label: { color: '#38bdf8', fontSize: 14, fontWeight: '600', textAlign: 'right', marginBottom: 8 },
  input: { backgroundColor: '#0f172a', color: '#f8fafc', fontSize: 22, fontWeight: 'bold', textAlign: 'center', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#475569', marginBottom: 20 },
  btnPrimary: { backgroundColor: '#10b981', padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  btnSecondary: { backgroundColor: '#334155', padding: 12, borderRadius: 10, alignItems: 'center' },
  btnSecText: { color: '#cbd5e1', fontSize: 14 }
})
