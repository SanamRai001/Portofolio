import { useEffect, useRef } from 'react'
import { readPerformanceProfile } from '../utils/performance.js'

export default function GalaxyScene({ paused, reducedMotion, onReady, onError, navigation }) {
  const mountRef = useRef(null)
  const runtimeRef = useRef(null)
  const pausedRef = useRef(paused)

  useEffect(() => {
    pausedRef.current = paused
    runtimeRef.current?.setPaused(paused)
  }, [paused])

  useEffect(() => {
    let cancelled = false
    const mount = mountRef.current
    // Three.js is behind this boundary, including renderer/context failures.
    import('./createGalaxyScene.js').then(({ createGalaxyScene }) => {
      if (cancelled) return
      runtimeRef.current = createGalaxyScene(mount, readPerformanceProfile(reducedMotion), {
        navigation,
        onReady: () => { if (!cancelled) onReady() },
        onError: () => { if (!cancelled) onError() },
      })
      runtimeRef.current.setPaused(pausedRef.current)
    }).catch(() => { if (!cancelled) onError() })

    return () => {
      cancelled = true
      runtimeRef.current?.dispose()
      runtimeRef.current = null
    }
  }, [reducedMotion, onReady, onError, navigation])

  return <div ref={mountRef} className="GalaxyScene" aria-hidden="true" />
}
