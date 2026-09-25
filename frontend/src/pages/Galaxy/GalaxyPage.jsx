import { useCallback, useEffect, useState } from 'react'
import useReducedMotion from '../../motion/useReducedMotion.js'
import GalaxyScene from './scene/GalaxyScene.jsx'
import GalaxyFallback from './ui/GalaxyFallback.jsx'
import { SYSTEM_MAP } from './data/solarSystem.js'
import './GalaxyPage.css'

export default function GalaxyPage() {
  const reducedMotion = useReducedMotion()
  const [paused, setPaused] = useState(false)
  const [still, setStill] = useState(false)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  const onReady = useCallback(() => setReady(true), [])
  const onError = useCallback(() => setFailed(true), [])
  const fallback = still || failed

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Galaxy | Sanam Rai'
    return () => { document.title = previousTitle }
  }, [])

  return (
    <main className="GalaxyPage" aria-labelledby="galaxy-title">
      <header className="GalaxyHeader">
        <h1 id="galaxy-title"><span>Sanam</span><span aria-hidden="true">/</span>Galaxy</h1>
        <a className="GalaxyExit" href="/">Exit to portfolio <span aria-hidden="true">↗</span></a>
      </header>

      <div className="GalaxyStage">
        {fallback ? <GalaxyFallback /> : <GalaxyScene paused={paused} reducedMotion={reducedMotion} onReady={onReady} onError={onError} />}
        {!fallback && !ready && <p className="GalaxyLoading" role="status">Opening the solar system…</p>}
      </div>
      <section className="GalaxySystemMap" aria-label="Solar system map">
        <div className="GalaxyMapHeading"><span>System / 01</span><span>Overview · G2</span></div>
        <ol>{SYSTEM_MAP.map((body, index) => <li key={body.id} style={{ '--body-color': body.color }}>
          <span className="GalaxyMapIndex">{String(index).padStart(2, '0')}</span>
          <span><strong>{body.label}</strong><small>{body.id === 'core' ? 'Sanam / Core' : body.id === 'lab' ? 'Unknown signal' : 'Orbital body'}</small></span>
        </li>)}</ol>
      </section>

      <footer className="GalaxyFooter">
        <div className="GalaxyCaption">
          <p className="GalaxyEyebrow">A system in motion</p>
          <p>One core. Many directions.</p>
        </div>
        {fallback && <p className="GalaxyFallbackNote" role="status">{failed ? 'Static overview · 3D is unavailable on this device.' : 'Static overview · motion is off.'}</p>}
        <div className="GalaxyControls" role="group" aria-label="Sky preferences">
          {!fallback && !reducedMotion && (
            <button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>Pause motion</button>
          )}
          {reducedMotion && !fallback && <span className="GalaxyMotionNote">Motion reduced</span>}
          {!failed && (
            <button type="button" aria-pressed={still} onClick={() => { setReady(false); setStill(!still) }}>Still view</button>
          )}
        </div>
      </footer>
    </main>
  )
}
