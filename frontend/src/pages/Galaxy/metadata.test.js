import test from 'node:test'
import assert from 'node:assert/strict'
import { galaxyDocumentMetadata } from './navigation/GalaxyMetadata.js'

test('Galaxy metadata follows overview, world and project semantic state', () => {
  assert.deepEqual(galaxyDocumentMetadata(), {
    title: 'Galaxy | Sanam Rai',
    description: 'Explore Sanam Rai\'s interactive Galaxy portfolio: identity, engineering capabilities, projects, progression, research, and experiments.',
  })

  assert.deepEqual(galaxyDocumentMetadata({ selectedBodyId: 'projects' }), {
    title: 'Projects | Galaxy | Sanam Rai',
    description: 'Projects — Projects in Sanam Rai\'s interactive Galaxy portfolio.',
  })

  const stateScout = galaxyDocumentMetadata({
    selectedBodyId: 'projects',
    selectedProjectId: 'statescout',
  })
  assert.equal(stateScout.title, 'StateScout | Galaxy | Sanam Rai')
  assert.match(stateScout.description, /semantic state-graph explorer/)

  const reality = galaxyDocumentMetadata({
    selectedBodyId: 'projects',
    selectedProjectId: 'reality-archive',
  })
  assert.equal(reality.title, 'Reality Archive | Galaxy | Sanam Rai')
  assert.match(reality.description, /digital-heritage/)
})

test('unknown local IDs never poison the world metadata fallback', () => {
  assert.deepEqual(
    galaxyDocumentMetadata({ selectedBodyId: 'journey', selectedProjectId: 'missing' }),
    {
      title: 'Journey | Galaxy | Sanam Rai',
      description: 'Journey — Journey in Sanam Rai\'s interactive Galaxy portfolio.',
    },
  )
})
