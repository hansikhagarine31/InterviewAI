import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Ink-wash paper (light) is the default; remember an explicit dark choice.
try {
  document.body.classList.toggle('light-mode', localStorage.getItem('theme') !== 'dark')
} catch {
  document.body.classList.add('light-mode')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
