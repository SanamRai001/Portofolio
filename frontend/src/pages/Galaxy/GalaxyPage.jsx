import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import useReducedMotion from '../../motion/useReducedMotion.js'
import GalaxyScene from './scene/GalaxyScene.jsx'
import GalaxyFallback from './ui/GalaxyFallback.jsx'
import { createNavigationController } from './navigation/NavigationController.js'
import { createPortalController } from './navigation/PortalController.js'
import GalaxyPortalOverlay from './ui/GalaxyPortalOverlay.jsx'
import { CORE } from './data/core.js'
import GalaxyNavigation from './ui/GalaxyNavigation.jsx'
import './GalaxyPage.css'

export default function GalaxyPage() {
  const reducedMotion = useReducedMotion()
  const [navigation] = useState(createNavigationController)
  const [portal] = useState(() => createPortalController({
    destination: '/',
    onCommit: destination => window.location.assign(destination),
  }))
  const portalState = useSyncExternalStore(portal.subscribe, portal.getSnapshot)
  const portalEntering = portalState.mode !== 'idle'
  const portalActive = portalEntering && portalState.mode !== 'committed'
  const [paused, setPaused] = useState(false)
  const [still, setStill] = useState(false)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  const onReady = useCallback(() => setReady(true), [])
  const onError = useCallback(() => { portal.cancel(); setFailed(true) }, [portal])
  const fallback = still || failed

  useEffect(() => {
    const previousTitle = document.title
    document.title = `Galaxy | ${CORE.name}`
    return () => { document.title = previousTitle }
  }, [])

  return (
    <main className={`GalaxyPage${portalEntering ? ' is-portal-entering' : ''}`} aria-labelledby="galaxy-title">
      <header className="GalaxyHeader">
        <h1 id="galaxy-title"><span>{CORE.shortName}</span><span aria-hidden="true">/</span>Galaxy</h1>
        <a className="GalaxyExit" href="/">Exit to portfolio <span aria-hidden="true">↗</span></a>
      </header>

      <GalaxyNavigation navigation={navigation} portal={portal} staticView={fallback} reducedMotion={reducedMotion}>
        {(selectedBodyId, state) => <>
          {fallback ? <GalaxyFallback selectedBodyId={selectedBodyId} selectedSkillId={state.selectedSkillId} hoveredSkillId={state.hoveredSkillId} navigation={navigation} /> : <GalaxyScene navigation={navigation} portal={portal} paused={paused} reducedMotion={reducedMotion} onReady={onReady} onError={onError} />}
          {!fallback && !ready && <p className="GalaxyLoading" role="status">Opening the solar system…</p>}
        </>}
      </GalaxyNavigation>

      <GalaxyPortalOverlay portal={portal} />
      {portalActive && portalState.mode !== 'blackout' && (
        <button className="GalaxyPortalAbort" type="button" onClick={() => { portal.cancel(); navigation.goBack() }}>
          ← Return to system <span>Esc</span>
        </button>
      )}

      <footer className="GalaxyFooter">
        <div className="GalaxyCaption">
          <p className="GalaxyEyebrow">A system in motion</p>
          <p>One core. Many directions.</p>
        </div>
        {fallback && <p className="GalaxyFallbackNote" role="status">{failed ? 'Static system · 3D is unavailable on this device.' : 'Static system · motion is off.'}</p>}
        <div className="GalaxyControls" role="group" aria-label="Sky preferences">
          {!fallback && !reducedMotion && (
            <button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>Pause motion</button>
          )}
          {reducedMotion && !fallback && <span className="GalaxyMotionNote">Motion reduced</span>}
          {!failed && (
            <button type="button" aria-pressed={still} disabled={portalActive} onClick={() => { setReady(false); setStill(!still) }}>Still view</button>
          )}
        </div>
      </footer>
    </main>
  )
}
