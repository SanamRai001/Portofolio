export const SKILLS = Object.freeze({
  id: 'skills',
  label: 'Skills',
  hover: 'Engineering capabilities',
  title: 'How I build systems.',
  intro: 'The tools matter, but the more useful story is how they combine: runtime and API design, data and persistence, then delivery from architecture to interface and verification.',
  prompt: 'Explore one capability ring or select a technology signal to see the role it plays.',
})

export const SKILL_GROUPS = Object.freeze([
  Object.freeze({
    id: 'runtime',
    label: 'Runtime & APIs',
    shortLabel: 'Runtime',
    summary: 'Turning domain logic into typed, explicit HTTP services and application behavior.',
    color: '#abc6d4',
    skillIds: Object.freeze(['node', 'typescript', 'express']),
  }),
  Object.freeze({
    id: 'data',
    label: 'Data & Persistence',
    shortLabel: 'Data',
    summary: 'Choosing schemas, constraints, indexes, and storage models that keep application state trustworthy.',
    color: '#a2b2cc',
    skillIds: Object.freeze(['mysql', 'postgres', 'mongodb']),
  }),
  Object.freeze({
    id: 'delivery',
    label: 'System Delivery',
    shortLabel: 'Delivery',
    summary: 'Connecting architecture, interface work, verification, and versioned delivery into something maintainable.',
    color: '#bdc4cb',
    skillIds: Object.freeze(['react', 'architecture', 'git', 'testing']),
  }),
])

const groupBySkillId = new Map(
  SKILL_GROUPS.flatMap(group => group.skillIds.map(id => [id, group])),
)

const entries = [
  ['node', 'Node.js', 'Backend', 'My primary backend runtime for APIs and application logic.', ['API services', 'Authentication', 'Business logic', 'Data flows']],
  ['typescript', 'TypeScript', 'Language', 'Making contracts between parts of an application explicit.', ['Typed interfaces', 'Domain models', 'Safer refactoring', 'Shared contracts']],
  ['express', 'Express', 'Backend', 'Small, explicit HTTP services built from routes and middleware.', ['REST endpoints', 'Validation', 'Auth middleware', 'Error handling']],
  ['mysql', 'MySQL', 'Data', 'Relational data organized around clear schemas and business rules.', ['Data modeling', 'Joins', 'Transactions', 'Indexes']],
  ['postgres', 'PostgreSQL', 'Data', 'Exploring relational modeling and the guarantees a database can provide.', ['Constraints', 'Queries', 'Transactions', 'Query plans']],
  ['mongodb', 'MongoDB', 'Data', 'Document storage used by this portfolio and its project examples.', ['Document models', 'Mongoose', 'Queries', 'Pagination']],
  ['react', 'React', 'Interface', 'Connecting user interaction to application state and backend services.', ['Component boundaries', 'State', 'API integration', 'Accessible interactions']],
  ['architecture', 'Architecture', 'Systems', 'Thinking about responsibilities, boundaries, and the path a request takes.', ['Service boundaries', 'Authorization', 'Data ownership', 'Failure handling']],
  ['git', 'Git / GitHub', 'Delivery', 'Keeping changes reviewable and connecting code to automated checks.', ['Branches', 'Commits', 'Pull requests', 'CI workflows']],
  ['testing', 'Testing', 'Quality', 'Checking behavior and regressions, including what happens when a system fails.', ['Unit tests', 'Integration checks', 'Regression cases', 'Failure paths']],
]

// Each capability group owns one orbit. The existing shared orbit simulation and
// ten proven satellites stay intact; G3C makes the rings semantically meaningful.
export const SKILL_ORBITS = Object.freeze([
  Object.freeze({ groupId: 'runtime', radius: 1.45, speed: .08, inclination: .35 }),
  Object.freeze({ groupId: 'data', radius: 1.92, speed: -.055, inclination: -.2 }),
  Object.freeze({ groupId: 'delivery', radius: 2.42, speed: .035, inclination: .12 }),
])

export const SKILL_NODES = Object.freeze(entries.map(([id, label, category, summary, focus]) => {
  const group = groupBySkillId.get(id)
  const ring = SKILL_GROUPS.findIndex(candidate => candidate.id === group.id)
  const slot = group.skillIds.indexOf(id)

  return Object.freeze({
    id,
    label,
    category,
    summary,
    focus: Object.freeze(focus),
    groupId: group.id,
    groupLabel: group.label,
    ring,
    radius: .12,
    color: group.color,
    orbit: Object.freeze({
      ...SKILL_ORBITS[ring],
      phase: slot / group.skillIds.length * Math.PI * 2 + [.3, 1.1, .6][ring],
    }),
  })
}))

export const SKILLS_FRAME_RADIUS = 2.65

export const SKILLS_COMPOSITION = Object.freeze({
  breakpoint: 760,
  desktop: Object.freeze({ x: -.46, y: -.06, heightFraction: .58 }),
  mobile: Object.freeze({ x: 0, y: -.24, heightFraction: .74 }),
})

export const skillById = id => SKILL_NODES.find(skill => skill.id === id)
export const skillGroupById = id => SKILL_GROUPS.find(group => group.id === id)
