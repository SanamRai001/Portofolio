import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { CUBE_PREVIEW_PATH, cubeUrl, readCubeView, portalDuration } from '../src/pages/CubePortal/cubePortalNavigation.js'

import { routeFamily, journeyOrigin, canAnimateLink, READY_LIMIT_MS } from '../src/motion/useJourneyTransition.js'
import { WORK_PROJECTS } from '../src/pages/CubePortal/workProjects.js'

const at = relative => fileURLToPath(new URL(relative, import.meta.url))
const text = relative => readFileSync(at(relative), 'utf8')

test('cube preview hash route and reduced motion are deterministic', () => {
  assert.equal(CUBE_PREVIEW_PATH, '/cube-preview')
  assert.equal(readCubeView('#work'), 'work')
  assert.equal(readCubeView('#home'), 'home')
  assert.equal(readCubeView('#garbage'), 'home')
  assert.equal(cubeUrl('work'), '/cube-preview#work')
  assert.equal(cubeUrl('home'), '/cube-preview#home')
  assert.equal(portalDuration('work', true), 0)
  assert.equal(portalDuration('work', false), 720)
  assert.equal(portalDuration('home', false), 640)
})

test('preview route does not replace the established homepage or Galaxy', () => {
  const routes = text('../src/PortfolioRoutes.jsx')
  assert.match(routes, /const Portfolio = lazy\(/)
  assert.match(routes, /const Galaxy = lazy\(/)
  assert.match(routes, /const CubePortalPreview = lazy\(/)
  assert.match(routes, /cubePreview \? <CubePortalPreview journey=\{journey\} \/> : <Portfolio \/>/)
  const vercel = JSON.parse(text('../vercel.json'))
  assert.deepEqual(vercel.rewrites.find(x => x.source === '/cube-preview'), {source:'/cube-preview',destination:'/index.html'})
  assert.ok(vercel.rewrites.find(x => x.source === '/about'))
  assert.ok(vercel.rewrites.find(x => x.source === '/galaxy'))
  assert.deepEqual(vercel.headers.find(x => x.source === '/cube-preview').headers[0], {key:'X-Robots-Tag',value:'noindex, nofollow'})
})

test('layered preview reuses the exact approved artwork and does not load WebGL', () => {
  const bytes = readFileSync(at('../../prototypes/unfolding-cube-portal/source/reference-cube.png'))
  const gitBlob = createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex')
  assert.equal(gitBlob, '33c6c4a293b3f23550e5a1315d6928d344f56569')
  const scene = text('../src/pages/CubePortal/CubeScene.jsx')
  assert.match(scene, /reference-cube\.png\?url/)
  assert.match(scene, /viewBox="0 0 1254 1254"/)
  assert.match(scene, /clipPath=\{split \?/)
  assert.match(scene, /data-renderer="layered-artwork"/)
  assert.doesNotMatch(scene, /createCubeScene|GLTFLoader|WebGLRenderer|<canvas/)
  assert.match(text('../vite.config.js'), /repositoryRoot/)
})

test('portal retains keyboard navigation, focus and explicit non-indexable preview status', () => {
  const jsx = text('../src/pages/CubePortal/CubePortal.jsx')
  assert.match(jsx, /onPop/)
  assert.match(jsx, /'Escape'/)
  assert.match(jsx, /aria-hidden=\{!isWork\}/)
  assert.match(jsx, /inert=\{!isWork\}/)
  const cubeScene = text('../src/pages/CubePortal/CubeScene.jsx')
  assert.match(cubeScene, /MODEL_REVISION = 'original-artwork-tilt-v2'/)
  assert.match(cubeScene, /data-lid-open=\{open\}/)
  assert.match(cubeScene, /data-split=\{split\}/)
  assert.match(cubeScene, /cubeDebug/)
  assert.match(jsx, /highlightedDestination/)
  assert.match(jsx, /CubePortalGlimpse/)
  assert.match(jsx, /--portal-x/)
  assert.match(text('../src/pages/CubePortal/CubePortal.css'), /cubePortalChapterEnter/)
  assert.match(jsx, /noindex, nofollow/)
  assert.match(jsx, /\/\#system-controls/)
  assert.match(jsx, /href="\/galaxy"/)
  assert.match(jsx, /href="\/about\?from=cube" data-about-passage/)
})

test('pointer tilt is bounded, mouse-only, reset on leave and disabled during motion reduction', () => {
  const scene = text('../src/pages/CubePortal/CubeScene.jsx')
  assert.match(scene, /MAX_TILT = 7/)
  assert.match(scene, /phase !== 'home' \|\| reducedMotion/)
  assert.match(scene, /event.pointerType !== 'mouse'/)
  assert.match(scene, /pointerleave/)
  assert.match(scene, /cancelAnimationFrame/)
  assert.match(scene, /removeEventListener/)
  const css = text('../src/pages/CubePortal/CubePortal.css')
  assert.match(css, /perspective\(900px\)/)
  assert.match(css, /prefers-reduced-motion:reduce/)
})

test('selected work contains public, evidence-linked projects without speculative claims', () => {
  assert.equal(WORK_PROJECTS.length, 5)
  assert.equal(new Set(WORK_PROJECTS.map(p => p.id)).size, 5)
  assert.deepEqual(WORK_PROJECTS.filter(p => p.featured).map(p => p.id), ['statescout', 'reposcout', 'backend-lab'])
  for (const p of WORK_PROJECTS) {
    assert.ok(p.repository.startsWith('https://github.com/SanamRai001/'))
    assert.ok(p.evidence.startsWith(p.repository + '/blob/'))
    assert.match(p.evidence, /\/blob\/[0-9a-f]{40}\//)
    assert.ok(p.problem && p.decision && p.outcome && p.limitation)
    assert.equal(p.architecture.length, 4)
    if (p.image) assert.ok(readFileSync(at('../public' + p.image)).length > 0)
  }
  assert.deepEqual(WORK_PROJECTS[0].metric.rows.map(r => r.value), [5, 14])
  assert.equal(WORK_PROJECTS[0].metric.denominator, 16)
  assert.match(WORK_PROJECTS.find(p => p.id === 'yaktalk').limitation, /not persisted/)
  assert.match(WORK_PROJECTS.find(p => p.id === 'backend-lab').limitation, /not mounted/)
  const jsx = text('../src/pages/CubePortal/CubeWorkProjects.jsx')
  assert.match(jsx, /<details className="WorkDetails">/)
  assert.match(jsx, /<summary>/)
  assert.match(text('../src/pages/CubePortal/CubePortal.jsx'), /<CubeWorkProjects active=\{isWork\} \/>/)
})

test('shared passage has bounded geometry and respects native link modifiers', () => {
  assert.equal(routeFamily('/cube-preview/'), 'cube')
  assert.equal(routeFamily('/galaxy/projects'), 'space')
  assert.equal(routeFamily('/about'), 'portfolio')
  assert.equal(READY_LIMIT_MS, 3000)
  const origin = journeyOrigin({left: 200, top: 300, width: 100, height: 100}, 1000, 700)
  assert.equal(origin.x, 250)
  assert.equal(origin.y, 350)
  assert.ok(origin.radius >= Math.hypot(750,350))
  assert.deepEqual(journeyOrigin(null, 1000, 600).x, 500)
  const event = {button:0, currentTarget:{target:'',hasAttribute:()=>false}}
  assert.equal(canAnimateLink(event),true)
  for (const key of ['metaKey','ctrlKey','shiftKey','altKey','defaultPrevented']) assert.equal(canAnimateLink({...event,[key]:true}),false)
  assert.equal(canAnimateLink({...event,button:1}),false)
  assert.equal(canAnimateLink({...event,currentTarget:{...event.currentTarget,target:'_blank'}}),false)
  assert.match(text('../src/pages/Galaxy/GalaxyPage.jsx'), /if \(ready \|\| fallback\) journeyReady\?\.\('space'\)/)
  assert.match(text('../src/pages/CubePortal/CubePortal.css'), /data-split="true"\] \.CubeArtworkTilt \{transform:none;transition:none\}/)
})

test('work chapter shares orbital motifs and uses the existing visible-by-default reveal system', () => {
  const portal = text('../src/pages/CubePortal/CubePortal.jsx')
  const project = text('../src/pages/CubePortal/CubeWorkProjects.jsx')
  const css = text('../src/pages/CubePortal/CubeWorkProjects.css')
  assert.match(portal, /className="WorkChapterOrbit".*aria-hidden="true"/)
  assert.match(project, /useSectionReveals\(rootRef, !active\)/)
  assert.match(project, /data-reveal/)
  assert.match(project, /className="WorkOrbitSignal" aria-hidden="true"/)
  assert.match(css, /prefers-reduced-motion:reduce/)
  assert.match(css, /focus-within/)
})

test('About remains standalone with optional native-page passage and shared theme', () => {
  const html = text('../public/about/index.html')
  const page = text('../public/about/about-page.js')
  const passage = text('../public/about/passage.js')
  assert.match(html, /<h1 id="name">Sanam Rai/)
  assert.doesNotMatch(html, /id="root"/)
  assert.match(html, /class="intro-orbit".*aria-hidden="true"/)
  assert.match(page, /sanam-cube-theme/)
  assert.match(page, /\/cube-preview\?from=about/)
  assert.match(passage, /prefers-reduced-motion/)
  assert.match(passage, /event\.metaKey/)
  assert.match(passage, /window\.location\.assign/)
  assert.match(passage, /pageshow/)
})
