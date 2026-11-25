import { COVER_MS, REVEAL_MS } from './useJourneyTransition.js'
import './journeyTransition.css'

export default function JourneyVeil({ motion }) {
  if (!motion) return null
  const { origin, phase, target } = motion
  return (
    <div className="JourneyVeil" data-phase={phase} data-target={target} aria-hidden="true"
      style={{'--journey-x': origin.x + 'px', '--journey-y': origin.y + 'px', '--journey-radius': origin.radius + 'px',
        '--journey-cover-ms': COVER_MS + 'ms', '--journey-reveal-ms': REVEAL_MS + 'ms'}}>
      <div className="JourneyVeilShade" />
      <div className="JourneyVeilRing" />
      <div className="JourneyVeilOrbit" />
    </div>
  )
}
