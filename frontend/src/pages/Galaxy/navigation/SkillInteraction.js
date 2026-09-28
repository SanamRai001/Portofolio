// Adapt the existing tap/drag/hover controller; satellite clicks never navigate
// the camera and cannot select hidden satellites outside the focused Skills view.
export function skillInteraction(navigation) {
  return {
    setHover(id) {
      const skill = id?.startsWith('skill:') ? id.slice(6) : null
      navigation.setSkillHover(skill)
      navigation.setHover(skill ? null : id)
    },
    focusBody(id) {
      if (id?.startsWith('skill:')) navigation.selectSkill(id.slice(6))
      else navigation.focusBody(id)
    },
  }
}
