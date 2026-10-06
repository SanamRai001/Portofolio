import { useEffect, useRef, useSyncExternalStore } from 'react'
import { CORE } from '../data/core.js'
import { IDENTITY } from '../data/identity.js'
import { SKILLS, skillById } from '../data/skills.js'
import { PROJECTS, projectById } from '../data/projects.js'
import SkillsContent from './SkillsContent.jsx'
import ProjectsContent from './ProjectsContent.jsx'
import IdentityContent from './IdentityContent.jsx'
import CoreIdentity from './CoreIdentity.jsx'
import { SYSTEM_MAP } from '../data/solarSystem.js'

const IDLE_PORTAL = Object.freeze({ mode: 'idle', transitionId: 0 })
const emptyPortalSnapshot = () => IDLE_PORTAL
const subscribeEmptyPortal = () => () => {}

export default function GalaxyNavigation({ navigation, portal, staticView, reducedMotion = false, children }) {
  const state = useSyncExternalStore(navigation.subscribe, navigation.getSnapshot)
  const portalState = useSyncExternalStore(portal?.subscribe || subscribeEmptyPortal, portal?.getSnapshot || emptyPortalSnapshot)
  const portalActive = portalState.mode !== 'idle' && portalState.mode !== 'committed'
  const buttons = useRef(new Map()), backButton = useRef(null)
  const selected = SYSTEM_MAP.find(body => body.id === state.selectedBodyId)
  const hovered = SYSTEM_MAP.find(body => body.id === state.hoveredBodyId)
  const coreSelected = state.selectedBodyId === CORE.id
  const coreRevealed = coreSelected && state.mode === 'body_focused'
  const coreHovered = !selected && hovered?.id === CORE.id
  const identitySelected = state.selectedBodyId === IDENTITY.id
  const identityHovered = !selected && hovered?.id === IDENTITY.id
  const skillsSelected = state.selectedBodyId === SKILLS.id
  const skillSignal = skillsSelected && skillById(state.hoveredSkillId || state.selectedSkillId)
  const projectsSelected = state.selectedBodyId === PROJECTS.id
  const projectSignal = projectsSelected && projectById(state.hoveredProjectId || state.selectedProjectId)
  const returning = state.mode === 'returning_overview'

  function goBack() {
    if (portalState.mode === 'committed') return
    const id = state.selectedBodyId
    const restore = document.activeElement === backButton.current || Boolean(document.activeElement?.closest('.CoreIdentity, .IdentityContent, .SkillsContent, .ProjectsContent'))
    if (portalActive) portal?.cancel()
    navigation.goBack()
    if (restore) buttons.current.get(id)?.focus()
  }
  useEffect(() => {
    function escape(event) {
      if (event.key !== 'Escape' || !navigation.getSnapshot().selectedBodyId || portal?.getSnapshot().mode === 'committed') return
      const id = navigation.getSnapshot().selectedBodyId
      const restore = document.activeElement === backButton.current || Boolean(document.activeElement?.closest('.CoreIdentity, .IdentityContent, .SkillsContent, .ProjectsContent'))
      if (portal && portal.getSnapshot().mode !== 'idle') portal.cancel()
      navigation.goBack()
      if (restore) buttons.current.get(id)?.focus()
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [navigation, portal])
  useEffect(() => {
    if (staticView) navigation.complete(state.transitionId)
  }, [navigation, staticView, state.transitionId])

  const status = selected ? (state.mode === 'focusing_body' ? 'Navigating' : staticView ? 'Static selection' : 'Signal locked') : returning ? 'Returning to system' : 'Overview'
  return <>
    <div className={`GalaxyStage${coreSelected || identitySelected || skillsSelected || projectsSelected ? ' has-body-content' : ''}${coreSelected ? ' is-core' : identitySelected ? ' is-identity' : skillsSelected ? ' is-skills' : projectsSelected ? ' is-projects' : ''}`}>
      {children(state.selectedBodyId, state)}
      {coreSelected && <CoreIdentity revealed={coreRevealed} />}
      {identitySelected && <IdentityContent revealed={state.mode === 'body_focused'} onReturn={goBack} />}
      {skillsSelected && <SkillsContent revealed={state.mode === 'body_focused'} state={state} navigation={navigation} onReturn={goBack} />}
      {projectsSelected && <ProjectsContent revealed={state.mode === 'body_focused'} state={state} navigation={navigation} onReturn={goBack} />}
      <div className="GalaxyTarget">
        {selected && <button ref={backButton} className="GalaxyBack" type="button" onClick={goBack}>← System<span>Esc</span></button>}
        <div className="GalaxyTargetLabel" role="status" aria-live="polite" aria-atomic="true">
          {(selected || hovered || returning) && <>
            <p className="GalaxyEyebrow">{selected ? status : returning ? status : coreHovered ? CORE.signal : 'Signal detected'}</p>
            {!coreRevealed && <p>{skillSignal ? skillSignal.label : projectSignal ? projectSignal.label : coreHovered ? CORE.name : selected?.label || hovered?.label}</p>}
            {!selected && hovered?.id === SKILLS.id && <small>{SKILLS.hover}</small>}
            {identityHovered && <small>{IDENTITY.hover}</small>}
            {selected && !coreSelected && <small>{skillSignal ? `${SKILLS.label} / ${skillSignal.category}` : projectSignal ? `${PROJECTS.label} / ${projectSignal.category}` : selected.id === 'lab' ? 'Unknown signal · Content locked' : selected.id === 'black-hole' ? (portalActive ? 'Entering horizon · Esc to cancel' : portal ? 'Event horizon · Portal ready' : 'Event horizon · Portal inactive') : `Planet ${String(SYSTEM_MAP.indexOf(selected)).padStart(2, '0')}`}</small>}
          </>}
        </div>
      </div>
      {selected?.id === 'black-hole' && portal && state.mode === 'body_focused' && portalState.mode === 'idle' && (
          <button type="button" className="GalaxyPortalEnter"
            onClick={() => portal.begin(state.selectedBodyId, state.mode, { reduceMotion: reducedMotion || staticView })}>
            Enter the horizon <span aria-hidden="true">↗</span>
          </button>
      )}
    </div>
    <section className={`GalaxySystemMap${selected ? ' has-selection' : ''}`} aria-label="Solar system map">
      <div className="GalaxyMapHeading"><span>System map / 01</span><span>{status}</span></div>
      <ol>{SYSTEM_MAP.map((body, index) => <li key={body.id} style={{ '--body-color': body.color }}>
        <button ref={node => { if (node) buttons.current.set(body.id, node); else buttons.current.delete(body.id) }}
          type="button" disabled={portalActive || portalState.mode === 'committed'} aria-pressed={state.selectedBodyId === body.id} aria-label={body.label}
          onClick={() => navigation.focusBody(body.id)}
          onFocus={() => navigation.setHover(body.id, 'keyboard')} onBlur={() => navigation.setHover(null, 'keyboard')}>
          <span className="GalaxyMapIndex" aria-hidden="true">{state.selectedBodyId === body.id ? '●' : String(index).padStart(2, '0')}</span>
          <span><strong>{body.label}</strong><small>{body.id === CORE.id ? body.meaning : body.id === 'lab' ? 'Unknown signal' : body.id === 'black-hole' ? 'Event horizon' : `Planet ${String(index).padStart(2, '0')}`}</small></span>
        </button>
      </li>)}</ol>
    </section>
  </>
}
