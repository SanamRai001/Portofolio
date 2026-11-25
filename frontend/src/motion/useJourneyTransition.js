import { useCallback, useEffect, useRef, useState } from 'react'
import useReducedMotion from './useReducedMotion.js'

export const COVER_MS = 660
export const REVEAL_MS = 480
export const READY_LIMIT_MS = 3000

export function routeFamily(path) {
  const clean = path.replace(/\/+$/, '') || '/'
  if (clean === '/' || clean === '/cube-preview') return 'cube'
  if (clean === '/galaxy' || clean.startsWith('/galaxy/')) return 'space'
  return 'portfolio'
}

export function canAnimateLink(event) {
  return !event.defaultPrevented && event.button === 0 && !event.metaKey &&
    !event.ctrlKey && !event.shiftKey && !event.altKey &&
    (!event.currentTarget.target || event.currentTarget.target === '_self') &&
    !event.currentTarget.hasAttribute('download')
}

export function journeyOrigin(rect, width, height) {
  const x = Math.max(0, Math.min(width, rect ? rect.left + rect.width * .5 : width * .5))
  const y = Math.max(0, Math.min(height, rect ? rect.top + rect.height * .5 : height * .5))
  return { x, y, radius: Math.ceil(Math.hypot(Math.max(x,width-x), Math.max(y,height-y))) + 32 }
}

const originFor = element => journeyOrigin(element?.getBoundingClientRect(), window.innerWidth, window.innerHeight)
const readLocation = () => typeof window === 'undefined'
  ? { path: '/', fromCube: false }
  : { path: window.location.pathname, fromCube: window.history.state?.__cubeJourney === true }

// Only the cube/space handoff is client-side. Existing Galaxy world history
// and all unrelated native anchors retain their existing navigation contracts.
export function useJourneyTransition() {
  const reduced = useReducedMotion()
  const [location, setLocation] = useState(readLocation)
  const [motion, setMotion] = useState(null)
  const active = useRef(null)
  const timer = useRef(null)
  const clearTimer = useCallback(() => { clearTimeout(timer.current); timer.current = null }, [])
  const later = useCallback((fn, ms) => { clearTimer(); timer.current = setTimeout(fn, ms) }, [clearTimer])
  const cancel = useCallback((restoreFocus = false) => {
    const job = active.current
    clearTimer()
    active.current = null
    setMotion(null)
    if (restoreFocus && job?.phase === 'depart') requestAnimationFrame(() => job.trigger?.focus())
  }, [clearTimer])

  const ready = useCallback(family => {
    const job = active.current
    if (!job || job.phase !== 'covered' || job.target !== family) return
    job.phase = 'reveal'
    const origin = originFor(family === 'cube' ? document.querySelector('.CubePortalModel') : null)
    setMotion({ phase: 'reveal', target: family, origin })
    later(() => {
      if (active.current !== job) return
      cancel()
      requestAnimationFrame(() => {
        if (!active.current) document.getElementById(family === 'space' ? 'galaxy-title' : 'cube-title')?.focus({ preventScroll: true })
      })
    }, REVEAL_MS)
  }, [cancel, later])

  const navigate = useCallback((event, destination, element) => {
    const source = routeFamily(window.location.pathname)
    const target = routeFamily(destination)
    if (!canAnimateLink(event) || !((source === 'cube' && destination === '/galaxy') ||
        (source === 'space' && target === 'cube'))) return
    event.preventDefault()
    if (active.current) return
    const job = { phase: 'depart', target, trigger: event.currentTarget }
    const commit = () => {
      if (active.current !== job) return
      try {
        window.history.pushState({ __cubeJourney: target === 'space' }, '', destination)
      } catch {
        cancel()
        window.location.assign(destination)
        return
      }
      job.phase = 'covered'
      setLocation(readLocation())
      window.scrollTo(0,0)
      if (reduced) { cancel(); return }
      setMotion(previous => ({ ...previous, phase: 'covered' }))
      // Slow renderers and route errors must never leave an opaque screen indefinitely.
      later(() => ready(target), READY_LIMIT_MS)
    }
    active.current = job
    if (reduced) { commit(); return }
    setMotion({ phase: 'depart', target, origin: originFor(element) })
    later(commit, COVER_MS)
  }, [cancel, later, ready, reduced])

  useEffect(() => {
    const onPop = () => {
      cancel()
      setLocation(readLocation())
    }
    const onKey = event => {
      if (event.key !== 'Escape' || !active.current) return
      if (active.current.phase === 'depart') {
        event.preventDefault()
        cancel(true)
      } else if (active.current.phase === 'covered') ready(active.current.target)
    }
    const onPageShow = event => { if (event.persisted) onPop() }
    window.addEventListener('popstate', onPop)
    window.addEventListener('keydown', onKey)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      clearTimer()
      active.current = null
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [cancel, clearTimer, ready])

  return { location, motion, navigate, ready }
}
