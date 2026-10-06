export const IDENTITY = Object.freeze({
  id: 'identity',
  label: 'Identity',
  hover: 'Working model',
  title: 'How I approach difficult things.',
  intro: 'I am drawn to software where behavior has to make sense: requests, state, data, permissions, failures, and the trade-offs between them.',
  principles: Object.freeze([
    Object.freeze({
      id: 'trace',
      label: 'Trace before changing',
      text: 'I want to understand the real request path, data ownership, and failure point before reaching for an abstraction or patch.',
    }),
    Object.freeze({
      id: 'build',
      label: 'Build to understand',
      text: 'Working systems expose assumptions faster than theory alone. I learn best when an idea has to survive real behavior.',
    }),
    Object.freeze({
      id: 'simplify',
      label: 'Simplify after understanding',
      text: 'The goal is not clever code. It is making a difficult system easier to reason about, maintain, and use.',
    }),
  ]),
  learning: 'My most useful learning loop is practical and repetitive: learn enough to build, let the system break, understand the cause, fix it properly, then repeat with better judgment.',
  learningStyle: Object.freeze(['Learn', 'Build', 'Break', 'Understand', 'Fix', 'Repeat']),
  directions: Object.freeze([
    Object.freeze({
      label: 'Backend & systems',
      text: 'APIs, data, authentication, architecture, reliability, and the rules behind the interface.',
    }),
    Object.freeze({
      label: 'AI & automation',
      text: 'Agents, LLM systems, automation, and ways software can reason through longer workflows.',
    }),
    Object.freeze({
      label: 'Research & experiments',
      text: 'Browser-state exploration, reconstruction, simulations, algorithms, and unusual ideas worth testing.',
    }),
  ]),
})

export const IDENTITY_COMPOSITION = Object.freeze({
  breakpoint: 760,
  desktop: Object.freeze({ x: -.46, y: .08, heightFraction: .45 }),
  mobile: Object.freeze({ x: 0, y: -.22, heightFraction: .54, fov: 30 }),
})

export const IDENTITY_APPEARANCE = Object.freeze({
  ocean: '#102a38',
  shallows: '#2e5963',
  land: '#627766',
  highlands: '#96a18d',
  surfaceRoughness: .72,
  surfaceMetalness: .02,
  atmosphere: '#71c6d8',
  atmosphereScale: 1.068,
  atmosphereStrength: .29,
  cloud: '#e3e9df',
  cloudScale: 1.018,
  cloudOpacity: .27,
  cloudSeed: 4.7,
  selectedBoost: .24,
  hoverBoost: .12,
  selectedSpeed: .82,
  hoverSpeed: .92,
})
