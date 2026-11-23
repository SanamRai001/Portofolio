import { Component, lazy, Suspense } from 'react'

const Portfolio = lazy(() => import('./App.jsx'))
const Galaxy = lazy(() => import('./pages/Galaxy/GalaxyPage.jsx'))
// Review route only: production homepage stays unchanged until GPU/browser acceptance.
const CubePortalPreview = lazy(() => import('./pages/CubePortal/CubePortal.jsx'))

class RouteBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="EntryState">
          <h1>This view could not be loaded.</h1>
          <p>Try again, or return to the portfolio.</p>
          <button onClick={() => window.location.reload()}>Try again</button>
          <a href="/">Return to portfolio</a>
        </main>
      )
    }
    return this.props.children
  }
}

// Native document navigation preserves normal links and browser back/forward.
// The 3D preview and Galaxy are each lazy-loaded, keeping home bundle isolated.
export default function PortfolioRoutes() {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/'
  const galaxy = pathname === '/galaxy' || pathname.startsWith('/galaxy/')
  const cubePreview = pathname === '/cube-preview'
  return (
    <RouteBoundary>
      <Suspense fallback={
        <main className="EntryState">
          <p role="status">{galaxy ? 'Entering deep space…' : cubePreview ? 'Opening cube preview…' : 'Loading portfolio…'}</p>
          <a href="/">Return to portfolio</a>
        </main>
      }>
        {galaxy ? <Galaxy /> : cubePreview ? <CubePortalPreview /> : <Portfolio />}
      </Suspense>
    </RouteBoundary>
  )
}
