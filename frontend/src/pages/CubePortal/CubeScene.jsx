import { useEffect, useId, useRef } from 'react'
import artwork from '../../../../prototypes/unfolding-cube-portal/source/reference-cube.png?url'

import { CUBE_FRAGMENTS } from './cubeFragments.js'

const MODEL_REVISION = 'original-artwork-fracture-v3'
const MAX_TILT = 7

// One artwork, one coordinate system. The idle cube uses the unmodified source.
// Only during a transition do independently clipped stone regions separate.
export default function CubeScene({ phase, highlighted, reducedMotion, onJourneyReady }) {
  const id = useId()
  const modelRef = useRef(null)
  const tiltRef = useRef(null)

  useEffect(() => {
    if (!onJourneyReady) return
    let cancelled = false
    const image = new Image()
    image.src = artwork
    const done = () => { if (!cancelled) onJourneyReady('cube') }
    if (typeof image.decode === 'function') image.decode().then(done, done)
    else if (image.complete) done()
    else { image.onload = done; image.onerror = done }
    return () => { cancelled = true; image.onload = null; image.onerror = null }
  }, [onJourneyReady])

  useEffect(() => {
    const model = modelRef.current
    const tilt = tiltRef.current
    if (!model || !tilt) return
    const reset = () => {
      tilt.style.removeProperty('--cube-tilt-x')
      tilt.style.removeProperty('--cube-tilt-y')
    }
    reset()
    if (phase !== 'home' || reducedMotion) return
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    let frame = 0
    let x = 0, y = 0
    const cancel = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      reset()
    }
    const move = event => {
      if (!finePointer.matches || event.pointerType !== 'mouse') return
      const rect = model.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const nx = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1))
      const ny = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1))
      x = -ny * MAX_TILT
      y = nx * MAX_TILT
      if (!frame) frame = requestAnimationFrame(() => {
        frame = 0
        tilt.style.setProperty('--cube-tilt-x', x.toFixed(3) + 'deg')
        tilt.style.setProperty('--cube-tilt-y', y.toFixed(3) + 'deg')
      })
    }
    model.addEventListener('pointermove', move)
    model.addEventListener('pointerleave', cancel)
    model.addEventListener('pointercancel', cancel)
    window.addEventListener('blur', cancel)
    finePointer.addEventListener('change', cancel)
    return () => {
      cancel()
      model.removeEventListener('pointermove', move)
      model.removeEventListener('pointerleave', cancel)
      model.removeEventListener('pointercancel', cancel)
      window.removeEventListener('blur', cancel)
      finePointer.removeEventListener('change', cancel)
    }
  }, [phase, reducedMotion])
  const open = phase === 'opening' || phase === 'work'
  const split = phase !== 'home'
  const diagnostic = new URLSearchParams(window.location.search).has('cubeDebug')

  return (
    <>
      <div ref={modelRef} className="CubePortalModel" aria-hidden="true" data-model-revision={MODEL_REVISION}
        data-renderer="layered-artwork" data-fractured={open} data-split={split} data-highlighted={highlighted}>
        <div className="CubeArtworkTilt" ref={tiltRef}>
        <svg className="CubeArtwork" viewBox="0 0 1254 1254" aria-hidden="true">
          <defs>
            {CUBE_FRAGMENTS.map(piece => <clipPath key={piece.id} id={id + '-' + piece.id} clipPathUnits="userSpaceOnUse"><path d={piece.d}/></clipPath>)}
            <radialGradient id={id + '-glow'}>
              <stop offset="0" stopColor="#fff2cc" stopOpacity=".72" />
              <stop offset=".32" stopColor="#ffc66d" stopOpacity=".31" />
              <stop offset="1" stopColor="#ffc66d" stopOpacity="0" />
            </radialGradient>
          </defs>
          <image className="CubeArtworkBody" href={artwork} width="1254" height="1254" />
          <g className="CubeFractureLight">
            <circle cx="627" cy="637" r="340" fill={'url(#' + id + '-glow)'} />
          </g>
          <g className="CubeFragments">
            {CUBE_FRAGMENTS.map(piece => (
              <g key={piece.id} className="CubeFragment" data-fragment={piece.id}
                style={{'--fragment-x':piece.dx+'px','--fragment-y':piece.dy+'px','--fragment-angle':piece.angle+'deg'}}>
                <image href={artwork} width="1254" height="1254" clipPath={'url(#'+id+'-'+piece.id+')'} />
              </g>
            ))}
          </g>
          <g className="CubeFractureSeams" fill="none" stroke="#ffe0a7" strokeWidth="3" strokeLinecap="round">
            <path d="M153 356 L335 465 627 637 880 490 1090 354 M335 465 L510 240 478 160 M880 490 L760 260 804 170 M627 637 L660 815 627 960 640 1140 M205 739 L260 720 420 850 660 815 840 820 1015 760 1068 747"/>
          </g>
          <circle className="CubeArtworkGlow" cx="627" cy="637" r="126" fill={'url(#' + id + '-glow)'} />
        </svg>
        </div>
        <div className="CubePortalGroundShadow" />
      </div>
      {diagnostic && <output className="CubePortalDebug" aria-label="Cube preview diagnostic">
        Model: {MODEL_REVISION} · Renderer: layered artwork
      </output>}
    </>
  )
}
