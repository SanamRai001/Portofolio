import { useEffect, useRef, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

// The veil lives in document.body, outside the Galaxy stage's stacking
// context. A route handoff is permitted only AFTER it becomes fully opaque.
export default function GalaxyPortalOverlay({ portal }) {
  const state = useSyncExternalStore(portal.subscribe, portal.getSnapshot)
  const veilRef = useRef(null)
  const engaged = state.mode !== 'idle'
  const blackout = state.mode === 'blackout' || state.mode === 'committed'

  function confirmCovered(node, token) {
    if (!node || portal.getSnapshot().mode !== 'blackout') return
    const opacity = Number.parseFloat(window.getComputedStyle(node).opacity)
    if (opacity >= .999) portal.confirmBlackout(token, true)
  }

  // An opacity transitionend confirms coverage during ordinary motion.
  // The two-frame check also works for reduced motion, zero-duration CSS,
  // or when a browser omits transitionend for a newly inserted overlay.
  useEffect(() => {
    if (!blackout || state.mode !== 'blackout') return undefined
    let secondFrame = null
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        confirmCovered(veilRef.current, state.transitionId)
      })
    })
    return () => {
      window.cancelAnimationFrame(firstFrame)
      if (secondFrame !== null) window.cancelAnimationFrame(secondFrame)
    }
  }, [blackout, state.mode, state.transitionId, portal])

  return createPortal(
    <div
      ref={veilRef}
      className={`GalaxyPortalVeil${engaged ? ' is-engaged' : ''} is-${state.mode}`}
      data-portal-phase={state.mode}
      aria-hidden="true"
      onTransitionEnd={event => {
        if (event.target === veilRef.current && event.propertyName === 'opacity') {
          confirmCovered(event.target, state.transitionId)
        }
      }}
    />,
    document.body,
  )
}
