import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './entry.css'

const container = document.getElementById('root')
const pathname = window.location.pathname.replace(/\/+$/, '') || '/'

// Keep homepage and Galaxy code split. The published homepage carries real
// React-generated HTML and must hydrate, not replace, that content.
if (pathname === '/' && container.hasChildNodes()) {
  import('./App.jsx').then(({ default: App }) => {
    hydrateRoot(container,
      <StrictMode><App /></StrictMode>,
    )
  })
} else {
  // Dev mode still starts with an empty root. Galaxy retains its lazy route
  // controller and its own HTML shell instead of loading homepage markup.
  import('./PortfolioRoutes.jsx').then(({ default: PortfolioRoutes }) => {
    createRoot(container).render(
      <StrictMode><PortfolioRoutes /></StrictMode>,
    )
  })
}
