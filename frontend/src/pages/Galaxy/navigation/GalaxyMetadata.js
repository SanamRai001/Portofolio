import { projectById } from '../data/projects.js'
import { SYSTEM_MAP } from '../data/solarSystem.js'

const DEFAULT_DESCRIPTION = 'Explore Sanam Rai\'s interactive Galaxy portfolio: identity, engineering capabilities, projects, progression, research, and experiments.'

export function galaxyDocumentMetadata(state = {}) {
  const project = projectById(state.selectedProjectId)
  if (project) {
    return Object.freeze({
      title: `${project.label} | Galaxy | Sanam Rai`,
      description: project.summary,
    })
  }

  const body = SYSTEM_MAP.find(candidate => candidate.id === state.selectedBodyId)
  if (body) {
    return Object.freeze({
      title: `${body.label} | Galaxy | Sanam Rai`,
      description: `${body.label} — ${body.meaning || body.label} in Sanam Rai's interactive Galaxy portfolio.`,
    })
  }

  return Object.freeze({
    title: 'Galaxy | Sanam Rai',
    description: DEFAULT_DESCRIPTION,
  })
}
