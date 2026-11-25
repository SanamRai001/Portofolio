import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { PROJECT_NODES } from '../src/pages/Galaxy/data/projects.js'
import { PORTFOLIO_ORIGIN, projectMetadata } from '../src/pages/Galaxy/projectMetadata.js'

for (const project of PROJECT_NODES) {
  const meta = projectMetadata(project)
  const path = resolve('dist', 'galaxy', 'projects', project.id, 'index.html')
  const html = await readFile(path, 'utf8')

  assert.ok(html.includes(`<title>${meta.title}</title>`))
  assert.ok(html.includes(`<link rel="canonical" href="${meta.url}" />`))
  assert.ok(html.includes(`<meta property="og:url" content="${meta.url}" />`))
  assert.ok(html.includes('<meta property="og:type" content="article" />'))
  assert.ok(html.includes(`<meta property="og:title" content="${meta.title}" />`))
  assert.ok(html.includes(`<meta name="twitter:title" content="${meta.title}" />`))
  assert.ok(html.includes(`<meta property="og:image" content="${meta.image}" />`))
  assert.ok(html.includes(`<meta name="twitter:image" content="${meta.image}" />`))
  assert.ok(html.includes(`data-galaxy-project="${project.id}"`))
  assert.ok(html.includes(`"${PORTFOLIO_ORIGIN}/galaxy/projects/${project.id}"`))
  assert.ok(html.includes(project.href))
}

const images = new Set()
for (const project of PROJECT_NODES) {
  const meta = projectMetadata(project)
  assert.ok(!images.has(meta.image), 'social image URLs must be unique')
  images.add(meta.image)
  const png = await readFile(resolve('dist', 'galaxy', 'social', project.id + '.png'))
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  assert.equal(png.readUInt32BE(16), 1200)
  assert.equal(png.readUInt32BE(20), 630)
  assert.ok(png.length > 12_000 && png.length < 500_000, project.id + ' social PNG size is unexpected')
}

const root = await readFile(resolve('dist', 'index.html'), 'utf8')
assert.ok(root.includes('<link rel="canonical" href="https://sanam-rai.com.np/" />'))
assert.doesNotMatch(root, /data-galaxy-project=/)

console.log(`Verified ${PROJECT_NODES.length} Galaxy project metadata pages.`)
