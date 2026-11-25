import { Component, lazy, Suspense } from 'react'
import { routeFamily, useJourneyTransition } from './motion/useJourneyTransition.js'
import JourneyVeil from './motion/JourneyVeil.jsx'

const Portfolio = lazy(() => import('./App.jsx'))
const Galaxy = lazy(() => import('./pages/Galaxy/GalaxyPage.jsx'))
// The cube is the canonical homepage; old preview paths remain compatible.
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

// Only the cube/space journey is coordinated here; all other links stay native.
export default function PortfolioRoutes({ initialCube, artworkUrl } = {}) {
  const journey = useJourneyTransition()
  const family = routeFamily(journey.location.path)
  const galaxy = family === 'space'
  const cubePreview = family === 'cube'
  const Cube = initialCube || CubePortalPreview
  return (
    <>
    <div inert={Boolean(journey.motion)}>
    <RouteBoundary key={family}>
      <Suspense fallback={
        <main className="EntryState">
          <p role="status">{galaxy ? 'Entering deep space…' : cubePreview ? 'Opening portfolio…' : 'Loading portfolio…'}</p>
          <a href="/">Return to portfolio</a>
        </main>
      }>
        {galaxy ? <Galaxy journey={journey} /> : cubePreview ? <Cube journey={journey} artworkUrl={artworkUrl} /> : <Portfolio labPreview={['/lab', '/lab-preview'].includes(journey.location.path.replace(/\/+$/, ''))} />}
      </Suspense>
    </RouteBoundary>
    </div>
    <JourneyVeil motion={journey.motion} />
    </>
  )
}
