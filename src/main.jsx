import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './app.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)

// Expose a global reset helper for debugging / support
// Usage in console: resetFlashcardApp()
window.resetFlashcardApp = () => {
  try {
    localStorage.clear()
    sessionStorage.clear()
  } catch {}
  window.location.reload()
}
