import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { PROJECT_NODES } from '../src/pages/Galaxy/data/projects.js'
import { projectMetadata, projectStructuredData } from '../src/pages/Galaxy/projectMetadata.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')
const source = await readFile(resolve(dist, 'index.html'), 'utf8')

const escapeAttribute = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')

function replaceRequired(html, before, after, label) {
  if (!html.includes(before)) throw new Error(`Missing ${label} in built index.html`)
  return html.replace(before, after)
}

function projectHtml(project) {
  const meta = projectMetadata(project)
  let html = source

  html = replaceRequired(
    html,
    '<title>Sanam Rai | Backend & Full-Stack Developer in Nepal</title>',
    `<title>${escapeAttribute(meta.title)}</title>`,
    'title',
  )
  html = replaceRequired(
    html,
    '<meta name="description" content="Sanam Rai is a backend-focused full-stack developer in Nepal building secure APIs, Node.js systems, authentication, caching, databases and production-minded web applications. Explore an interactive backend lab with transparent runtime configuration and selected projects." />',
    `<meta name="description" content="${escapeAttribute(meta.description)}" />`,
    'description',
  )
  html = replaceRequired(
    html,
    '<link rel="canonical" href="https://sanam-rai.com.np/" />',
    `<link rel="canonical" href="${meta.url}" />`,
    'canonical',
  )
  html = replaceRequired(html, '<meta property="og:type" content="website" />', `<meta property="og:type" content="${meta.type}" />`, 'og:type')
  html = replaceRequired(html, '<meta property="og:url" content="https://sanam-rai.com.np/" />', `<meta property="og:url" content="${meta.url}" />`, 'og:url')
  html = replaceRequired(html, '<meta property="og:title" content="Sanam Rai | Backend & Full-Stack Developer" />', `<meta property="og:title" content="${escapeAttribute(meta.title)}" />`, 'og:title')
  html = replaceRequired(html, '<meta property="og:description" content="Interactive backend portfolio demonstrating authentication, databases, caching, logging, pagination and transparent runtime configuration alongside full-stack projects." />', `<meta property="og:description" content="${escapeAttribute(meta.description)}" />`, 'og:description')
  html = replaceRequired(html, '<meta property="og:image" content="https://sanam-rai.com.np/projects/portfolio-system.png" />', `<meta property="og:image" content="${meta.image}" />`, 'og:image')
  html = replaceRequired(html, '<meta property="og:image:alt" content="Sanam Rai backend-controlled portfolio system interface" />', `<meta property="og:image:alt" content="${escapeAttribute(meta.imageAlt)}" />`, 'og:image:alt')
  html = replaceRequired(html, '<meta name="twitter:title" content="Sanam Rai | Backend & Full-Stack Developer" />', `<meta name="twitter:title" content="${escapeAttribute(meta.title)}" />`, 'twitter:title')
  html = replaceRequired(html, '<meta name="twitter:description" content="Interactive backend portfolio and selected full-stack projects by Sanam Rai." />', `<meta name="twitter:description" content="${escapeAttribute(meta.description)}" />`, 'twitter:description')
  html = replaceRequired(html, '<meta name="twitter:image" content="https://sanam-rai.com.np/projects/portfolio-system.png" />', `<meta name="twitter:image" content="${meta.image}" />`, 'twitter:image')
  html = replaceRequired(html, '<meta name="twitter:image:alt" content="Sanam Rai backend-controlled portfolio system interface" />', `<meta name="twitter:image:alt" content="${escapeAttribute(meta.imageAlt)}" />`, 'twitter:image:alt')

  const structured = JSON.stringify(projectStructuredData(project)).replaceAll('<', '\\u003c')
  html = html.replace(
    '</head>',
    `    <script type="application/ld+json" data-galaxy-project="${project.id}">${structured}</script>\n  </head>`,
  )

  return html
}

for (const project of PROJECT_NODES) {
  const output = resolve(dist, 'galaxy', 'projects', project.id, 'index.html')
  await mkdir(dirname(output), { recursive: true })
  await writeFile(output, projectHtml(project), 'utf8')
  console.log(`Generated ${project.id}: ${output}`)
}
