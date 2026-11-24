import { useEffect, useRef, useState } from 'react'
import stoneFallback from '../../../../prototypes/unfolding-cube-portal/assets/stone-cube-canonical-fallback.webp?url'

const MODEL_REVISION = 'canonical-stone-v1'

export default function CubeScene({ phase, theme, reducedMotion, highlighted }) {
  const mountRef = useRef(null)
  const controllerRef = useRef(null)
  const latestStateRef = useRef({ phase, theme, reducedMotion, highlighted })
  const [renderer, setRenderer] = useState('loading')
  const [stoneOnly] = useState(() => new URLSearchParams(window.location.search).get('cubeMode') === 'stone-only')
  const diagnostic = new URLSearchParams(window.location.search).has('cubeDebug')

  useEffect(() => {
    let disposed = false
    const mount = mountRef.current
    import('./createCubeScene.js').then(({ createCubeScene: makeScene }) => {
      if (disposed || !mount) return
      controllerRef.current = makeScene(mount, {
        mode: stoneOnly ? 'stone-only' : 'full',
        onReady: () => { if (!disposed) setRenderer('webgl') },
        onError: () => { if (!disposed) setRenderer('fallback') },
      })
      controllerRef.current.setState(latestStateRef.current)
    }).catch(() => { if (!disposed) setRenderer('fallback') })
    return () => {
      disposed = true
      controllerRef.current?.dispose()
      controllerRef.current = null
    }
  }, [stoneOnly])

  useEffect(() => {
    latestStateRef.current = { phase, theme, reducedMotion, highlighted }
    controllerRef.current?.setState(latestStateRef.current)
  }, [phase, theme, reducedMotion, highlighted])

  return (
    <>
      <div className="CubePortalModel" aria-hidden="true" data-model-revision={MODEL_REVISION} data-cube-mode={stoneOnly ? 'stone-only' : 'full'} data-renderer={renderer}>
        <div ref={mountRef} className="CubePortalCanvas" />
        {renderer === 'fallback' && (
          <img className="CubePortalFallback" src={stoneFallback} alt="" draggable="false" />
        )}
        <div className="CubePortalGroundShadow" />
      </div>
      {diagnostic && <output className="CubePortalDebug" aria-label="Cube preview diagnostic">
        Model: {MODEL_REVISION} · Renderer: {renderer === 'webgl' ? 'WebGL GLB' : renderer} · Mode: {stoneOnly ? 'stone-only' : 'full'}
      </output>}
    </>
  )
}
