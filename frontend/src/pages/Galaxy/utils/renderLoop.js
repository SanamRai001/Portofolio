// Own exactly one scheduled frame. A paused scene only renders on invalidation.
export function createRenderLoop({ render, requestFrame, cancelFrame, fps = 60, onError }) {
  let frame = null
  let disposed = false
  let active = false
  let continuous = false
  let lastTime = null

  function schedule() {
    if (!disposed && active && frame === null) frame = requestFrame(tick)
  }

  function tick(time) {
    frame = null
    if (disposed || !active) return
    if (lastTime === null || time - lastTime >= 1000 / fps - 1) {
      const delta = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, 0.05)
      lastTime = time
      try {
        render(delta)
      } catch (error) {
        disposed = true
        onError?.(error)
        return
      }
    }
    if (continuous) schedule()
  }

  return {
    setState(next) {
      if (disposed) return
      active = next.active
      continuous = next.continuous
      if (frame !== null) cancelFrame(frame)
      frame = null
      lastTime = null
      schedule()
    },
    invalidate() { lastTime = null; schedule() },
    dispose() {
      disposed = true
      if (frame !== null) cancelFrame(frame)
      frame = null
    },
  }
}
