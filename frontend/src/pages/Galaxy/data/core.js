// Identity copy belongs to the Galaxy data layer, never to scene or shader code.
export const CORE = Object.freeze({
  id: 'core', label: 'Core', signal: 'Core signal', name: 'Sanam Rai', shortName: 'Sanam',
  role: 'Backend-focused Full-Stack Developer',
  tagline: 'Build • Scale • Solve',
  statement: 'I build the systems behind the interface.',
  description: 'I enjoy understanding how systems work, breaking them apart, rebuilding them, and learning what makes them reliable.',
  metadata: Object.freeze(['BIT Graduate', 'Nepal']),
  links: Object.freeze([
    Object.freeze({ label: 'Backend portfolio', href: '/', external: false }),
    Object.freeze({ label: 'GitHub', href: 'https://github.com/SanamRai001', external: true }),
  ]),
})

export const CORE_COMPOSITION = Object.freeze({
  breakpoint: 760,
  desktop: Object.freeze({ x: -0.46, y: 0, heightFraction: 0.5 }),
  mobile: Object.freeze({ x: 0, y: -0.2, heightFraction: 0.46 }),
})

export function focusComposition(body, viewportWidth) {
  const composition = body.focus?.composition
  return composition ? composition[viewportWidth <= composition.breakpoint ? 'mobile' : 'desktop'] : null
}

export const SUN_APPEARANCE = Object.freeze({
  // White-light photosphere with a warmer, darker limb. The visible
  // chromosphere/corona is subtler than false-colour UV solar photography.
  amber: '#b87944', gold: '#f7d4a1', ivory: '#fff6e4',
  corona: '#ffe1b4', outerCorona: '#d0b8a2', prominence: '#ff9f87',
  innerScale: 1.024, outerScale: 1.070,
  innerStrength: 0.135, outerStrength: 0.023,
  prominenceOpacity: 0.21,
  hoverActivity: 0.35, focusActivity: 1, coronaBoost: 0.14, prominenceBoost: 0.18,
})
