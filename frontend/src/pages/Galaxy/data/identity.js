import { CORE } from './core.js'

export const IDENTITY = Object.freeze({
  id: 'identity', label: 'Identity', name: CORE.name, hover: 'Who I am',
  metadata: ['BIT Graduate', 'Based in Nepal'],
  intro: 'I enjoy logic, architecture, and understanding why systems behave the way they do.',
  learning: 'I learn best by building something real, finding what breaks, understanding why, and fixing it properly.',
  learningStyle: ['Learn', 'Build', 'Break', 'Understand', 'Fix', 'Repeat'],
  curiosity: 'Backend engineering is where I feel most comfortable. Curiosity pulls me toward frontend interaction, AI, agents, simulations, automation, and unusual software ideas.',
  traits: [
    { label: 'Curious', text: 'There is always something outside my main stack to explore.' },
    { label: 'Builder', text: 'Ideas make more sense when I turn them into something real.' },
    { label: 'Persistent', text: 'When something breaks, I want to understand the cause.' },
  ],
  portrait: { label: 'Portrait signal', status: 'Image pending' },
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
  selectedBoost: .24, hoverBoost: .12, // Keep authored Earth rotation discernible in a close-up; the former 18%
  // selected speed looked frozen even with a healthy single scene clock.
  selectedSpeed: .82, hoverSpeed: .92,
})
