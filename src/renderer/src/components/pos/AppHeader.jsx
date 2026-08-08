import React from 'react'
import { ShoppingCart, Clock, User, Key, LogOut, Lock, Wallet, Tag } from 'lucide-react'
import packageInfo from '../../../../../package.json'

export default function AppHeader({
  currentUser,
  currentView,
  setCurrentView,
  currentShift,
  setCloseShiftModal,
  setOpenShiftModal,
  handleLock,
  fetchAdminData,
  setShowChangePinModal,
  onManualAuditTrigger
}) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <ShoppingCart size={24} style={{ color: 'var(--accent-blue)' }} />
        <h1>سوبر ماركت النجدي</h1>
        <span className="badge-status">
          <Clock size={14} />
          متصل محلياً (SQLite)
        </span>
        <span className="badge-status" style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)', marginRight: '8px' }}>
          v{packageInfo.version}
        </span>
        {currentUser && (
          <div className="header-nav" style={{ marginRight: '20px', display: 'flex', gap: '10px' }}>
            <button 
              className={`btn ${currentView === 'pos' ? 'btn-primary' : 'btn-secondary'}`} 
              style={{ padding: '6px 12px', fontSize: '0.85rem' }} 
              onClick={() => setCurrentView('pos')}
            >
              شاشة الكاشير (POS)
            </button>
            <button 
              className={`btn ${currentView === 'price_catalog' ? 'btn-primary' : 'btn-secondary'}`} 
              style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }} 
              onClick={() => setCurrentView('price_catalog')}
              title="قائمة الأسعار التفاعلية والمنيو"
            >
              <Tag size={15} />
              ليستة الأسعار
            </button>
            <button 
              className={`btn ${currentView === 'tills' ? 'btn-primary' : 'btn-secondary'}`} 
              style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }} 
              onClick={() => setCurrentView('tills')}
              title="الأدراج والتحويلات الرقمية"
            >
              <Wallet size={15} />
              الأدراج
            </button>
            {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
              <button 
                className={`btn ${currentView === 'admin' ? 'btn-primary' : 'btn-secondary'}`} 
                style={{ padding: '6px 12px', fontSize: '0.85rem' }} 
                onClick={() => {
                  setCurrentView('admin')
                  fetchAdminData()
                }}
              >
                إدارة المخزن والتقارير
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="header-meta">
        <div className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={16} />
          <span>الموظف: <strong>{currentUser?.username}</strong> ({currentUser?.role === 'admin' ? 'مدير' : 'كاشير'})</span>
          <button 
            className="btn btn-secondary" 
            title="تغيير رمز المرور الخاص بك"
            style={{ padding: '2px 6px', fontSize: '0.75rem', height: '24px', display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={() => setShowChangePinModal(true)}
          >
            <Key size={12} />
            رمز المرور
          </button>
        </div>
        {currentShift && currentShift.id ? (
          <>
            <div className="meta-item">
              <Key size={16} />
              الشيفت رقم: <strong>#{currentShift.id}</strong>
            </div>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '6px 12px', fontSize: '0.85rem', color: 'var(--accent-amber)', borderColor: 'var(--accent-amber)' }} 
              onClick={onManualAuditTrigger}
              title="جرد الخزنة والدرج دورياً للتأكد من الموازنة"
            >
              <Clock size={16} />
              جرد دوري للدرج
            </button>
            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setCloseShiftModal(true)}>
              <LogOut size={16} />
              إغلاق الوردية
            </button>
          </>
        ) : (
          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem', color: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)' }} onClick={() => setOpenShiftModal(true)}>
            <Key size={16} />
            فتح وردية جديدة
          </button>
        )}
        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={handleLock}>
          <Lock size={16} />
          تسجيل الخروج
        </button>
      </div>
    </header>
  )
}
