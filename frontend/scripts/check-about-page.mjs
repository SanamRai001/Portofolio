import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (path) => readFile(resolve(root, path), 'utf8')

const [html, stylesheet, sitemap, routing] = await Promise.all([
  read('dist/about/index.html'),
  read('dist/about/style.css'),
  read('dist/sitemap.xml'),
  read('vercel.json'),
])

assert.match(html, /<h1 id="name">Sanam Rai/)
assert.match(html, /<link rel="canonical" href="https:\/\/sanam-rai\.com\.np\/about" \/>/)
assert.match(html, /<meta name="robots" content="index, follow/)
assert.match(html, /href="\/about\/style\.css"/)
assert.ok(!html.includes('id="root"'), 'Biography must be readable without React')
assert.ok(stylesheet.includes('.cards'), 'Static stylesheet was not copied')
assert.ok(sitemap.includes('<loc>https://sanam-rai.com.np/about</loc>'))

const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
assert.ok(match, 'Structured data must be in the initial HTML')
const graph = JSON.parse(match[1])['@graph']
const person = graph.find((node) => node['@type'] === 'Person')
const about = graph.find((node) => node['@type'] === 'AboutPage')
assert.equal(person['@id'], 'https://sanam-rai.com.np/#person')
assert.equal(person.name, 'Sanam Rai')
assert.deepEqual(person.sameAs, [
  'https://github.com/SanamRai001',
  'https://www.linkedin.com/in/sanam-rai-6b2149212/',
])
assert.equal(about.mainEntity['@id'], person['@id'])
assert.ok(JSON.parse(routing).rewrites.some((rule) =>
  rule.source === '/about' && rule.destination === '/about/index.html'))
console.log('Static About page: HTML, identity, sitemap and routing verified')
