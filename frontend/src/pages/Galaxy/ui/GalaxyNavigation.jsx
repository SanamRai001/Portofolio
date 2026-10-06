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

export default function GalaxyNavigation({ navigation, portal, staticView, reducedMotion = false, onInteract = () => {}, children }) {
  const state = useSyncExternalStore(navigation.subscribe, navigation.getSnapshot)
  const portalState = useSyncExternalStore(
    portal?.subscribe || subscribeEmptyPortal,
    portal?.getSnapshot || emptyPortalSnapshot,
  )
  const portalActive = portalState.mode !== 'idle' && portalState.mode !== 'committed'
  const stageRef = useRef(null)
  const backButton = useRef(null)
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
    const restore = document.activeElement === backButton.current
      || Boolean(document.activeElement?.closest('.CoreIdentity, .IdentityContent, .SkillsContent, .ProjectsContent'))

    if (portalActive) portal?.cancel()
    navigation.goBack()
    if (restore) stageRef.current?.focus()
  }

  function keyboardTarget(delta = 0, absolute = null) {
    const currentId = state.hoveredBodyId || state.selectedBodyId || CORE.id
    const current = Math.max(0, SYSTEM_MAP.findIndex(body => body.id === currentId))
    const index = absolute ?? ((current + delta + SYSTEM_MAP.length) % SYSTEM_MAP.length)
    const body = SYSTEM_MAP[index]
    navigation.setHover(body.id, 'keyboard')
    return body.id
  }

  function onStageKeyDown(event) {
    if (event.target !== event.currentTarget || portalActive || portalState.mode === 'committed') return

    let target = null
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') target = keyboardTarget(1)
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') target = keyboardTarget(-1)
    else if (event.key === 'Home') target = keyboardTarget(0, 0)
    else if (event.key === 'End') target = keyboardTarget(0, SYSTEM_MAP.length - 1)
    else if (event.key === 'Enter' || event.key === ' ') {
      target = state.hoveredBodyId || state.selectedBodyId || CORE.id
      navigation.focusBody(target)
    } else return

    onInteract()
    event.preventDefault()
  }

  useEffect(() => {
    function escape(event) {
      if (
        event.key !== 'Escape'
        || !navigation.getSnapshot().selectedBodyId
        || portal?.getSnapshot().mode === 'committed'
      ) return

      const restore = document.activeElement === backButton.current
        || Boolean(document.activeElement?.closest('.CoreIdentity, .IdentityContent, .SkillsContent, .ProjectsContent'))

      if (portal && portal.getSnapshot().mode !== 'idle') portal.cancel()
      navigation.goBack()
      if (restore) stageRef.current?.focus()
    }

    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [navigation, portal])

  useEffect(() => {
    if (staticView) navigation.complete(state.transitionId)
  }, [navigation, staticView, state.transitionId])

  // Black Hole is itself the portal interaction. Arrival immediately starts the
  // existing cinematic horizon sequence; there is no redundant confirmation CTA.
  useEffect(() => {
    if (
      !portal
      || state.selectedBodyId !== 'black-hole'
      || state.mode !== 'body_focused'
      || portalState.mode !== 'idle'
    ) return

    portal.begin(state.selectedBodyId, state.mode, {
      reduceMotion: reducedMotion || staticView,
    })
  }, [
    portal,
    portalState.mode,
    reducedMotion,
    state.mode,
    state.selectedBodyId,
    staticView,
  ])

  const status = selected
    ? state.mode === 'focusing_body'
      ? 'Navigating'
      : staticView
        ? 'Static selection'
        : 'Signal locked'
    : returning
      ? 'Returning to system'
      : 'Overview'

  return <div
    ref={stageRef}
    className={`GalaxyStage${coreSelected || identitySelected || skillsSelected || projectsSelected ? ' has-body-content' : ''}${coreSelected ? ' is-core' : identitySelected ? ' is-identity' : skillsSelected ? ' is-skills' : projectsSelected ? ' is-projects' : ''}`}
    tabIndex={0}
    aria-label="Interactive solar system. Use arrow keys to choose a world and Enter to explore."
    aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Home End Enter Escape"
    onKeyDown={onStageKeyDown}
    onPointerDownCapture={onInteract}
    onFocus={event => {
      if (event.target === event.currentTarget && !state.selectedBodyId && !state.hoveredBodyId) {
        navigation.setHover(CORE.id, 'keyboard')
      }
    }}
    onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) navigation.setHover(null, 'keyboard')
    }}
  >
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
          {selected && !coreSelected && <small>{
            skillSignal
              ? `${SKILLS.label} / ${skillSignal.category}`
              : projectSignal
                ? `${PROJECTS.label} / ${projectSignal.category}`
                : selected.id === 'lab'
                  ? 'Unknown signal · Content locked'
                  : selected.id === 'black-hole'
                    ? portalActive
                      ? 'Entering horizon · Esc to cancel'
                      : portal
                        ? 'Event horizon'
                        : 'Event horizon · Portal inactive'
                    : `Planet ${String(SYSTEM_MAP.indexOf(selected)).padStart(2, '0')}`
          }</small>}
        </>}
      </div>
    </div>
  </div>
}
