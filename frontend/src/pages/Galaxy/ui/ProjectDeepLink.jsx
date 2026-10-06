import { galaxyPathForProject } from '../navigation/GalaxyHistory.js'
import { projectById } from '../data/projects.js'

function isModified(event) {
  return event.button !== 0
    || event.metaKey
    || event.ctrlKey
    || event.shiftKey
    || event.altKey
}

export default function ProjectDeepLink({
  projectId,
  onOpenProject,
  className = '',
  children = null,
}) {
  const project = projectById(projectId)
  const href = galaxyPathForProject(projectId)
  if (!project || !href) return null

  function open(event) {
    if (isModified(event) || !onOpenProject) return
    const opened = onOpenProject(projectId)
    if (opened !== false) event.preventDefault()
  }

  return <a
    className={className}
    href={href}
    onClick={open}
  >
    {children || project.label}
  </a>
}
