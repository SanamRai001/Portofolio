/** The preview keeps its own fragment history; it never changes the public homepage. */
export const CUBE_PREVIEW_PATH = '/cube-preview'
export const CUBE_VIEWS = Object.freeze(['home', 'work'])

export function readCubeView(hash = '') {
  return hash === '#work' ? 'work' : 'home'
}

export function cubeUrl(view) {
  return `${CUBE_PREVIEW_PATH}#${view === 'work' ? 'work' : 'home'}`
}

// One clock for stone motion and the radial chapter handoff.
export const WORK_MOTION=Object.freeze({open:1320,close:1120,revealAt:730,collapseBy:440})
export function portalDuration(view, reducedMotion) {
  if (reducedMotion) return 0
  return view === 'work' ? WORK_MOTION.open : WORK_MOTION.close
}
