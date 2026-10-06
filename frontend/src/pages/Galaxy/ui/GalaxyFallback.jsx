import { useEffect, useId, useRef, useState } from 'react'
import { CORE, focusComposition } from '../data/core.js'
import { SKILLS, SKILL_NODES, SKILL_ORBITS, skillById } from '../data/skills.js'
import { IDENTITY, IDENTITY_APPEARANCE } from '../data/identity.js'
import { PROJECT_NODES, PROJECT_ORBITS, projectById } from '../data/projects.js'
import { SUN, PLANETS, LAB, BLACK_HOLE, SYSTEM_MAP } from '../data/solarSystem.js'
import { orbitPosition } from '../utils/orbits.js'
import { getOverview, projectOverview } from '../utils/overview.js'
import { seededRandom } from '../utils/random.js'
const random = seededRandom(2709)
const stars = Array.from({ length: 180 }, () => ({ x: random() * 1440, y: random() * 900, radius: 0.4 + random() * 0.9, opacity: 0.15 + random() * 0.6 }))
export function SolarDiagram({ width, height, prefix, selectedBodyId = null, viewportWidth = width, selectedSkillId = null, hoveredSkillId = null, selectedProjectId = null, hoveredProjectId = null, onSkillSelect, onSkillHover, onProjectSelect, onProjectHover }) {
  const view = getOverview(width, height)
  const focused = SYSTEM_MAP.find(body => body.id === selectedBodyId)
  const composition = focused?.id === BLACK_HOLE.id ? { x: 0, y: 0, heightFraction: .32 } : focused ? focusComposition(focused, viewportWidth) : null
  const anchor = composition ? projectOverview(focused.orbit ? orbitPosition(focused.orbit) : focused.position || [0, 0, 0], view) : { x: 0, y: 0 }
  const zoom = composition ? composition.heightFraction * view.tanY * anchor.depth / ((focused.focus.frameRadius || focused.radius) * (focused.orbit ? view.bodyScale : 1)) : 1
  const center = { x: (1 + (composition?.x || 0)) * width / 2, y: (1 - (composition?.y || 0)) * height / 2 }
  function project(point) {
    const p = projectOverview(point, view)
    return { x: center.x + (p.x - anchor.x) * width / 2 * zoom, y: center.y + (p.y - anchor.y) * height / 2 * zoom, depth: p.depth }
  }
  const skillsFocused = selectedBodyId === SKILLS.id
  const projectsFocused = selectedBodyId === 'projects'
  const skillsBody = PLANETS.find(body => body.id === SKILLS.id)
  const skillsPosition = orbitPosition(skillsBody.orbit)
  const nodePosition = orbit => orbitPosition(orbit).map((value, index) => value * view.bodyScale + skillsPosition[index])
  const projectsBody = PLANETS.find(body => body.id === 'projects')
  const projectsPosition = orbitPosition(projectsBody.orbit)
  const projectPosition = orbit => orbitPosition(orbit).map((value, index) => value * view.bodyScale + projectsPosition[index])
  function path(orbit, origin = null) {
    return Array.from({ length: 129 }, (_, i) => {
      const point = orbitPosition(orbit, i / 128 * Math.PI * 2)
      const p = project(origin ? point.map((value, axis) => value * view.bodyScale + origin[axis]) : point)
      return `${i ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`
    }).join(' ') + 'Z'
  }
  const satelliteBodies = skillsFocused ? SKILL_NODES.map(skill => ({ ...skill, id: `skill:${skill.id}`, skillId: skill.id, orbit: null, position: nodePosition(skill.orbit), radius: skill.radius * view.bodyScale })) : []
  const projectBodies = projectsFocused ? PROJECT_NODES.map(project => ({ ...project, id: `project:${project.id}`, projectId: project.id, orbit: null, position: projectPosition(project.orbit), radius: project.radius * view.bodyScale })) : []
  const bodies = [SUN, ...PLANETS, LAB, BLACK_HOLE, ...satelliteBodies, ...projectBodies].map(body => {
    const p = project(body.orbit ? orbitPosition(body.orbit) : body.position || [0, 0, 0])
    return { ...body, ...p, r: zoom * body.radius * (body.orbit ? view.bodyScale : 1) * height / (2 * view.tanY * p.depth) }
  }).sort((a, b) => b.depth - a.depth)
  const sunPosition = project([0, 0, 0])
  function skillSignal(event) { return event.target.closest?.('[data-skill]')?.getAttribute('data-skill') || null }
  function projectSignal(event) { return event.target.closest?.('[data-project]')?.getAttribute('data-project') || null }
  return <svg onClick={event => { const skill = skillSignal(event), project = projectSignal(event); if (skill) onSkillSelect?.(skill); if (project) onProjectSelect?.(project) }} onPointerMove={event => { if (event.pointerType === 'touch') return; onSkillHover?.(skillSignal(event)); onProjectHover?.(projectSignal(event)) }} onPointerLeave={() => { onSkillHover?.(null); onProjectHover?.(null) }} className="GalaxySolarDiagram" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={skillsFocused ? `Skills: ten technology satellites${selectedSkillId ? `, selected ${skillById(selectedSkillId)?.label}` : ''}` : projectsFocused ? `Projects: six project signals${selectedProjectId ? `, selected ${projectById(selectedProjectId)?.label}` : ''}` : composition && focused.id === IDENTITY.id ? `${IDENTITY.label}: ${IDENTITY.name}, a fictional ocean world` : composition && focused.id === BLACK_HOLE.id ? 'Black Hole: fictional event horizon and accretion disk; portal inactive' : composition ? `${CORE.signal}: ${CORE.name}, the Sun at the center of the system` : `Solar system: ${CORE.shortName} at the center, Identity, Skills, Projects and Journey on four orbits, and a distant Lab and black hole signal`}>
    <defs>
      {bodies.map(body => {
        const dx = sunPosition.x - body.x, dy = sunPosition.y - body.y, length = Math.hypot(dx, dy) || 1
        return <radialGradient id={`${prefix}-${body.id}`} key={body.id} cx={`${50 + dx / length * 30}%`} cy={`${50 + dy / length * 30}%`} r="78%">
          <stop offset="0" stopColor={body.id === 'core' ? '#fff0cd' : body.color} />
          <stop offset={body.id === 'core' ? '.72' : '.38'} stopColor={body.id === 'core' ? '#efb968' : body.color} />
          <stop offset="1" stopColor={body.id === 'core' ? '#bb652d' : '#070a11'} />
        </radialGradient>
      })}
      <radialGradient id={`${prefix}-identity-air`}><stop offset=".86" stopColor={IDENTITY_APPEARANCE.atmosphere} stopOpacity="0" /><stop offset=".93" stopColor={IDENTITY_APPEARANCE.atmosphere} stopOpacity=".3" /><stop offset="1" stopColor={IDENTITY_APPEARANCE.atmosphere} stopOpacity="0" /></radialGradient>
      <radialGradient id={`${prefix}-identity-shade`} cx="75%" cy="35%" r="80%"><stop offset="0" stopColor="#050912" stopOpacity="0" /><stop offset=".45" stopColor="#050912" stopOpacity=".12" /><stop offset="1" stopColor="#050912" stopOpacity=".94" /></radialGradient>
      <clipPath id={`${prefix}-identity-surface`}><circle r="1" /></clipPath>
      <clipPath id={`${prefix}-core-surface`}>{bodies.filter(body => body.id === CORE.id).map(body => <circle key={body.id} cx={body.x} cy={body.y} r={body.r} />)}</clipPath>
      <radialGradient id={`${prefix}-corona`}><stop offset=".6" stopColor="#ffc36f" stopOpacity=".15" /><stop offset="1" stopColor="#ffc36f" stopOpacity="0" /></radialGradient>
    </defs>
    <g fill="none" stroke="#68717d" strokeWidth=".7" opacity=".4">{PLANETS.map(body => <path key={body.id} d={path(body.orbit)} />)}</g>
    {skillsFocused && <g fill="none" stroke="#8292a2" strokeWidth=".65" opacity=".32">{SKILL_ORBITS.map((orbit, index) => <path key={index} d={path(orbit, skillsPosition)} />)}</g>}
    {projectsFocused && <g fill="none" stroke="#a58f83" strokeWidth=".65" opacity=".3">{PROJECT_ORBITS.map((orbit, index) => <path key={index} d={path(orbit, projectsPosition)} />)}</g>}
    {bodies.map(body => body.skillId ? <g key={body.id} data-skill={body.skillId} style={{ cursor: 'pointer' }}>
      <circle cx={body.x} cy={body.y} r={Math.max(12, body.r * 2)} fill="transparent" />
      <rect x={body.x - body.r} y={body.y - body.r * .65} width={body.r * 2} height={body.r * 1.3} rx={body.r * .12} fill={body.skillId === selectedSkillId ? '#e3c28c' : body.color} stroke="#d0e0ef" strokeWidth=".6" />
      {(body.skillId === selectedSkillId || body.skillId === hoveredSkillId) && <circle cx={body.x} cy={body.y} r={body.r * 2.2} fill="none" stroke="#bdcfe0" strokeWidth=".7" />}
    </g> : body.projectId ? <g key={body.id} data-project={body.projectId} style={{ cursor: 'pointer' }}>
      <circle cx={body.x} cy={body.y} r={Math.max(13, body.r * 2.1)} fill="transparent" />
      <path d={`M${body.x},${body.y - body.r} L${body.x + body.r},${body.y} L${body.x},${body.y + body.r} L${body.x - body.r},${body.y} Z`} fill={body.projectId === selectedProjectId ? '#e4b28d' : body.color} stroke="#ead8c9" strokeWidth=".6" />
      {(body.projectId === selectedProjectId || body.projectId === hoveredProjectId) && <circle cx={body.x} cy={body.y} r={body.r * 2.2} fill="none" stroke="#d8b39b" strokeWidth=".7" />}
    </g> : <g key={body.id} data-body={body.id} opacity={selectedBodyId && selectedBodyId !== body.id ? (selectedBodyId === IDENTITY.id || skillsFocused) ? .25 : .7 : 1}>
      {selectedBodyId === body.id && !focusComposition(body, viewportWidth) && <circle cx={body.x} cy={body.y} r={body.r * (body.ring ? 2.4 : 1.85)} fill="none" stroke={body.color} strokeWidth=".8" strokeDasharray="2 5" opacity=".65" />}
      {body.id === 'core' && <circle cx={body.x} cy={body.y} r={body.r * 1.6} fill={`url(#${prefix}-corona)`} />}
      {body.ring && <ellipse cx={body.x} cy={body.y} rx={body.r * 2.15} ry={body.r * .62} transform={`rotate(-24 ${body.x} ${body.y})`} fill="none" stroke={body.color} strokeWidth={body.r * .25} opacity=".4" />}
      {body.id === BLACK_HOLE.id && <ellipse cx={body.x} cy={body.y} rx={body.r * 2.12} ry={body.r * .61} transform={`rotate(-22 ${body.x} ${body.y})`} fill="none" stroke="#ad6648" strokeWidth={Math.max(1, body.r * .20)} opacity=".57" />}
      <circle cx={body.x} cy={body.y} r={body.r} fill={body.id === BLACK_HOLE.id ? '#000' : body.id === 'lab' ? '#06050a' : `url(#${prefix}-${body.id})`} stroke={body.color} strokeWidth={body.id === 'identity' ? 1.4 : .4} strokeOpacity=".35" />
      {body.id === BLACK_HOLE.id && <circle cx={body.x} cy={body.y} r={body.r * 1.08} fill="none" stroke="#c3936a" strokeWidth={Math.max(.5, body.r * .025)} strokeOpacity=".38" />}
      {body.id === CORE.id && <g clipPath={`url(#${prefix}-core-surface)`} fill="none" stroke="#fff0cd" opacity=".13" strokeWidth={body.r * .08}>
        {[0.2, 0.65, 1.15].map((shift, i) => <path key={i} d={`M${body.x - body.r},${body.y - body.r * shift} C${body.x},${body.y + body.r * .5} ${body.x + body.r * .2},${body.y - body.r * .7} ${body.x + body.r},${body.y + body.r * shift}`} />)}
      </g>}
      {body.id === IDENTITY.id && <g transform={`translate(${body.x} ${body.y}) scale(${body.r})`}>
        <circle r="1.1" fill={`url(#${prefix}-identity-air)`} opacity={selectedBodyId === IDENTITY.id ? 1 : .75} />
        <g clipPath={`url(#${prefix}-identity-surface)`}>
          <circle r="1" fill={IDENTITY_APPEARANCE.ocean} />
          <path d="M-1-.5 C-.7-.9-.52-.32-.3-.54 S.04-.88.27-.61 Q.4-.38.16-.19 Q-.13-.25-.04.04 Q.04.31-.18.4 Q-.39.53-.41.15 Q-.78.25-.67-.13 Q-.98-.14-1-.5 M.51.16 Q.86-.14 1.07.19 L1 .67 Q.72.5.58.79 Q.33.93.36.65 Q.54.45.51.16" fill={IDENTITY_APPEARANCE.land} />
          <path d="M-.73-.35 Q-.49-.48-.28-.33 T.2-.51 M.54.42 Q.74.33.92.53" fill="none" stroke={IDENTITY_APPEARANCE.highlands} strokeWidth=".055" opacity=".38" />
          <circle r="1" fill={`url(#${prefix}-identity-shade)`} transform={`rotate(${Math.atan2(sunPosition.y - body.y, sunPosition.x - body.x) * 180 / Math.PI + 31})`} />
        </g>
      </g>}
      {body.id === 'skills' && <g fill="none" stroke="#d7e7e8" opacity=".28" strokeWidth=".7"><ellipse cx={body.x} cy={body.y} rx={body.r * .9} ry={body.r * .3} /><ellipse cx={body.x} cy={body.y} rx={body.r * .35} ry={body.r * .95} /></g>}
      {body.id === 'projects' && <g fill="#2d2828" opacity=".5"><circle cx={body.x - body.r * .25} cy={body.y + body.r * .25} r={body.r * .23} /><circle cx={body.x + body.r * .3} cy={body.y - body.r * .3} r={body.r * .15} /></g>}
      {body.id === 'lab' && <ellipse cx={body.x} cy={body.y} rx={body.r * 1.6} ry={body.r * .65} transform={`rotate(-28 ${body.x} ${body.y})`} fill="none" stroke={body.color} strokeWidth="1.2" opacity=".65" />}
    </g>)}
  </svg>
}
export default function GalaxyFallback({ selectedBodyId, selectedSkillId, hoveredSkillId, selectedProjectId, hoveredProjectId, navigation }) {
  const ref = useRef(null), prefix = useId().replaceAll(':', '')
  const [size, setSize] = useState({ width: 1000, height: 560 })
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) setSize({ width, height, viewportWidth: window.innerWidth })
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return <div className="GalaxyFallback" ref={ref}>
    <svg className="GalaxyStaticSky" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {stars.map((star, index) => <circle key={index} cx={star.x} cy={star.y} r={star.radius} fill="#e5e8ef" opacity={star.opacity} />)}
    </svg>
    <SolarDiagram {...size} prefix={prefix} selectedBodyId={selectedBodyId} selectedSkillId={selectedSkillId} hoveredSkillId={hoveredSkillId} selectedProjectId={selectedProjectId} hoveredProjectId={hoveredProjectId} onSkillSelect={navigation?.selectSkill} onSkillHover={navigation?.setSkillHover} onProjectSelect={navigation?.selectProject} onProjectHover={navigation?.setProjectHover} />
  </div>
}
