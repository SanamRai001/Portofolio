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
  assert.ok(html.includes(`data-galaxy-project="${project.id}"`))
  assert.ok(html.includes(`"${PORTFOLIO_ORIGIN}/galaxy/projects/${project.id}"`))
  assert.ok(html.includes(project.href))
}

const root = await readFile(resolve('dist', 'index.html'), 'utf8')
assert.ok(root.includes('<link rel="canonical" href="https://sanam-rai.com.np/" />'))
assert.doesNotMatch(root, /data-galaxy-project=/)

console.log(`Verified ${PROJECT_NODES.length} Galaxy project metadata pages.`)
