import { useId } from 'react'
import artwork from '../../../../prototypes/unfolding-cube-portal/source/reference-cube.png?url'

const MODEL_REVISION = 'original-artwork-v1'

// One artwork, one coordinate system. The idle cube uses the unmodified source.
// Only during a transition do two clipped views of that same image separate.
export default function CubeScene({ phase, highlighted }) {
  const id = useId()
  const open = phase === 'opening' || phase === 'work'
  const split = phase !== 'home'
  const diagnostic = new URLSearchParams(window.location.search).has('cubeDebug')

  return (
    <>
      <div className="CubePortalModel" aria-hidden="true" data-model-revision={MODEL_REVISION}
        data-renderer="layered-artwork" data-lid-open={open} data-split={split} data-highlighted={highlighted}>
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
        <div className="CubePortalGroundShadow" />
      </div>
      {diagnostic && <output className="CubePortalDebug" aria-label="Cube preview diagnostic">
        Model: {MODEL_REVISION} · Renderer: layered artwork
      </output>}
    </>
  )
}
