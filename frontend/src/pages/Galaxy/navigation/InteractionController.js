// No pointer capture or preventDefault: browser scrolling and edge gestures remain native.
export function attachPointerInteractions(mount, { pick, navigation, invalidate, onPoint = () => {} }) {
  const listeners = [], pointers = new Set()
  let press = null, cursor = null, disposed = false
  const previousCursor = mount.style.cursor
  function listen(type, handler) {
    mount.addEventListener(type, handler)
    listeners.push(() => mount.removeEventListener(type, handler))
  }
  function clearHover() {
    cursor = null
    navigation.setHover(null)
    mount.style.cursor = previousCursor
    onPoint(null)
  }
  function refreshHover() {
    if (!cursor || disposed) return
    const id = pick(cursor.x, cursor.y)
    navigation.setHover(id)
    mount.style.cursor = id ? 'pointer' : previousCursor
  }
  listen('pointermove', event => {
    if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 9) press = null
    if (event.pointerType === 'touch') return
    cursor = { x: event.clientX, y: event.clientY }
    onPoint(cursor)
    refreshHover()
    invalidate()
  })
  listen('pointerdown', event => {
    pointers.add(event.pointerId)
    if (pointers.size > 1 || event.isPrimary === false || event.button !== 0) { press = null; return }
    if (event.pointerType === 'touch') clearHover()
    press = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp, id: pick(event.clientX, event.clientY) }
  })
  listen('pointerup', event => {
    pointers.delete(event.pointerId)
    const start = press; press = null
    if (!start || start.pointerId !== event.pointerId || !start.id || event.timeStamp - start.time > 1000) return
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 9) return
    if (pick(event.clientX, event.clientY) === start.id) navigation.focusBody(start.id)
  })
  listen('pointercancel', event => { pointers.delete(event.pointerId); press = null; clearHover() })
  listen('pointerleave', () => { pointers.clear(); press = null; clearHover() })
  return {
    refreshHover,
    dispose() {
      if (disposed) return
      disposed = true
      listeners.forEach(remove => remove())
      pointers.clear(); press = null; clearHover()
    },
  }
}
