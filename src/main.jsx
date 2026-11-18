import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// CSS viewport units (100vh/100svh) don't reliably match the actual
// usable screen in an iOS home-screen ("Add to Home Screen") PWA, which
// was leaving a gap of bare background below the bottom-most UI with no
// way to scroll to it. Measuring the real height in JS and exposing it
// as a CSS variable (used by #root in index.css) is the standard, more
// reliable fix for this class of bug than any viewport-unit keyword.
function setAppHeight() {
  const height = window.visualViewport?.height || window.innerHeight
  document.documentElement.style.setProperty('--app-height', `${height}px`)
}
setAppHeight()
window.addEventListener('resize', setAppHeight)
window.visualViewport?.addEventListener('resize', setAppHeight)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
