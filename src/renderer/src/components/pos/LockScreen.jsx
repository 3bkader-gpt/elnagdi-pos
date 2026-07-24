import React, { useRef, useEffect } from 'react'
import { Lock, Delete } from 'lucide-react'

export default function LockScreen({ pin, setPin, handlePinSubmit }) {
  const inputRef = useRef(null)

  // Auto focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Keep focus on input even when clicking away on the container
  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const pinLength = pin.length

  return (
    <div 
      className="modal-overlay" 
      onClick={handleContainerClick}
      style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        overflow: 'hidden'
      }}
    >
      {/* Decorative background blur shapes (Soft light pastel glows) */}
      <div style={{
        position: 'absolute',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, rgba(0,0,0,0) 70%)',
        top: '10%',
        left: '20%',
        borderRadius: '50%',
        filter: 'blur(40px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, rgba(0,0,0,0) 70%)',
        bottom: '10%',
        right: '15%',
        borderRadius: '50%',
        filter: 'blur(50px)',
        pointerEvents: 'none'
      }} />

      {/* Lock Card (Light Glassmorphism) */}
      <div 
        className="modal-content"
        style={{
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          borderRadius: '24px',
          padding: '40px 35px',
          width: '400px',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          animation: 'modalSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()} // prevent double-focus trigger
      >
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            padding: '16px',
            borderRadius: '50%',
            boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Lock size={30} style={{ color: '#ffffff' }} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
            بوابة تسجيل دخول المبيعات
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            يرجى إدخال رمز المرور لتفعيل شيفت الكاشير
          </p>
        </div>

        {/* Hidden Input for Keyboard Typing */}
        <input 
          ref={inputRef}
          type="password" 
          pattern="[0-9]*"
          inputMode="numeric"
          value={pin} 
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').substring(0, 4))}
          style={{
            position: 'absolute',
            opacity: 0,
            pointerEvents: 'none',
            width: 0,
            height: 0
          }}
          autoFocus
        />

        {/* Passcode Dots Indicators (Light Theme) */}
        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50px',
          margin: '5px 0'
        }}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = index < pinLength
            return (
              <div 
                key={index} 
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: isFilled ? '2px solid #3b82f6' : '2px solid #cbd5e1',
                  backgroundColor: isFilled ? '#3b82f6' : 'transparent',
                  boxShadow: isFilled ? '0 0 10px rgba(59, 130, 246, 0.4)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isFilled ? 'scale(1.15)' : 'scale(1)'
                }}
              />
            )
          })}
        </div>

        {/* Keypad Grid (Light Theme) */}
        <form onSubmit={handlePinSubmit} style={{ width: '100%' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            justifyItems: 'center',
            width: '100%'
          }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button 
                key={num} 
                type="button" 
                onClick={() => setPin(prev => prev.length < 4 ? prev + num : prev)}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  background: 'rgba(0, 0, 0, 0.02)',
                  color: '#1e293b',
                  fontSize: '1.45rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f1f5f9'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.borderColor = '#3b82f6'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.05)'
                }}
              >
                {num}
              </button>
            ))}
            
            {/* Delete / Backspace Button */}
            <button 
              type="button" 
              onClick={() => setPin(prev => prev.slice(0, -1))}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(244, 63, 94, 0.08)',
                color: '#f43f5e',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(244, 63, 94, 0.15)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(244, 63, 94, 0.08)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <Delete size={20} />
            </button>

            {/* Zero Button */}
            <button 
              type="button" 
              onClick={() => setPin(prev => prev.length < 4 ? prev + '0' : prev)}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                background: 'rgba(0, 0, 0, 0.02)',
                color: '#1e293b',
                fontSize: '1.45rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f1f5f9'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.borderColor = '#3b82f6'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.05)'
              }}
            >
              0
            </button>

            {/* Submit / Enter Button */}
            <button 
              type="submit" 
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 12px rgba(16, 185, 129, 0.2)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(16, 185, 129, 0.35)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(16, 185, 129, 0.2)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              دخول
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
