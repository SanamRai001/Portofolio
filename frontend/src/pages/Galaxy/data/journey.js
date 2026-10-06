export const JOURNEY = Object.freeze({
  id: 'journey',
  label: 'Journey',
  hover: 'Path & progression',
  title: 'The path keeps changing.',
  intro: 'My direction was not a straight line from one stack to one job. Each stage changed what I pay attention to: quality, backend logic, real product delivery, and now research-oriented systems.',
  prompt: 'Select a waypoint to see what changed at that stage.',
})

export const JOURNEY_WAYPOINTS = Object.freeze([
  Object.freeze({
    id: 'foundation',
    label: 'BIT Foundation',
    kind: 'Education',
    period: 'BIT Graduate',
    summary: 'Built a broad software foundation and became most interested in logic, architecture, and understanding how systems behave.',
    focus: Object.freeze(['Software foundations', 'Architecture', 'Problem solving']),
    phase: -2.35,
    color: '#a9b7c7',
  }),
  Object.freeze({
    id: 'qa',
    label: 'QA Lens',
    kind: 'Quality',
    period: 'Danfe Solution · QA Internship',
    summary: 'Testing failures and edge cases made system behavior tangible. That experience pushed me toward debugging, backend logic, and root-cause thinking.',
    focus: Object.freeze(['Testing', 'Failure paths', 'Debugging']),
    phase: -1.50,
    color: '#aeb9c8',
  }),
  Object.freeze({
    id: 'backend',
    label: 'Backend Direction',
    kind: 'Engineering',
    period: 'Node.js · APIs · Databases',
    summary: 'I moved deeper into APIs, authentication, data modeling, and building complete products where the backend carries the rules of the system.',
    focus: Object.freeze(['Node.js', 'REST APIs', 'Databases']),
    phase: -.65,
    color: '#b9b8c6',
  }),
  Object.freeze({
    id: 'mih',
    label: 'Production Systems',
    kind: 'Work',
    period: 'MIH Group · Full-Stack Internship · Aug 2026',
    summary: 'Working on real production systems expanded the problem from writing features to architecture, testing, deployment, operational constraints, and maintainable delivery.',
    focus: Object.freeze(['Full-stack delivery', 'Testing', 'Deployment']),
    phase: .20,
    color: '#c5b6b4',
  }),
  Object.freeze({
    id: 'research',
    label: 'Research & Exploration',
    kind: 'Now',
    period: 'Personal systems · Current direction',
    summary: 'Personal work now reaches into browser-state exploration, digital heritage and 3D reconstruction, AI and automation, and deeper system architecture.',
    focus: Object.freeze(['StateScout', 'Reality Archive', 'AI / automation']),
    relatedProjectIds: Object.freeze(['statescout', 'reality-archive']),
    phase: 1.05,
    color: '#d2b69b',
  }),
])

export const JOURNEY_TRAJECTORY = Object.freeze({
  radius: 2.75,
  inclination: .27,
  startPhase: -2.58,
  endPhase: 1.28,
  desktopSegments: 96,
  mobileSegments: 56,
})

export const JOURNEY_FRAME_RADIUS = 3.05

export const journeyById = id => JOURNEY_WAYPOINTS.find(waypoint => waypoint.id === id)

export const JOURNEY_APPEARANCE = Object.freeze({
  hazeColor: '#d8c8a9',
  hazeScale: 1.045,
  hazeStrength: .14,
  lowPowerHazeStrength: .095,
  surfaceRoughness: 1,
  desktopMapSize: Object.freeze([384, 192]),
  mobileMapSize: Object.freeze([192, 96]),
})

export const JOURNEY_RING_APPEARANCE = Object.freeze({
  // Saturn/Cassini-inspired *structure*, not a copied observational texture.
  innerTint: '#cec5b0',
  outerTint: '#b9b4a2',
  desktopSegments: 192,
  desktopRadialSegments: 5,
  mobileSegments: 96,
})

export const JOURNEY_COMPOSITION = Object.freeze({
  breakpoint: 760,
  desktop: Object.freeze({ x: -.44, y: -.02, heightFraction: .58 }),
  mobile: Object.freeze({ x: 0, y: -.27, heightFraction: .72, fov: 42 }),
})
