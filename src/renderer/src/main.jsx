import './assets/main.css'

// Silence logs in production
if (import.meta.env.PROD) {
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
  console.error = () => {}
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)
