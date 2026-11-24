import { useEffect, useId, useRef } from 'react'
import artwork from '../../../../prototypes/unfolding-cube-portal/source/reference-cube.png?url'

const MODEL_REVISION = 'original-artwork-tilt-v2'
const MAX_TILT = 7

// One artwork, one coordinate system. The idle cube uses the unmodified source.
// Only during a transition do two clipped views of that same image separate.
export default function CubeScene({ phase, highlighted, reducedMotion }) {
  const id = useId()
  const modelRef = useRef(null)
  const tiltRef = useRef(null)

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
        data-renderer="layered-artwork" data-lid-open={open} data-split={split} data-highlighted={highlighted}>
        <div className="CubeArtworkTilt" ref={tiltRef}>
        <svg className="CubeArtwork" viewBox="0 0 1254 1254" aria-hidden="true">
          <defs>
            <clipPath id={id + '-lid'} clipPathUnits="userSpaceOnUse">
              <path d="M0 0H1254V253L1090 354 627 638 153 357 0 268Z" />
            </clipPath>
            <clipPath id={id + '-body'} clipPathUnits="userSpaceOnUse">
              <path d="M0 268L153 356 627 637 1090 353 1254 253V1254H0Z" />
            </clipPath>
            <linearGradient id={id + '-interior'} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3d3530" />
              <stop offset=".53" stopColor="#17191b" />
              <stop offset="1" stopColor="#090c0f" />
            </linearGradient>
            <radialGradient id={id + '-glow'}>
              <stop offset="0" stopColor="#fff2cc" stopOpacity=".72" />
              <stop offset=".32" stopColor="#ffc66d" stopOpacity=".31" />
              <stop offset="1" stopColor="#ffc66d" stopOpacity="0" />
            </radialGradient>
          </defs>
          <image className="CubeArtworkBody" href={artwork} width="1254" height="1254"
            clipPath={split ? 'url(#' + id + '-body)' : undefined} />
          <g className="CubeArtworkInterior">
            <path d="M153 356 635 83 1090 354 627 637Z" fill={'url(#' + id + '-interior)'} />
            <path d="M153 356 627 637 1090 354" fill="none" stroke="#d29a58" strokeWidth="3" />
          </g>
          <g className="CubeArtworkLid">
            <image href={artwork} width="1254" height="1254" clipPath={'url(#' + id + '-lid)'} />
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
