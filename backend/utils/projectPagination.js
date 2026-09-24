export const PROJECT_DEFAULT_PAGE = 1
export const PROJECT_DEFAULT_LIMIT = 3
export const PROJECT_MAX_PAGE = 10000
export const PROJECT_MAX_LIMIT = 24

const parseBoundedInteger = ({
  value,
  fallback,
  name,
  max,
}) => {
  if (value === undefined || value === null || value === '') {
    return { ok: true, value: fallback }
  }

  const text = String(value).trim()

  if (!/^\d+$/.test(text)) {
    return {
      ok: false,
      message: `${name} must be an integer between 1 and ${max}`,
    }
  }

  const parsed = Number(text)

  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) {
    return {
      ok: false,
      message: `${name} must be an integer between 1 and ${max}`,
    }
  }

  return { ok: true, value: parsed }
}

export const resolveProjectPagination = (
  query = {},
  paginationEnabled = false,
) => {
  if (!paginationEnabled) {
    return {
      ok: true,
      enabled: false,
      pageNumber: PROJECT_DEFAULT_PAGE,
      limit: PROJECT_DEFAULT_LIMIT,
    }
  }

  const page = parseBoundedInteger({
    value: query.pageNumber,
    fallback: PROJECT_DEFAULT_PAGE,
    name: 'pageNumber',
    max: PROJECT_MAX_PAGE,
  })

  if (!page.ok) return page

  const limit = parseBoundedInteger({
    value: query.limit,
    fallback: PROJECT_DEFAULT_LIMIT,
    name: 'limit',
    max: PROJECT_MAX_LIMIT,
  })

  if (!limit.ok) return limit

  return {
    ok: true,
    enabled: true,
    pageNumber: page.value,
    limit: limit.value,
  }
}

export const paginateProjects = (projects, pageNumber, limit) => {
  const start = (pageNumber - 1) * limit
  return projects.slice(start, start + limit)
}
