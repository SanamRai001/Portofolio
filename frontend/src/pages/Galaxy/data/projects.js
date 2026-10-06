export const PROJECTS = Object.freeze({
  id: 'projects',
  label: 'Projects',
  title: 'Built systems, not just screenshots.',
  intro: 'A small set of projects that best represent how I think about systems, products, research, and interaction.',
  prompt: 'Select a project signal to see why it exists and what makes it technically interesting.',
})

export const PROJECTS_APPEARANCE = Object.freeze({
  // Visible Martian limb is a faint scattering edge, not a neon orange halo.
  dustColor: '#bc977e',
  dustScale: 1.019,
  dustStrength: .105,
})

const entries = [
  {
    id: 'reality-archive',
    label: 'Reality Archive',
    category: 'Research / 3D',
    summary: 'A web-first reality-capture and digital-heritage platform for turning real visual captures into faithful interactive reconstructions.',
    focus: ['Computer vision', '3D reconstruction', 'Web delivery', 'Experiment gates'],
    href: 'https://github.com/SanamRai001/Reality-Archive',
  },
  {
    id: 'statescout',
    label: 'StateScout',
    category: 'Research / QA',
    summary: 'A semantic state-graph explorer for modern web applications using Playwright, accessibility semantics, screenshots, and graph search.',
    focus: ['Playwright', 'State graphs', 'Semantic crawling', 'Research design'],
    href: 'https://github.com/SanamRai001/StateScout',
  },
  {
    id: 'reposcout',
    label: 'RepoScout',
    category: 'Open source discovery',
    summary: 'A repository discovery and intelligence platform built around useful, explainable signals instead of popularity alone.',
    focus: ['PostgreSQL search', 'GitHub ingestion', 'Moderation', 'Repository intelligence'],
    href: 'https://github.com/SanamRai001/reposcout',
  },
  {
    id: 'eonborne',
    label: 'Eonborne',
    category: 'Simulation',
    summary: 'A deterministic civilization simulation where autonomous people create history and the player influences rather than commands them.',
    focus: ['Deterministic simulation', 'Web Workers', 'PixiJS', 'Emergent systems'],
    href: 'https://github.com/SanamRai001/Eonborne',
  },
  {
    id: 'dear-future',
    label: 'Dear Future',
    category: 'Product / Privacy',
    summary: 'A deliberately small digital time-capsule product built around sealing a message now and letting it arrive later.',
    focus: ['Privacy boundaries', 'PostgreSQL', 'Encryption design', 'Delivery workflow'],
    href: 'https://github.com/SanamRai001/Dear-future',
  },
  {
    id: 'sajilo-business',
    label: 'Sajilo Business',
    category: 'UX / Business systems',
    summary: 'A simplicity-first business operating system focused on orders, stock visibility, and clear daily actions for small shops.',
    focus: ['UX architecture', 'Order lifecycle', 'Inventory', 'Progressive complexity'],
    href: 'https://github.com/SanamRai001/sajilo-business',
  },
]

export const PROJECT_ORBITS = Object.freeze([
  Object.freeze({ radius: 1.95, speed: .050, inclination: .22 }),
  Object.freeze({ radius: 2.65, speed: -.032, inclination: -.16 }),
])

export const PROJECT_NODES = Object.freeze(entries.map((entry, index) => {
  const ring = index < 3 ? 0 : 1
  const slot = index % 3
  return Object.freeze({
    ...entry,
    focus: Object.freeze(entry.focus),
    ring,
    radius: ring === 0 ? .17 : .15,
    color: ring === 0 ? '#d7a17d' : '#a9b7c7',
    orbit: Object.freeze({
      ...PROJECT_ORBITS[ring],
      phase: slot / 3 * Math.PI * 2 + (ring === 0 ? .35 : 1.15),
    }),
  })
}))

export const PROJECTS_FRAME_RADIUS = 2.95

export const PROJECTS_COMPOSITION = Object.freeze({
  breakpoint: 760,
  desktop: Object.freeze({ x: -.46, y: -.03, heightFraction: .62 }),
  mobile: Object.freeze({ x: 0, y: -.25, heightFraction: .78 }),
})

export const projectById = id => PROJECT_NODES.find(project => project.id === id)
