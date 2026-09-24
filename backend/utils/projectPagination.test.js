import test from 'node:test'
import assert from 'node:assert/strict'

import {
  PROJECT_DEFAULT_LIMIT,
  PROJECT_DEFAULT_PAGE,
  PROJECT_MAX_LIMIT,
  paginateProjects,
  resolveProjectPagination,
} from './projectPagination.js'

test('pagination disabled ignores query values and uses stable defaults', () => {
  assert.deepEqual(
    resolveProjectPagination({ pageNumber: '-5', limit: '9999' }, false),
    {
      ok: true,
      enabled: false,
      pageNumber: PROJECT_DEFAULT_PAGE,
      limit: PROJECT_DEFAULT_LIMIT,
    },
  )
})

test('pagination enabled accepts bounded positive integer values', () => {
  assert.deepEqual(
    resolveProjectPagination({ pageNumber: '2', limit: '6' }, true),
    {
      ok: true,
      enabled: true,
      pageNumber: 2,
      limit: 6,
    },
  )
})

test('pagination enabled falls back when query values are omitted', () => {
  const result = resolveProjectPagination({}, true)

  assert.equal(result.ok, true)
  assert.equal(result.pageNumber, PROJECT_DEFAULT_PAGE)
  assert.equal(result.limit, PROJECT_DEFAULT_LIMIT)
})

test('pagination rejects malformed, zero, negative, and oversized values', () => {
  for (const pageNumber of ['0', '-1', '1.5', '1abc']) {
    assert.equal(
      resolveProjectPagination({ pageNumber }, true).ok,
      false,
      pageNumber,
    )
  }

  assert.equal(
    resolveProjectPagination(
      { limit: String(PROJECT_MAX_LIMIT + 1) },
      true,
    ).ok,
    false,
  )
})

test('paginateProjects returns the requested bounded slice', () => {
  assert.deepEqual(
    paginateProjects(['a', 'b', 'c', 'd', 'e'], 2, 2),
    ['c', 'd'],
  )
})
