import { StrictMode, createElement } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './entry.css'

const container = document.getElementById('root')
const pathname = window.location.pathname.replace(/\/+$/, '') || '/'

// Keep homepage and Galaxy code split. The published homepage carries real
// React-generated HTML and must hydrate, not replace, that content.
if (pathname === '/' && container.hasChildNodes()) {
  import('./App.jsx').then((module) => {
    hydrateRoot(container,
      createElement(StrictMode, null, createElement(module.default)),
    )
  })
} else {
  // Dev mode still starts with an empty root. Galaxy retains its lazy route
  // controller and its own HTML shell instead of loading homepage markup.
  import('./PortfolioRoutes.jsx').then((module) => {
    createRoot(container).render(
      createElement(StrictMode, null, createElement(module.default)),
    )
  })
}
