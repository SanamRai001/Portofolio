import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { JSDOM } from 'jsdom'

import { PROJECT_NODES } from './data/projects.js'
import {
  applyDocumentMetadata,
  projectMetadata,
  projectMetadataById,
  projectStructuredData,
  syncProjectStructuredData,
} from './projectMetadata.js'

test('G4C project metadata is canonical, bounded and unique for every case study', () => {
  const titles = new Set()
  const descriptions = new Set()
  const images = new Set()

  for (const project of PROJECT_NODES) {
    const meta = projectMetadata(project)
    assert.equal(meta.path, `/galaxy/projects/${project.id}`)
    assert.equal(meta.url, `https://sanam-rai.com.np${meta.path}`)
    assert.equal(meta.type, 'article')
    assert.ok(meta.title.includes(project.label))
    assert.ok(meta.description.length <= 158)
    assert.equal(meta.repository, project.href)
    assert.equal(meta.image, `https://sanam-rai.com.np/galaxy/social/${project.id}.png`)
    assert.match(meta.imageAlt, new RegExp(project.label))
    titles.add(meta.title)
    descriptions.add(meta.description)
    images.add(meta.image)

    const structured = projectStructuredData(project)
    assert.equal(structured.name, project.label)
    assert.equal(structured.url, meta.url)
    assert.equal(structured.isBasedOn, project.href)
  }

  assert.equal(titles.size, PROJECT_NODES.length)
  assert.equal(descriptions.size, PROJECT_NODES.length)
  assert.equal(images.size, PROJECT_NODES.length)
  assert.equal(projectMetadataById('missing'), null)
})

test('runtime metadata updates and removes project JSON-LD without stale case-study state', () => {
  const dom = new JSDOM(`<!doctype html><html><head>
    <title>Original</title>
    <meta name="description" content="original">
    <link rel="canonical" href="https://sanam-rai.com.np/">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://sanam-rai.com.np/">
    <meta property="og:title" content="Original">
    <meta property="og:description" content="original">
    <meta property="og:image" content="https://sanam-rai.com.np/projects/portfolio-system.png">
    <meta name="twitter:title" content="Original">
    <meta name="twitter:description" content="original">
    <meta name="twitter:image" content="https://sanam-rai.com.np/projects/portfolio-system.png">
  </head><body></body></html>`)
  const doc = dom.window.document
  const stateScout = PROJECT_NODES.find(project => project.id === 'statescout')
  const reality = PROJECT_NODES.find(project => project.id === 'reality-archive')

  const first = projectMetadata(stateScout)
  applyDocumentMetadata(first, doc)
  syncProjectStructuredData(stateScout, doc)

  assert.equal(doc.title, first.title)
  assert.equal(doc.querySelector('link[rel="canonical"]').href, first.url)
  assert.equal(doc.querySelector('meta[property="og:type"]').content, 'article')
  assert.equal(doc.querySelector('meta[name="twitter:title"]').content, first.title)
  assert.equal(doc.querySelector('meta[property="og:image"]').content, first.image)
  assert.equal(doc.querySelector('meta[name="twitter:image"]').content, first.image)
  assert.equal(doc.querySelector('meta[property="og:image:alt"]').content, first.imageAlt)
  assert.equal(doc.querySelector('script[data-galaxy-project]').dataset.galaxyProject, 'statescout')
  assert.match(doc.querySelector('script[data-galaxy-project]').textContent, /StateScout/)

  const second = projectMetadata(reality)
  applyDocumentMetadata(second, doc)
  syncProjectStructuredData(reality, doc)
  assert.equal(doc.querySelectorAll('script[data-galaxy-project]').length, 1)
  assert.equal(doc.querySelector('script[data-galaxy-project]').dataset.galaxyProject, 'reality-archive')
  assert.match(doc.querySelector('script[data-galaxy-project]').textContent, /Reality Archive/)
  assert.equal(doc.querySelector('meta[property="og:image"]').content, second.image)
  assert.equal(doc.querySelector('meta[name="twitter:image"]').content, second.image)
  assert.notEqual(second.image, first.image)

  syncProjectStructuredData(null, doc)
  assert.equal(doc.querySelector('script[data-galaxy-project]'), null)
  dom.window.close()
})

test('Vercel exact project rewrites stay aligned with all curated prerender pages', async () => {
  const config = JSON.parse(await readFile(new URL('../../../vercel.json', import.meta.url), 'utf8'))
  const projectRules = config.rewrites.filter(rule => rule.source.startsWith('/galaxy/projects/'))

  assert.equal(projectRules.length, PROJECT_NODES.length)
  assert.deepEqual(
    projectRules.map(rule => rule.source).sort(),
    PROJECT_NODES.map(project => `/galaxy/projects/${project.id}`).sort(),
  )

  for (const rule of projectRules) {
    assert.equal(rule.destination, `${rule.source}/index.html`)
  }

  assert.ok(config.rewrites.some(rule =>
    rule.source === '/galaxy/:path*' && rule.destination === '/index.html'))
})
