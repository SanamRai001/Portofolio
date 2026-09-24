import NodeCache from 'node-cache'

import Project from '../models/projectModel.js'
import {
  paginateProjects,
  resolveProjectPagination,
} from '../utils/projectPagination.js'

const projectCache = new NodeCache({
  stdTTL: 100,
  checkperiod: 120,
})

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

  if (req.systemConfig?.cache === true && projectCache.has('projects')) {
    const cachedProjects = projectCache.get('projects')
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

    if (req.systemConfig?.cache === true) {
      projectCache.set('projects', projects)
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
