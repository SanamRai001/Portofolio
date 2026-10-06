import { CORE } from './core.js'

export const IDENTITY = Object.freeze({
  id: 'identity',
  label: 'Identity',
  name: CORE.name,
  hover: 'Who I am',
  metadata: ['BIT Graduate', 'Nepal'],
  intro: 'I like problems where the rules matter: logic, architecture, data, and why a system behaves the way it does.',
  learning: 'I learn fastest by building something real, breaking assumptions, tracing the cause, and improving the design.',
  learningStyle: ['Learn', 'Build', 'Break', 'Understand', 'Fix', 'Repeat'],
  curiosity: 'Backend engineering is home base. From there I keep reaching into interaction, AI agents, automation, simulations, and research-heavy software.',
  compass: Object.freeze({
    label: 'Current compass',
    path: Object.freeze(['Logic', 'Systems', 'Exploration']),
  }),
  traits: Object.freeze([
    Object.freeze({ label: 'Curious', text: 'Explore beyond the stack.' }),
    Object.freeze({ label: 'Builder', text: 'Turn ideas into working systems.' }),
    Object.freeze({ label: 'Persistent', text: 'Trace failures to the cause.' }),
  ]),
})

export const IDENTITY_COMPOSITION = Object.freeze({
  breakpoint: 760,
  desktop: Object.freeze({ x: -.46, y: .08, heightFraction: .45 }),
  mobile: Object.freeze({ x: 0, y: -.22, heightFraction: .54, fov: 30 }),
})

export const IDENTITY_APPEARANCE = Object.freeze({
  ocean: '#102a38', shallows: '#2e5963', land: '#627766', highlands: '#96a18d',
  surfaceRoughness: .72, surfaceMetalness: .02,
  atmosphere: '#71c6d8', atmosphereScale: 1.068, atmosphereStrength: .29,
  cloud: '#e3e9df', cloudScale: 1.018, cloudOpacity: .27, cloudSeed: 4.7,
  selectedBoost: .24, hoverBoost: .12,
  selectedSpeed: .82, hoverSpeed: .92,
})
