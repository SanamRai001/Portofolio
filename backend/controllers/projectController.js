import Project from '../models/projectModel.js'
import {
  paginateProjects,
  resolveProjectPagination,
} from '../utils/projectPagination.js'

const PROJECT_CACHE_MS = 100_000

export const getProjects = async (req, res) => {
  const pagination = resolveProjectPagination(
    req.query,
    req.systemConfig?.pagination === true,
  )

  if (!pagination.ok) {
    return res.status(400).json({
      success: false,
      message: pagination.message,
      data: null,
    })
  }

  if (req.systemConfig?.db === false) {
    return res.status(503).json({
      success: false,
      message: 'Database is disabled.',
      data: null,
    })
  }

  const session = req.demoSession
  if (req.systemConfig?.cache === true && session?.cache?.expiresAt > Date.now()) {
    const cachedProjects = session.cache.projects
    const data = pagination.enabled
      ? paginateProjects(
          cachedProjects,
          pagination.pageNumber,
          pagination.limit,
        )
      : cachedProjects

    return res.json({
      success: true,
      message: 'Projects fetched successfully from cache',
      data,
    })
  }

  try {
    let projects = await Project.find().lean()

    if (req.systemConfig?.cache === true && session) {
      session.cache = { projects, expiresAt: Date.now() + PROJECT_CACHE_MS }
    }

    if (pagination.enabled) {
      projects = paginateProjects(
        projects,
        pagination.pageNumber,
        pagination.limit,
      )
    }

    return res.json({
      success: true,
      message: 'Projects fetched successfully from database',
      data: projects,
    })
  } catch (error) {
    console.error('Project fetch failed:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Projects fetching failed',
      data: null,
    })
  }
}
