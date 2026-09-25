import { useCallback, useEffect, useState } from 'react'
import useReducedMotion from '../../motion/useReducedMotion.js'
import GalaxyScene from './scene/GalaxyScene.jsx'
import GalaxyFallback from './ui/GalaxyFallback.jsx'
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
      {fallback
        ? <GalaxyFallback failed={failed} />
        : <GalaxyScene paused={paused} reducedMotion={reducedMotion} onReady={onReady} onError={onError} />}

      <header className="GalaxyHeader">
        <h1 id="galaxy-title"><span>Sanam</span><span aria-hidden="true">/</span>Galaxy</h1>
        <a className="GalaxyExit" href="/">Exit to portfolio <span aria-hidden="true">↗</span></a>
      </header>

      {!fallback && !ready && <p className="GalaxyLoading" role="status">Opening the sky…</p>}

      <footer className="GalaxyFooter">
        <div className="GalaxyCaption">
          <p className="GalaxyEyebrow">Deep space</p>
          <p>A place for curiosity.</p>
        </div>
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
