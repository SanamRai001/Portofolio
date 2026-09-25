import { Component, lazy, Suspense } from 'react'

const Portfolio = lazy(() => import('./App.jsx'))
const Galaxy = lazy(() => import('./pages/Galaxy/GalaxyPage.jsx'))

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

// Native document navigation preserves normal links, back/forward and homepage
// hash navigation. Only the selected experience (including its CSS) is imported.
export default function PortfolioRoutes() {
  const galaxy = window.location.pathname.replace(/\/+$/, '') === '/galaxy'
  return (
    <RouteBoundary>
      <Suspense fallback={
        <main className="EntryState">
          <p role="status">{galaxy ? 'Entering deep space…' : 'Loading portfolio…'}</p>
          <a href="/">Return to portfolio</a>
        </main>
      }>
        {galaxy ? <Galaxy /> : <Portfolio />}
      </Suspense>
    </RouteBoundary>
  )
}
