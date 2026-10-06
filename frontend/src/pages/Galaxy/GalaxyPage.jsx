import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import useReducedMotion from '../../motion/useReducedMotion.js'
import GalaxyScene from './scene/GalaxyScene.jsx'
import GalaxyFallback from './ui/GalaxyFallback.jsx'
import { createNavigationController } from './navigation/NavigationController.js'
import { bindGalaxyHistory, parseGalaxyPath } from './navigation/GalaxyHistory.js'
import { createPortalController } from './navigation/PortalController.js'
import GalaxyPortalOverlay from './ui/GalaxyPortalOverlay.jsx'
import { createGalaxySoundscape } from './audio/Soundscape.js'
import { CORE } from './data/core.js'
import { projectById } from './data/projects.js'
import {
  GALAXY_METADATA,
  PORTFOLIO_ORIGIN,
  applyDocumentMetadata,
  projectMetadataById,
  syncProjectStructuredData,
} from './projectMetadata.js'
import GalaxyNavigation from './ui/GalaxyNavigation.jsx'
import './GalaxyPage.css'

export default function GalaxyPage() {
  const reducedMotion = useReducedMotion()
  const [navigation] = useState(createNavigationController)
  const [soundscape] = useState(createGalaxySoundscape)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [soundUnavailable, setSoundUnavailable] = useState(false)
  const [portal] = useState(() => createPortalController({
    destination: '/',
    onCommit: destination => window.location.assign(destination),
  }))
  const portalState = useSyncExternalStore(portal.subscribe, portal.getSnapshot)
  const portalEntering = portalState.mode !== 'idle'
  const portalActive = portalEntering && portalState.mode !== 'committed'
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  const onReady = useCallback(() => setReady(true), [])
  const onError = useCallback(() => {
    portal.cancel()
    soundscape.disable()
    setSoundEnabled(false)
    setFailed(true)
  }, [portal, soundscape])
  const fallback = failed

  useEffect(() => bindGalaxyHistory({ navigation }), [navigation])

  const syncSoundscape = useCallback(() => {
    const nav = navigation.getSnapshot()
    soundscape.setSignals({
      selectedBodyId: nav.selectedBodyId,
      hoveredBodyId: nav.hoveredBodyId,
      navigationMode: nav.mode,
      portalMode: portal.getSnapshot().mode,
      hidden: document.hidden,
      staticView: fallback,
      reducedMotion,
    })
  }, [fallback, navigation, portal, reducedMotion, soundscape])

  useEffect(() => {
    syncSoundscape()
    const navUnsubscribe = navigation.subscribe(syncSoundscape)
    const portalUnsubscribe = portal.subscribe(syncSoundscape)
    const onVisibility = () => {
      if (document.hidden) {
        soundscape.disable()
        setSoundEnabled(false)
      }
      syncSoundscape()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      navUnsubscribe()
      portalUnsubscribe()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [navigation, portal, soundscape, syncSoundscape])

  useEffect(() => () => soundscape.dispose(), [soundscape])

  const enableSoundFromInteraction = useCallback(async () => {
    if (soundEnabled || soundUnavailable || fallback) return
    const enabled = await soundscape.enable()
    setSoundEnabled(enabled)
    if (!enabled) setSoundUnavailable(true)
  }, [fallback, soundEnabled, soundUnavailable, soundscape])

  const toggleSound = useCallback(async () => {
    if (soundEnabled) {
      soundscape.disable()
      setSoundEnabled(false)
      return
    }
    if (soundUnavailable || fallback) return
    const enabled = await soundscape.enable()
    setSoundEnabled(enabled)
    if (!enabled) setSoundUnavailable(true)
  }, [fallback, soundEnabled, soundUnavailable, soundscape])

  useEffect(() => {
    const tracked = [
      ['link[rel="canonical"]', 'href'],
      ['meta[name="description"]', 'content'],
      ['meta[property="og:type"]', 'content'],
      ['meta[property="og:url"]', 'content'],
      ['meta[property="og:title"]', 'content'],
      ['meta[property="og:description"]', 'content'],
      ['meta[property="og:image"]', 'content'],
      ['meta[name="twitter:title"]', 'content'],
      ['meta[name="twitter:description"]', 'content'],
      ['meta[name="twitter:image"]', 'content'],
    ].map(([selector, attribute]) => {
      const node = document.querySelector(selector)
      return { node, attribute, value: node?.getAttribute(attribute) ?? null }
    })
    const previousTitle = document.title
    const previousStructured = document.querySelector('script[data-galaxy-project]')?.cloneNode(true)

    function syncMetadata() {
      const snapshot = navigation.getSnapshot()
      const route = parseGalaxyPath(window.location.pathname)
      const projectId = snapshot.selectedProjectId || (route?.kind === 'project' ? route.projectId : null)
      const project = projectId ? projectById(projectId) : null

      if (project) {
        applyDocumentMetadata(projectMetadataById(project.id))
        syncProjectStructuredData(project)
        return
      }

      const path = window.location.pathname.replace(/\/+$/, '') || '/galaxy'
      applyDocumentMetadata({
        ...GALAXY_METADATA,
        path,
        url: `${PORTFOLIO_ORIGIN}${path}`,
      })
      syncProjectStructuredData(null)
    }

    syncMetadata()
    const unsubscribe = navigation.subscribe(syncMetadata)
    window.addEventListener('popstate', syncMetadata)

    return () => {
      unsubscribe()
      window.removeEventListener('popstate', syncMetadata)
      document.title = previousTitle
      for (const { node, attribute, value } of tracked) {
        if (!node) continue
        if (value === null) node.removeAttribute(attribute)
        else node.setAttribute(attribute, value)
      }
      document.querySelector('script[data-galaxy-project]')?.remove()
      if (previousStructured) document.head.appendChild(previousStructured)
    }
  }, [navigation])

  return (
    <main className={`GalaxyPage${portalEntering ? ' is-portal-entering' : ''}`} aria-labelledby="galaxy-title">
      <header className="GalaxyHeader">
        <h1 id="galaxy-title"><span>{CORE.shortName}</span><span aria-hidden="true">/</span>Galaxy</h1>
        <div className="GalaxyHeaderActions">
          <button
            type="button"
            className="GalaxySoundGlyph"
            aria-label={soundUnavailable ? 'Galaxy ambience unavailable' : soundEnabled ? 'Mute Galaxy ambience' : 'Enable Galaxy ambience'}
            aria-pressed={soundEnabled}
            disabled={soundUnavailable || fallback}
            onClick={toggleSound}
          >
            <span aria-hidden="true">{soundEnabled ? '◉' : '○'}</span>
            <span>Sound</span>
          </button>
          <a className="GalaxyExit" href="/">Exit to portfolio <span aria-hidden="true">↗</span></a>
        </div>
      </header>

      <GalaxyNavigation navigation={navigation} portal={portal} staticView={fallback} reducedMotion={reducedMotion} onInteract={enableSoundFromInteraction}>
        {(selectedBodyId, state) => <>
          {fallback ? <GalaxyFallback selectedBodyId={selectedBodyId} selectedSkillId={state.selectedSkillId} hoveredSkillId={state.hoveredSkillId} selectedProjectId={state.selectedProjectId} hoveredProjectId={state.hoveredProjectId} selectedJourneyId={state.selectedJourneyId} hoveredJourneyId={state.hoveredJourneyId} selectedLabId={state.selectedLabId} hoveredLabId={state.hoveredLabId} navigation={navigation} /> : <GalaxyScene navigation={navigation} portal={portal} paused={false} reducedMotion={reducedMotion} onReady={onReady} onError={onError} />}
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
          <p className="GalaxyTextureCredit">Planet imagery: <a href="https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/" target="_blank" rel="noreferrer">NASA Earth Observatory</a> (Earth) · <a href="https://edu.solarsystemscope.com/textures/" target="_blank" rel="noreferrer">Solar System Scope</a> (other worlds, CC BY 4.0)</p>
        </div>
        {fallback && <p className="GalaxyFallbackNote" role="status">Static system · 3D is unavailable on this device.</p>}
        <p className="GalaxyInteractionHint">Click the sun and planets to explore.</p>
      </footer>
    </main>
  )
}
