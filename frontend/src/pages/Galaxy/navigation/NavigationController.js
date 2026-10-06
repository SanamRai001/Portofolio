import { SKILLS, skillById } from '../data/skills.js'
import { PROJECTS, projectById } from '../data/projects.js'
import { JOURNEY, journeyById } from '../data/journey.js'
import { LAB_CONTENT, labExperimentById } from '../data/lab.js'
import { SYSTEM_MAP } from '../data/solarSystem.js'

export const isTravelling = state => state.mode === 'focusing_body' || state.mode === 'returning_overview'
// Do not halt a planet's revolution when focused: the camera already tracks its
// moving focus anchor. Slowing to 65% retains stable framing and visible motion;
// hovering uses 82%, while unselected bodies move at their authored base rate.
// Reduced-motion and Pause remain authoritative in the scene's single clock.
export const orbitRateTarget = (id, state) => state.selectedBodyId === id ? 0.65 : state.hoveredBodyId === id ? 0.82 : 1

// Semantic state only. Camera/orbit clocks stay in the scene's single frame loop.
export function createNavigationController() {
  const ids = new Set(SYSTEM_MAP.map(body => body.id)), listeners = new Set()
  let state = Object.freeze({ mode: 'overview', selectedBodyId: null, previousBodyId: null, hoveredBodyId: null, transitionId: 0, selectedSkillId: null, hoveredSkillId: null, selectedProjectId: null, hoveredProjectId: null, selectedJourneyId: null, hoveredJourneyId: null, selectedLabId: null, hoveredLabId: null })
  const hover = { pointer: null, keyboard: null }
  const skillHover = { pointer: null, keyboard: null }
  const projectHover = { pointer: null, keyboard: null }
  const journeyHover = { pointer: null, keyboard: null }
  const labHover = { pointer: null, keyboard: null }
  function clearLocalSelections() {
    skillHover.pointer = skillHover.keyboard = null
    projectHover.pointer = projectHover.keyboard = null
    journeyHover.pointer = journeyHover.keyboard = null
    labHover.pointer = labHover.keyboard = null
    return { selectedSkillId: null, hoveredSkillId: null, selectedProjectId: null, hoveredProjectId: null, selectedJourneyId: null, hoveredJourneyId: null, selectedLabId: null, hoveredLabId: null }
  }
  function publish(change) {
    if (Object.entries(change).every(([key, value]) => state[key] === value)) return
    state = Object.freeze({ ...state, ...change })
    listeners.forEach(listener => listener())
  }
  function goBack() {
    if (!state.selectedBodyId) return
    hover.pointer = hover.keyboard = null
    publish({ ...clearLocalSelections(), mode: 'returning_overview', previousBodyId: state.selectedBodyId, selectedBodyId: null, hoveredBodyId: null, transitionId: state.transitionId + 1 })
  }
  return {
    getSnapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    focusBody(id) {
      if (!ids.has(id) || state.selectedBodyId === id) return
      publish({ ...clearLocalSelections(), mode: 'focusing_body', previousBodyId: state.selectedBodyId, selectedBodyId: id, transitionId: state.transitionId + 1 })
    },
    goBack, returnToOverview: goBack,
    selectSkill(id) {
      if (state.selectedBodyId !== SKILLS.id || state.mode !== 'body_focused' || !skillById(id)) return
      publish({ selectedSkillId: id })
    },
    selectProject(id) {
      if (state.selectedBodyId !== PROJECTS.id || state.mode !== 'body_focused' || !projectById(id)) return
      publish({ selectedProjectId: id })
    },
    selectJourney(id) {
      if (state.selectedBodyId !== JOURNEY.id || state.mode !== 'body_focused' || !journeyById(id)) return
      publish({ selectedJourneyId: id })
    },
    selectLab(id) {
      if (state.selectedBodyId !== LAB_CONTENT.id || state.mode !== 'body_focused' || !labExperimentById(id)) return
      publish({ selectedLabId: id })
    },
    setSkillHover(id, source = 'pointer') {
      if (!(source in skillHover) || state.selectedBodyId !== SKILLS.id || state.mode !== 'body_focused' || (id !== null && !skillById(id))) return
      skillHover[source] = id
      publish({ hoveredSkillId: skillHover.pointer || skillHover.keyboard })
    },
    setProjectHover(id, source = 'pointer') {
      if (!(source in projectHover) || state.selectedBodyId !== PROJECTS.id || state.mode !== 'body_focused' || (id !== null && !projectById(id))) return
      projectHover[source] = id
      publish({ hoveredProjectId: projectHover.pointer || projectHover.keyboard })
    },
    setJourneyHover(id, source = 'pointer') {
      if (!(source in journeyHover) || state.selectedBodyId !== JOURNEY.id || state.mode !== 'body_focused' || (id !== null && !journeyById(id))) return
      journeyHover[source] = id
      publish({ hoveredJourneyId: journeyHover.pointer || journeyHover.keyboard })
    },
    setLabHover(id, source = 'pointer') {
      if (!(source in labHover) || state.selectedBodyId !== LAB_CONTENT.id || state.mode !== 'body_focused' || (id !== null && !labExperimentById(id))) return
      labHover[source] = id
      publish({ hoveredLabId: labHover.pointer || labHover.keyboard })
    },
    complete(transitionId) {
      if (transitionId !== state.transitionId || !isTravelling(state)) return
      publish({ mode: state.selectedBodyId ? 'body_focused' : 'overview' })
    },
    setHover(id, source = 'pointer') {
      if (!(source in hover) || (id !== null && !ids.has(id))) return
      hover[source] = id
      publish({ hoveredBodyId: hover.pointer || hover.keyboard })
    },
  }
}
