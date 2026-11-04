import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.jsx'

// Use the real homepage component tree; never maintain a second SEO-only copy.
export function renderHomepage() {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
