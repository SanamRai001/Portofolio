export const SKILLS = Object.freeze({
  id: 'skills', label: 'Skills', hover: 'Tools & systems', title: 'Built around the work.',
  intro: 'Backend logic is my starting point. Interfaces, data, architecture, and testing connect it to a working product.',
  prompt: 'Select an orbital signal or a technology below to explore its role.',
})
const entries = [
  ['node', 'Node.js', 'Backend', 'My primary backend runtime for APIs and application logic.', ['API services', 'Authentication', 'Business logic', 'Data flows']],
  ['typescript', 'TypeScript', 'Language', 'Making contracts between parts of an application explicit.', ['Typed interfaces', 'Domain models', 'Safer refactoring', 'Shared contracts']],
  ['express', 'Express', 'Backend', 'Small, explicit HTTP services built from routes and middleware.', ['REST endpoints', 'Validation', 'Auth middleware', 'Error handling']],
  ['react', 'React', 'Interface', 'Connecting user interaction to application state and backend services.', ['Component boundaries', 'State', 'API integration', 'Accessible interactions']],
  ['mysql', 'MySQL', 'Data', 'Relational data organized around clear schemas and business rules.', ['Data modeling', 'Joins', 'Transactions', 'Indexes']],
  ['postgres', 'PostgreSQL', 'Data', 'Exploring relational modeling and the guarantees a database can provide.', ['Constraints', 'Queries', 'Transactions', 'Query plans']],
  ['mongodb', 'MongoDB', 'Data', 'Document storage used by this portfolio and its project examples.', ['Document models', 'Mongoose', 'Queries', 'Pagination']],
  ['architecture', 'Architecture', 'Systems', 'Thinking about responsibilities, boundaries, and the path a request takes.', ['Service boundaries', 'Authorization', 'Data ownership', 'Failure handling']],
  ['git', 'Git / GitHub', 'Delivery', 'Keeping changes reviewable and connecting code to automated checks.', ['Branches', 'Commits', 'Pull requests', 'CI workflows']],
  ['testing', 'Testing', 'Quality', 'Checking behavior and regressions, including what happens when a system fails.', ['Unit tests', 'Integration checks', 'Regression cases', 'Failure paths']],
]
// Each node shares the existing orbit simulation. Units are local to Skills.
export const SKILL_ORBITS = Object.freeze([
  Object.freeze({ radius: 1.45, speed: .08, inclination: .35 }),
  Object.freeze({ radius: 1.92, speed: -.055, inclination: -.2 }),
  Object.freeze({ radius: 2.42, speed: .035, inclination: .12 }),
])
export const SKILL_NODES = Object.freeze(entries.map(([id, label, category, summary, focus], index) => {
  const ring = index < 3 ? 0 : index < 6 ? 1 : 2, slot = index - [0, 3, 6][ring]
  return Object.freeze({ id, label, category, summary, focus: Object.freeze(focus), ring, radius: .12,
    color: ['#abc6d4', '#a2b2cc', '#bdc4cb'][ring],
    orbit: Object.freeze({ ...SKILL_ORBITS[ring], phase: slot / [3, 3, 4][ring] * Math.PI * 2 + [.3, 1.1, .6][ring] }),
  })
}))
export const SKILLS_FRAME_RADIUS = 2.65
export const SKILLS_COMPOSITION = Object.freeze({ breakpoint: 760,
  desktop: Object.freeze({ x: -.46, y: -.06, heightFraction: .58 }),
  mobile: Object.freeze({ x: 0, y: -.24, heightFraction: .74 }),
})
export const skillById = id => SKILL_NODES.find(skill => skill.id === id)
