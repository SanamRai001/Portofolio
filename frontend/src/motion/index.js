import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const MOTION = Object.freeze({
  duration: {
    micro: 0.16,
    fast: 0.28,
    base: 0.52,
    slow: 0.85,
    hero: 1.15,
  },
  ease: {
    standard: 'power3.out',
    enter: 'power4.out',
    inOut: 'power2.inOut',
  },
  distance: {
    xs: 8,
    sm: 16,
    md: 28,
    lg: 48,
  },
  stagger: {
    tight: 0.045,
    base: 0.08,
    relaxed: 0.12,
  },
})

export const createMotionContext = (scope, setup) => {
  const contextScope = scope?.current ?? scope

  return gsap.context(() => {
    setup({ gsap, ScrollTrigger, MOTION })
  }, contextScope)
}

export { gsap, ScrollTrigger }
