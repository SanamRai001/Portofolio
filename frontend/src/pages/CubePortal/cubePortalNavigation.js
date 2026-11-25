/** The preview keeps its own fragment history; it never changes the public homepage. */
export const CUBE_PREVIEW_PATH = '/cube-preview'
export const CUBE_VIEWS = Object.freeze(['home', 'work'])

export function readCubeView(hash = '') {
  return hash === '#work' ? 'work' : 'home'
}

export function cubeUrl(view) {
  return `${CUBE_PREVIEW_PATH}#${view === 'work' ? 'work' : 'home'}`
}

export function portalDuration(view, reducedMotion) {
  if (reducedMotion) return 0
  return view === 'work' ? 700 : 980
}
