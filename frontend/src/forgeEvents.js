export const FORGE_REACTION_EVENT = 'forge:reaction'

const ALLOWED_REACTIONS = new Set([
  'look',
  'think',
  'wave',
  'build',
  'celebrate',
  'recovery',
  'support',
])

export const emitForgeReaction = (state, options = {}) => {
  if (typeof window === 'undefined' || !ALLOWED_REACTIONS.has(state)) return

  const duration = Math.min(Math.max(Number(options.duration) || 1100, 450), 2400)

  window.dispatchEvent(new CustomEvent(FORGE_REACTION_EVENT, {
    detail: {
      state,
      duration,
      source: options.source || 'system',
    },
  }))
}
