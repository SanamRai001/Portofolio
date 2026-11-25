import { projectById } from './data/projects.js'

export const PORTFOLIO_ORIGIN = 'https://sanam-rai.com.np'
export const GALAXY_SOCIAL_IMAGE = `${PORTFOLIO_ORIGIN}/projects/portfolio-system.png`
export const projectSocialImage = projectId => `${PORTFOLIO_ORIGIN}/galaxy/social/${projectId}.png`

const truncate = (value, max = 158) => {
  if (value.length <= max) return value
  const slice = value.slice(0, max - 1)
  const boundary = slice.lastIndexOf(' ')
  return `${slice.slice(0, boundary > 110 ? boundary : max - 1).trim()}…`
}

export const GALAXY_METADATA = Object.freeze({
  title: 'Galaxy | Sanam Rai',
  description: 'Explore Sanam Rai’s interactive portfolio galaxy: engineering projects, skills, journey, research experiments, and the systems behind the work.',
  path: '/galaxy',
  url: `${PORTFOLIO_ORIGIN}/galaxy`,
  image: GALAXY_SOCIAL_IMAGE,
  type: 'website',
})

export function projectMetadata(project) {
  if (!project) return null

  const path = `/galaxy/projects/${project.id}`
  return Object.freeze({
    id: project.id,
    title: `${project.label} | Engineering Case Study | Sanam Rai`,
    description: truncate(project.summary),
    path,
    url: `${PORTFOLIO_ORIGIN}${path}`,
    image: projectSocialImage(project.id),
    imageAlt: `${project.label} engineering case study by Sanam Rai`,
    type: 'article',
    repository: project.href,
    category: project.category,
    keywords: Object.freeze([...project.focus]),
  })
}

export function projectMetadataById(projectId) {
  return projectMetadata(projectById(projectId))
}

export function projectStructuredData(project) {
  const metadata = projectMetadata(project)
  if (!metadata) return null

  return Object.freeze({
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.label,
    description: metadata.description,
    url: metadata.url,
    creator: Object.freeze({
      '@type': 'Person',
      name: 'Sanam Rai',
      url: `${PORTFOLIO_ORIGIN}/`,
    }),
    isBasedOn: project.href,
    keywords: project.focus.join(', '),
  })
}

function setContent(doc, selector, value) {
  const node = doc.querySelector(selector)
  if (node) node.setAttribute('content', value)
}

export function applyDocumentMetadata(metadata, doc = document) {
  if (!metadata || !doc) return

  doc.title = metadata.title

  const canonical = doc.querySelector('link[rel="canonical"]')
  if (canonical) canonical.setAttribute('href', metadata.url)

  setContent(doc, 'meta[name="description"]', metadata.description)
  setContent(doc, 'meta[property="og:type"]', metadata.type)
  setContent(doc, 'meta[property="og:url"]', metadata.url)
  setContent(doc, 'meta[property="og:title"]', metadata.title)
  setContent(doc, 'meta[property="og:description"]', metadata.description)
  setContent(doc, 'meta[property="og:image"]', metadata.image)
  setContent(doc, 'meta[property="og:image:alt"]', metadata.imageAlt || metadata.title)
  setContent(doc, 'meta[name="twitter:title"]', metadata.title)
  setContent(doc, 'meta[name="twitter:description"]', metadata.description)
  setContent(doc, 'meta[name="twitter:image"]', metadata.image)
  setContent(doc, 'meta[name="twitter:image:alt"]', metadata.imageAlt || metadata.title)
}

export function syncProjectStructuredData(project, doc = document) {
  if (!doc) return
  let node = doc.querySelector('script[data-galaxy-project]')

  if (!project) {
    node?.remove()
    return
  }

  if (!node) {
    node = doc.createElement('script')
    node.type = 'application/ld+json'
    doc.head.appendChild(node)
  }

  node.setAttribute('data-galaxy-project', project.id)
  node.textContent = JSON.stringify(projectStructuredData(project))
}
