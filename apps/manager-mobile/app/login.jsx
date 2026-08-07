import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import * as Device from 'expo-device'
import { useRouter } from 'expo-router'
import { useManagerStore } from '../src/store/useManagerStore'

export default function LoginScreen() {
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const setToken = useManagerStore((state) => state.setToken)
  const router = useRouter()

  const handleLogin = async () => {
    if (!pin || pin.length < 4) {
      Alert.alert('تنبيه', 'برجاء إدخال رقم PIN الصحيح (4 أرقام)')
      return
    }

    setLoading(true)
    try {
      const deviceId = Device.osBuildId || Device.modelName || 'mobile-device-001'
      
      const response = await fetch('https://elnagdi-cloud-sync-worker.workers.dev/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: pin,
          device_id: deviceId
        })
      })

      const data = await response.json()

      if (data.success && data.token) {
        // Securely store token
        await SecureStore.setItemAsync('manager_jwt_token', data.token)
        setToken(data.token)
        Alert.alert('تم بنجاح', 'تم تسجيل الدخول وتوثيق الجهاز 🔓')
        router.replace('/')
      } else {
        Alert.alert('خطأ', data.message || 'رقم PIN غير صحيح')
      }
    } catch (error) {
      Alert.alert('خطأ في الاتصال', 'تعذر الاتصال بالسيرفر السحابي')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>🔐</Text>
        <Text style={styles.title}>تطبيق المالك — سوبر ماركت النجدي</Text>
        <Text style={styles.subtitle}>أدخل كود الـ PIN المخصص للوصول</Text>

        <TextInput
          style={styles.input}
          placeholder="••••"
          placeholderTextColor="#64748b"
          keyboardType="numeric"
          secureTextEntry
          maxLength={6}
          value={pin}
          onChangeText={setPin}
        />

        <TouchableOpacity 
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>تسجيل الدخول</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 360, backgroundColor: '#1e293b', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  logo: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 24 },
  input: { width: '100%', backgroundColor: '#0f172a', color: '#f8fafc', fontSize: 24, textAlign: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#475569', letterSpacing: 8, marginBottom: 20 },
  button: { width: '100%', backgroundColor: '#10b981', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
})
