import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import PortfolioRoutes from './PortfolioRoutes.jsx'
import './entry.css'

const container = document.getElementById('root')
const params = new URLSearchParams(window.location.search)
const canonicalHome = window.location.pathname === '/'
let dark = false
try { dark = localStorage.getItem('sanam-cube-theme') === 'dark' } catch { /* default light */ }
const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
const defaultView = !window.location.hash || window.location.hash === '#home'
// Only hydrate when the browser's initial state matches the prerendered tree.
// Alternate themes, direct Work links and diagnostics mount their real state.
const hydrate = canonicalHome && container.dataset.prerender === 'cube-v1' &&
  !dark && !reduced && defaultView && params.get('fracture') !== '7' && !params.has('cubeDebug')

if (hydrate) {
  import('./pages/CubePortal/CubePortal.jsx').then(({ default: Cube }) => {
    hydrateRoot(container, <StrictMode><PortfolioRoutes initialCube={Cube} /></StrictMode>)
  }).catch(error => {
    console.error('Homepage hydration entry failed', error)
    container.replaceChildren()
    createRoot(container).render(<StrictMode><PortfolioRoutes /></StrictMode>)
  })
} else {
  container.replaceChildren()
  createRoot(container).render(<StrictMode><PortfolioRoutes /></StrictMode>)
}
