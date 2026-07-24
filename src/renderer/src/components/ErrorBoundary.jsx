import React, { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[React Error Boundary Catched Error]', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: 'var(--bg-main, #f8fafc)',
          color: 'var(--text-main, #0f172a)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'var(--bg-card, #ffffff)',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            maxWidth: '500px',
            width: '100%',
            border: '1px solid var(--border-color, #e2e8f0)'
          }}>
            <span style={{ fontSize: '4rem', display: 'block', marginBottom: '20px' }}>⚠️</span>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '850', marginBottom: '15px', color: 'var(--accent-rose, #e11d48)' }}>
              عذراً، حدث خطأ غير متوقع في النظام!
            </h1>
            <p style={{ color: 'var(--text-secondary, #64748b)', marginBottom: '25px', lineHeight: '1.6' }}>
              تسبب عطل مفاجئ في توقف واجهة البرنامج. يمكنك محاولة إعادة تحميل الصفحة أو التواصل مع الدعم الفني.
            </p>
            {this.state.error && (
              <pre style={{
                background: '#f1f5f9',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '25px',
                color: '#334155',
                maxHeight: '150px'
              }}>
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              style={{
                background: 'var(--accent-blue, #2563eb)',
                color: '#ffffff',
                border: 'none',
                padding: '12px 24px',
                fontSize: '1rem',
                fontWeight: 'bold',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                width: '100%'
              }}
              onMouseOver={(e) => e.target.style.background = '#1d4ed8'}
              onMouseOut={(e) => e.target.style.background = 'var(--accent-blue, #2563eb)'}
            >
              إعادة تحميل البرنامج
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
