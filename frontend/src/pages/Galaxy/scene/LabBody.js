import { Color } from 'three'
import { LAB_APPEARANCE, labExperimentById } from '../data/lab.js'
import { createLab } from './CelestialBody.js'

export function createLabBody(body) {
  const group = createLab(body)
  const ring = group.getObjectByName('lab-scan-ring')
  const shell = group.getObjectByName('lab-signal-shell')
  const current = new Color(body.color)
  const target = new Color(body.color)
  let targetOpacity = LAB_APPEARANCE.ringOpacity
  let targetStrength = LAB_APPEARANCE.shellStrength
  let phase = 0

  function applyInstant() {
    ring.material.color.copy(target)
    shell.material.uniforms.tint.value.copy(target)
    ring.material.opacity = targetOpacity
    shell.material.uniforms.strength.value = targetStrength
  }

  return {
    group,
    setSelection(state, instant = false) {
      const focused = state.selectedBodyId === body.id && state.mode === 'body_focused'
      const experiment = focused
        ? labExperimentById(state.hoveredLabId || state.selectedLabId)
        : null

      target.set(experiment?.color || body.color)
      targetOpacity = experiment
        ? LAB_APPEARANCE.activeRingOpacity
        : focused
          ? LAB_APPEARANCE.focusedRingOpacity
          : LAB_APPEARANCE.ringOpacity
      targetStrength = experiment
        ? LAB_APPEARANCE.activeShellStrength
        : focused
          ? LAB_APPEARANCE.focusedShellStrength
          : LAB_APPEARANCE.shellStrength

      if (instant) {
        current.copy(target)
        applyInstant()
      }
    },
    update(delta, animate = true) {
      const dt = Number.isFinite(delta) ? Math.max(0, Math.min(delta, .05)) : 0
      const blend = 1 - Math.exp(-dt * 7)
      current.lerp(target, blend)
      ring.material.color.copy(current)
      shell.material.uniforms.tint.value.copy(current)
      ring.material.opacity += (targetOpacity - ring.material.opacity) * blend
      shell.material.uniforms.strength.value += (targetStrength - shell.material.uniforms.strength.value) * blend

      if (animate) phase = (phase + dt) % 10000
      const pulse = 1 + Math.sin(phase * 1.7) * .045
      ring.scale.setScalar(pulse)
    },
  }
}
