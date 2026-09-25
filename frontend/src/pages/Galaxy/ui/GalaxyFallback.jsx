import { useEffect, useId, useRef, useState } from 'react'
import { SUN, PLANETS, LAB } from '../data/solarSystem.js'
import { orbitPosition } from '../utils/orbits.js'
import { getOverview, projectOverview } from '../utils/overview.js'
import { seededRandom } from '../utils/random.js'
const random = seededRandom(2709)
const stars = Array.from({ length: 180 }, () => ({ x: random() * 1440, y: random() * 900, radius: 0.4 + random() * 0.9, opacity: 0.15 + random() * 0.6 }))
export function SolarDiagram({ width, height, prefix, selectedBodyId = null }) {
  const view = getOverview(width, height)
  function project(point) {
    const p = projectOverview(point, view)
    return { x: (p.x + 1) * width / 2, y: (p.y + 1) * height / 2, depth: p.depth }
  }
  function path(orbit) {
    return Array.from({ length: 129 }, (_, i) => {
      const p = project(orbitPosition(orbit, i / 128 * Math.PI * 2))
      return `${i ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`
    }).join(' ') + 'Z'
  }
  const bodies = [SUN, ...PLANETS, LAB].map(body => {
    const p = project(body.orbit ? orbitPosition(body.orbit) : body.position || [0, 0, 0])
    return { ...body, ...p, r: body.radius * (body.orbit ? view.bodyScale : 1) * height / (2 * view.tanY * p.depth) }
  }).sort((a, b) => b.depth - a.depth)
  return <svg className="GalaxySolarDiagram" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Solar system: Sanam at the center, Identity, Skills, Projects and Journey on four orbits, and a distant Lab signal">
    <defs>
      {bodies.map(body => {
        const dx = width / 2 - body.x, dy = height / 2 - body.y, length = Math.hypot(dx, dy) || 1
        return <radialGradient id={`${prefix}-${body.id}`} key={body.id} cx={`${50 + dx / length * 30}%`} cy={`${50 + dy / length * 30}%`} r="78%">
          <stop offset="0" stopColor={body.id === 'core' ? '#fff0cd' : body.color} />
          <stop offset={body.id === 'core' ? '.72' : '.38'} stopColor={body.id === 'core' ? '#efb968' : body.color} />
          <stop offset="1" stopColor={body.id === 'core' ? '#bb652d' : '#070a11'} />
        </radialGradient>
      })}
      <radialGradient id={`${prefix}-corona`}><stop offset=".6" stopColor="#ffc36f" stopOpacity=".15" /><stop offset="1" stopColor="#ffc36f" stopOpacity="0" /></radialGradient>
    </defs>
    <g fill="none" stroke="#68717d" strokeWidth=".7" opacity=".4">{PLANETS.map(body => <path key={body.id} d={path(body.orbit)} />)}</g>
    {bodies.map(body => <g key={body.id} data-body={body.id} opacity={selectedBodyId && selectedBodyId !== body.id ? .7 : 1}>
      {selectedBodyId === body.id && <circle cx={body.x} cy={body.y} r={body.r * (body.ring ? 2.4 : 1.85)} fill="none" stroke={body.color} strokeWidth=".8" strokeDasharray="2 5" opacity=".65" />}
      {body.id === 'core' && <circle cx={body.x} cy={body.y} r={body.r * 1.6} fill={`url(#${prefix}-corona)`} />}
      {body.ring && <ellipse cx={body.x} cy={body.y} rx={body.r * 2.15} ry={body.r * .62} transform={`rotate(-24 ${body.x} ${body.y})`} fill="none" stroke={body.color} strokeWidth={body.r * .25} opacity=".4" />}
      <circle cx={body.x} cy={body.y} r={body.r} fill={body.id === 'lab' ? '#06050a' : `url(#${prefix}-${body.id})`} stroke={body.color} strokeWidth={body.id === 'identity' ? 1.4 : .4} strokeOpacity=".35" />
      {body.id === 'identity' && <path d={`M${body.x - body.r * .4},${body.y - body.r * .7} q${body.r},${body.r * .2} 0,${body.r} q${-body.r * .5},${body.r * .2} 0,${body.r * .4}`} fill="none" stroke="#263e40" strokeWidth={body.r * .25} opacity=".5" />}
      {body.id === 'skills' && <g fill="none" stroke="#d7e7e8" opacity=".28" strokeWidth=".7"><ellipse cx={body.x} cy={body.y} rx={body.r * .9} ry={body.r * .3} /><ellipse cx={body.x} cy={body.y} rx={body.r * .35} ry={body.r * .95} /></g>}
      {body.id === 'projects' && <g fill="#2d2828" opacity=".5"><circle cx={body.x - body.r * .25} cy={body.y + body.r * .25} r={body.r * .23} /><circle cx={body.x + body.r * .3} cy={body.y - body.r * .3} r={body.r * .15} /></g>}
      {body.id === 'lab' && <ellipse cx={body.x} cy={body.y} rx={body.r * 1.6} ry={body.r * .65} transform={`rotate(-28 ${body.x} ${body.y})`} fill="none" stroke={body.color} strokeWidth="1.2" opacity=".65" />}
    </g>)}
  </svg>
}
export default function GalaxyFallback({ selectedBodyId }) {
  const ref = useRef(null), prefix = useId().replaceAll(':', '')
  const [size, setSize] = useState({ width: 1000, height: 560 })
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) setSize({ width, height })
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return <div className="GalaxyFallback" ref={ref}>
    <svg className="GalaxyStaticSky" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {stars.map((star, index) => <circle key={index} cx={star.x} cy={star.y} r={star.radius} fill="#e5e8ef" opacity={star.opacity} />)}
    </svg>
    <SolarDiagram {...size} prefix={prefix} selectedBodyId={selectedBodyId} />
  </div>
}
