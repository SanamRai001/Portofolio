import { worldFracturePaths } from './worldFracture.mjs'
import './WorldFracture.css'

// Mounted only for Work navigation; no clones, screenshots or idle effects.
export default function WorldFracture({ flight }) {
  const paths = worldFracturePaths(flight)
  if (!paths.length) return null
  return (
    <svg className="CubeWorldFracture" viewBox={`0 0 ${flight.width} ${flight.height}`}
      preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <g className="CubeWorldFractureNetwork">
        {paths.map(({id,d,branch,delay}) => (
          <path key={id} d={d} pathLength="100" data-branch={branch}
            style={{'--world-crack-delay':delay+'ms'}} />
        ))}
      </g>
    </svg>
  )
}
