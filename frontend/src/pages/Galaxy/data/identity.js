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
  mobile: Object.freeze({ x: 0, y: -.22, heightFraction: .46 }),
})
export const IDENTITY_APPEARANCE = Object.freeze({
  ocean: '#1b343e', shallows: '#386268', land: '#68786b', highlands: '#8c9890',
  atmosphere: '#75b7ba', atmosphereScale: 1.055, atmosphereStrength: .24,
  selectedBoost: .28, hoverBoost: .14, rotationSpeed: .022, selectedSpeed: .18, hoverSpeed: .5,
})
