import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import PortfolioRoutes from './PortfolioRoutes.jsx'
import './entry.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PortfolioRoutes />
  </StrictMode>,
)
