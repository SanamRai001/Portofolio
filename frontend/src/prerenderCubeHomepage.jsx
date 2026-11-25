import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import PortfolioRoutes from './PortfolioRoutes.jsx'
import CubePortal from './pages/CubePortal/CubePortal.jsx'

// The actual interactive route tree, not a parallel SEO-only homepage.
export function renderCubeHomepage(artworkUrl) {
  return renderToString(
    <StrictMode><PortfolioRoutes initialCube={CubePortal} artworkUrl={artworkUrl} /></StrictMode>,
  )
}
