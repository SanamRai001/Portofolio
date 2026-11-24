import { useEffect, useRef, useState } from 'react'
import stoneFallback from '../../../../prototypes/unfolding-cube-portal/assets/stone-cube-fallback.webp?url'

export default function CubeScene({ phase, theme, reducedMotion }) {
  const mountRef = useRef(null)
  const controllerRef = useRef(null)
  const latestStateRef = useRef({ phase, theme, reducedMotion })
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let disposed = false
    const mount = mountRef.current
    // The GLB renderer loads only for this preview route; failures keep the image fallback.
    import('./createCubeScene.js').then(({ createCubeScene: makeScene }) => {
      if (disposed || !mount) return
      controllerRef.current = makeScene(mount, {
        onReady: () => { if (!disposed) setReady(true) },
        onError: () => { if (!disposed) setReady(false) },
      })
      controllerRef.current.setState(latestStateRef.current)
    }).catch(() => { if (!disposed) setReady(false) })
    return () => {
      disposed = true
      controllerRef.current?.dispose()
      controllerRef.current = null
    }
  }, []) // renderer lifecycle is isolated from React layout state

  useEffect(() => {
    latestStateRef.current = { phase, theme, reducedMotion }
    controllerRef.current?.setState(latestStateRef.current)
  }, [phase, theme, reducedMotion])

  const diagnostic = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('cubeDebug')
  return (
    <>
    <div className="CubePortalModel" aria-hidden="true" data-model-revision="backing-clearance-v2" data-renderer={ready ? 'webgl' : 'fallback'}>
      <div ref={mountRef} className="CubePortalCanvas" />
      {!ready && (
        <div className="CubePortalFallback">
          <img className="CubeFallbackTop" src={stoneFallback} alt="" draggable="false" />
          <img className="CubeFallbackLeft" src={stoneFallback} alt="" draggable="false" />
          <img className="CubeFallbackRight" src={stoneFallback} alt="" draggable="false" />
        </div>
      )}
      <div className="CubePortalGroundShadow" />
    </div>
    {diagnostic && <output className="CubePortalDebug" aria-label="Cube preview diagnostic">
      Model: backing-clearance-v2 · Renderer: {ready ? 'WebGL GLB' : 'fallback/loading'}
    </output>}
    </>
  )
}
