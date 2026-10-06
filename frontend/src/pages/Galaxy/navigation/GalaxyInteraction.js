// Adapt the shared tap/drag/hover controller for local constellations.
// Local selections never retarget the camera and are only active after their
// parent world has fully arrived.
export function galaxyInteraction(navigation) {
  return {
    setHover(id) {
      if (id?.startsWith('skill:')) {
        navigation.setProjectHover(null)
        navigation.setJourneyHover(null)
        navigation.setSkillHover(id.slice(6))
        navigation.setHover(null)
        return
      }

      if (id?.startsWith('project:')) {
        navigation.setSkillHover(null)
        navigation.setJourneyHover(null)
        navigation.setProjectHover(id.slice(8))
        navigation.setHover(null)
        return
      }

      if (id?.startsWith('journey:')) {
        navigation.setSkillHover(null)
        navigation.setProjectHover(null)
        navigation.setJourneyHover(id.slice(8))
        navigation.setHover(null)
        return
      }

      navigation.setSkillHover(null)
      navigation.setProjectHover(null)
      navigation.setJourneyHover(null)
      navigation.setHover(id)
    },
    focusBody(id) {
      if (id?.startsWith('skill:')) {
        navigation.selectSkill(id.slice(6))
        return
      }

      if (id?.startsWith('project:')) {
        navigation.selectProject(id.slice(8))
        return
      }

      if (id?.startsWith('journey:')) {
        navigation.selectJourney(id.slice(8))
        return
      }

      navigation.focusBody(id)
    },
  }
}
