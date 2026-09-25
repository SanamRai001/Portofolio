import { SYSTEM_MAP } from '../data/solarSystem.js'

export const isTravelling = state => state.mode === 'focusing_body' || state.mode === 'returning_overview'
export const orbitRateTarget = (id, state) => state.selectedBodyId === id ? 0 : state.hoveredBodyId === id ? 0.45 : 1

// Semantic state only. Camera/orbit clocks stay in the scene's single frame loop.
export function createNavigationController() {
  const ids = new Set(SYSTEM_MAP.map(body => body.id)), listeners = new Set()
  let state = Object.freeze({ mode: 'overview', selectedBodyId: null, previousBodyId: null, hoveredBodyId: null, transitionId: 0 })
  const hover = { pointer: null, keyboard: null }
  function publish(change) {
    if (Object.entries(change).every(([key, value]) => state[key] === value)) return
    state = Object.freeze({ ...state, ...change })
    listeners.forEach(listener => listener())
  }
  function goBack() {
    if (!state.selectedBodyId) return
    hover.pointer = hover.keyboard = null
    publish({ mode: 'returning_overview', previousBodyId: state.selectedBodyId, selectedBodyId: null, hoveredBodyId: null, transitionId: state.transitionId + 1 })
  }
  return {
    getSnapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    focusBody(id) {
      if (!ids.has(id) || state.selectedBodyId === id) return
      publish({ mode: 'focusing_body', previousBodyId: state.selectedBodyId, selectedBodyId: id, transitionId: state.transitionId + 1 })
    },
    goBack, returnToOverview: goBack,
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
