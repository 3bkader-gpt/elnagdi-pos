import React, { useState } from 'react'
import { Database, Download, Upload, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react'

export default function BackupTab() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })

  const handleBackup = async () => {
    setLoading(true)
    setStatus({ type: '', message: '' })
    try {
      const res = await window.api.db.backup()
      if (res.success) {
        setStatus({
          type: 'success',
          message: `تم بنجاح حفظ نسخة احتياطية في المسار: ${res.filePath}`
        })
      } else {
        if (res.error !== 'User cancelled') {
          setStatus({ type: 'error', message: `فشل النسخ الاحتياطي: ${res.error}` })
        }
      }
    } catch (e) {
      setStatus({ type: 'error', message: `خطأ غير متوقع: ${e.message}` })
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async () => {
    const confirmRestore = window.confirm(
      'تحذير هام جداً:\nاستيراد قاعدة بيانات سيبدل كافة البيانات الحالية بالكامل (المخزن، المبيعات، الحسابات) بالنسخة المستوردة ولا يمكن التراجع عن هذا الإجراء.\n\nهل تريد الاستمرار؟'
    )
    if (!confirmRestore) return

    setLoading(true)
    setStatus({ type: '', message: '' })
    try {
      const res = await window.api.db.restore()
      if (res.success) {
        setStatus({
          type: 'success',
          message: 'تم استرجاع قاعدة البيانات بنجاح! يرجى إغلاق البرنامج وإعادة تشغيله لتطبيق التغييرات.'
        })
      } else {
        if (res.error !== 'User cancelled') {
          setStatus({ type: 'error', message: `فشل استرجاع قاعدة البيانات: ${res.error}` })
        }
      }
    } catch (e) {
      setStatus({ type: 'error', message: `خطأ غير متوقع: ${e.message}` })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', direction: 'rtl' }}>
      
      {/* Header card */}
      <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '20px' }}>
        <div style={{
          background: 'rgba(37, 99, 235, 0.1)',
          color: 'var(--accent-blue)',
          padding: '12px',
          borderRadius: '12px'
        }}>
          <Database size={28} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>مركز الأمان والنسخ الاحتياطي</h3>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            احمِ بيانات متجرك من الضياع عبر أخذ نسخ احتياطية دورية واسترجاعها بأمان عند الحاجة.
          </p>
        </div>
      </div>

      {status.message && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '8px',
          fontWeight: 700,
          fontSize: '0.9rem',
          background: status.type === 'success' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(220, 38, 38, 0.1)',
          color: status.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
          border: '1px solid',
          borderColor: status.type === 'success' ? 'rgba(5, 150, 105, 0.2)' : 'rgba(220, 38, 38, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {status.type === 'success' ? <CheckCircle size={18} /> : <ShieldAlert size={18} />}
          <span>{status.message}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Backup column */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18} style={{ color: 'var(--accent-blue)' }} />
            حفظ نسخة احتياطية جديدة
          </h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            سيقوم النظام بتصدير نسخة كاملة ومحدثة من قاعدة البيانات الحالية. يُنصح بحفظها على قرص خارجي أو فلاشة USB أو سحابة إلكترونية أسبوعياً.
          </p>
          <button
            onClick={handleBackup}
            disabled={loading}
            style={{
              marginTop: 'auto',
              padding: '12px',
              borderRadius: '8px',
              background: 'var(--accent-blue)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.9rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'opacity 0.2s'
            }}
          >
            {loading ? <RefreshCw className="spin" size={18} /> : <Download size={18} />}
            إنشاء نسخة احتياطية الآن
          </button>
        </div>

        {/* Restore column */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={18} />
            استرجاع نسخة احتياطية سابقة
          </h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            اختر ملف نسخة احتياطية محفوظاً سابقاً على جهازك لاسترجاع البيانات بالكامل. 
            <span style={{ color: 'var(--accent-rose)', fontWeight: 700 }}> تنبيه: </span> 
            هذا الإجراء سيمسح البيانات الحالية التي تم تسجيلها بعد تاريخ النسخة الاحتياطية.
          </p>
          <button
            onClick={handleRestore}
            disabled={loading}
            style={{
              marginTop: 'auto',
              padding: '12px',
              borderRadius: '8px',
              background: 'transparent',
              color: 'var(--accent-rose)',
              fontWeight: 700,
              fontSize: '0.9rem',
              border: '2px solid var(--accent-rose)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent-rose)'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--accent-rose)'
            }}
          >
            {loading ? <RefreshCw className="spin" size={18} /> : <Upload size={18} />}
            استيراد واسترجاع الداتا
          </button>
        </div>

      </div>

      {/* Safety Instructions Card */}
      <div className="admin-card" style={{ padding: '20px', borderLeft: '4px solid var(--accent-amber)', background: 'rgba(245, 158, 11, 0.03)' }}>
        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldAlert size={18} />
          إرشادات الأمان الهامة لحماية البيانات:
        </h4>
        <ul style={{ margin: '10px 0 0 0', paddingRight: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
          <li>يرجى الحفاظ على سرية ملفات النسخ الاحتياطي لعدم تعريض بيانات مبيعاتك وأرباحك للتسريب.</li>
          <li>تأكد من عدم فصل الكهرباء أو إغلاق الجهاز أثناء حفظ أو استرجاع قاعدة البيانات لعدم حدوث عطب بالملف.</li>
          <li>النظام يستعمل معمارية <strong>SQLite WAL mode</strong>، وهي آمنة جداً ضد الأعطال الفجائية وانقطاع التيار الكهربائي.</li>
        </ul>
      </div>

    </div>
  )
}
