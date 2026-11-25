import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { CUBE_PREVIEW_PATH, cubeUrl, readCubeView, portalDuration, WORK_MOTION } from '../src/pages/CubePortal/cubePortalNavigation.js'
import { worldFracturePaths } from '../src/pages/CubePortal/worldFracture.mjs'

import { routeFamily, journeyOrigin, canAnimateLink, READY_LIMIT_MS } from '../src/motion/useJourneyTransition.js'
import { passageKind, passageGeometry, PASSAGE_TIMING } from '../public/about/passage.js'
import { CUBE_FRAGMENTS, LEGACY_CUBE_FRAGMENTS, FRACTURE_PARTICLES, FRACTURE_CRACKS, FRACTURE_LIMITS, polygonArea, polygonSpan, fractureCells, selectFracture, artworkViewport, viewportFlight } from '../src/pages/CubePortal/cubeFragments.js'
import { WORK_PROJECTS } from '../src/pages/CubePortal/workProjects.js'

const at = relative => fileURLToPath(new URL(relative, import.meta.url))
const text = relative => readFileSync(at(relative), 'utf8')

test('cube preview hash route and reduced motion are deterministic', () => {
  assert.equal(CUBE_PREVIEW_PATH, '/cube-preview')
  assert.equal(readCubeView('#work'), 'work')
  assert.equal(readCubeView('#home'), 'home')
  assert.equal(readCubeView('#garbage'), 'home')
  assert.equal(cubeUrl('work'), '/#work')
  assert.equal(cubeUrl('home'), '/#home')
  assert.equal(cubeUrl('work', '/cube-preview'), '/cube-preview#work')
  assert.equal(portalDuration('work', true), 0)
  assert.equal(portalDuration('work', false), 700)
  assert.equal(portalDuration('home', false), 650)
})

test('canonical cube homepage retains the preview alias and Galaxy', () => {
  const routes = text('../src/PortfolioRoutes.jsx')
  assert.match(routes, /const Portfolio = lazy\(/)
  assert.match(routes, /const Galaxy = lazy\(/)
  assert.match(routes, /const CubePortalPreview = lazy\(/)
  assert.match(routes, /cubePreview \? <Cube journey=\{journey\} artworkUrl=\{artworkUrl\} \/> : <Portfolio labPreview=/)
  const vercel = JSON.parse(text('../vercel.json'))
  assert.deepEqual(vercel.rewrites.find(x => x.source === '/cube-preview'), {source:'/cube-preview',destination:'/app-shell.html'})
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
  assert.match(scene, /fragments\.map/)
  assert.ok(CUBE_FRAGMENTS.length>20)
  assert.equal(new Set(CUBE_FRAGMENTS.map(piece => piece.id)).size,CUBE_FRAGMENTS.length)
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
  assert.match(cubeScene, /MODEL_REVISION = 'original-artwork-fracture-v7'/)
  assert.match(cubeScene, /data-fractured=\{open\}/)
  assert.match(cubeScene, /data-split=\{split\}/)
  assert.match(cubeScene, /cubeDebug/)
  assert.match(jsx, /highlightedDestination/)
  assert.match(jsx, /CubePortalGlimpse/)
  assert.match(jsx, /--portal-x/)
  assert.match(text('../src/pages/CubePortal/CubePortal.css'), /cubePortalChapterEnter/)
  assert.match(jsx, /noindex, nofollow/)
  assert.match(jsx, /\/lab\?from=cube/)
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
  assert.equal(routeFamily('/'), 'cube')
  assert.equal(routeFamily('/cube-preview/'), 'cube')
  assert.equal(routeFamily('/lab'), 'portfolio')
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
  assert.match(page, /\/\?from=about/)
  assert.match(passage, /prefers-reduced-motion/)
  assert.match(passage, /event\.metaKey/)
  assert.match(passage, /window\.location\.assign/)
  assert.match(passage, /pageshow/)
})

test('Lab preview has its own non-indexable entry and retains shared live components', () => {
  const config = JSON.parse(text('../vercel.json'))
  assert.ok(config.rewrites.some(rule => rule.source === '/lab' && rule.destination === '/app-shell.html'))
  assert.ok(config.rewrites.some(rule => rule.source === '/lab-preview' && rule.destination === '/app-shell.html'))
  assert.ok(config.headers.some(rule => rule.source === '/lab-preview' && rule.headers.some(h => h.key === 'X-Robots-Tag' && h.value === 'noindex, nofollow')))
  const app = text('../src/App.jsx')
  for (const component of ['SystemControl', 'Logs', 'Projects', 'Form']) assert.match(app, new RegExp('<' + component + ' '))
  assert.match(app, /labPreview = false/)
})

test('editorial and technical passages are explicit, bounded and do not intercept Galaxy', () => {
  for (const [route,kind] of [['/about','about'],['/lab-preview','lab']]) {
    assert.equal(passageKind('/cube-preview',route,'cube'),kind)
    assert.equal(passageKind('/',route,'cube'),kind)
    assert.equal(passageKind(route,'/',kind),kind)
    assert.equal(passageKind(route,'/cube-preview',kind),kind)
    assert.equal(passageKind(route,'/cube-preview','cube'),null)
    assert.ok(PASSAGE_TIMING[kind].departure + PASSAGE_TIMING[kind].arrival <= 1100)
  }
  assert.equal(passageKind('/cube-preview','/galaxy','cube'),null)
  assert.equal(passageKind('/cube-preview','/about',null),null)
  assert.equal(passageKind('/lab-preview','/about','cube'),null)
  for (const [width,height] of [[390,844],[1440,900]]) {
    const {x,y,radius} = passageGeometry({left:width-80,top:height-200,width:100,height:100},width,height)
    for (const cx of [0,width]) for (const cy of [0,height]) assert.ok(radius > Math.hypot(cx-x,cy-y))
  }
  assert.deepEqual(passageGeometry(null,100,100),{x:50,y:50,radius:103})
})

test('fracture has independent outward vectors and reversible keyframes', () => {
  assert.equal(new Set(CUBE_FRAGMENTS.map(p=>p.dx+','+p.dy)).size,CUBE_FRAGMENTS.length)
  for(const piece of CUBE_FRAGMENTS) {
    assert.ok(Math.hypot(piece.dx,piece.dy)>50)
    assert.ok(piece.d.startsWith('M') && piece.d.endsWith('Z'))
  }
  const css = text('../src/pages/CubePortal/CubePortal.css')
  assert.match(css, /stoneSeparate/)
  assert.match(css, /stoneReconstruct/)
  assert.match(css, /cube-mountains\.svg/)
  assert.match(text('../public/cube-mountains.svg'), /id="mist"/)
  const passage = text('../public/about/passage.js')
  assert.match(passage, /ChapterPassageLine/)
  assert.match(passage, /ChapterPassageBloom/)
  assert.match(passage, /inset\(50% 0 50% 0\)/)
  assert.doesNotMatch(passage, /ChapterPassageMotif/)
})

test('detailed fracture partitions the exact source square and preserves a seven-piece fallback', () => {
  const cells = fractureCells()
  const area = polygon => Math.abs(polygon.reduce((sum,p,i) => {
    const q=polygon[(i+1)%polygon.length]
    return sum+p[0]*q[1]-q[0]*p[1]
  },0))/2
  assert.equal(cells.length,CUBE_FRAGMENTS.length)
  for(const cell of cells) {
    assert.ok(cell.length>=3)
    assert.ok(area(cell)>0)
    assert.ok(cell.flat().every(v=>v>=0 && v<=1254))
  }
  assert.ok(Math.abs(cells.reduce((sum,p)=>sum+area(p),0)-1254**2)<3)
  assert.ok(CUBE_FRAGMENTS.some(p=>p.heavy) && CUBE_FRAGMENTS.some(p=>!p.heavy))
  assert.ok(Math.max(...CUBE_FRAGMENTS.filter(p=>!p.heavy).map(p=>p.delay)) <= Math.min(...CUBE_FRAGMENTS.filter(p=>p.heavy).map(p=>p.delay)))
  assert.ok(Math.max(...CUBE_FRAGMENTS.filter(p=>p.heavy).map(p=>p.returnDelay)) <= Math.min(...CUBE_FRAGMENTS.filter(p=>!p.heavy).map(p=>p.returnDelay)))
  assert.equal(FRACTURE_PARTICLES.length,8)
  assert.equal(LEGACY_CUBE_FRAGMENTS.length,7)
  assert.equal(selectFracture('?fracture=7'),LEGACY_CUBE_FRAGMENTS)
  assert.equal(selectFracture(''),CUBE_FRAGMENTS)
})

test('irregular fracture is governed by size, not a target count', () => {
  const counts=new Set()
  for(const seed of [48,71,123,193,724,20261125]) {
    const cells=fractureCells(seed)
    const areas=cells.map(polygonArea)
    counts.add(cells.length)
    assert.ok(Math.abs(areas.reduce((a,b)=>a+b,0)-1254**2)<3)
    assert.ok(Math.max(...areas)<=FRACTURE_LIMITS.maxArea+.5)
    assert.ok(Math.max(...cells.map(polygonSpan))<=FRACTURE_LIMITS.maxSpan+.005)
    assert.ok(Math.max(...areas)/Math.min(...areas)>5,'Pieces need substantial area variation')
    assert.ok(new Set(cells.map(p=>p.length)).size>=3,'Different polygon shapes')
    assert.deepEqual(fractureCells(seed),cells,'A seed must reconstruct consistently')
  }
  assert.ok(counts.size>1,'No fixed fragment count')
})

test('cinematic fracture reserves a distinct pressure, rupture and reveal interval', () => {
  assert.ok(WORK_MOTION.revealAt>Math.max(...CUBE_FRAGMENTS.map(p=>p.delay))+100)
  assert.ok(WORK_MOTION.revealAt<WORK_MOTION.open)
  assert.ok(WORK_MOTION.collapseBy<WORK_MOTION.close*.5)
  assert.ok(Math.max(...CUBE_FRAGMENTS.map(p=>p.returnDelay))<WORK_MOTION.close*.5)
  assert.ok(CUBE_FRAGMENTS.some(p=>p.scale>1.2))
  assert.ok(CUBE_FRAGMENTS.some(p=>p.scale<.85))
  assert.equal(FRACTURE_CRACKS.length,3)
  assert.ok(FRACTURE_CRACKS.every(p=>p.startsWith('M')))
  const css=text('../src/pages/CubePortal/CubePortal.css')
  for(const name of ['stonePressure','crackPropagate','coreBreach','stoneReconstruct','coreSeal','stoneIntactIn'])assert.ok(css.includes('@keyframes '+name))
})

test('viewport flights reach edges on desktop and mobile, without changing source geometry', () => {
  for(const [width,height,rect] of [
    [1440,900,{left:740,top:170,width:560,height:470}],
    [390,844,{left:45,top:300,width:300,height:330}],
    [390,844,{left:45,top:-20,width:300,height:330}],
  ]){
    const origin=artworkViewport(rect)
    assert.ok(origin.scale>0)
    const flights=CUBE_FRAGMENTS.map(p=>viewportFlight(p,rect,width,height))
    for(const f of flights){
      assert.ok([f.dx,f.dy,f.targetX,f.targetY].every(Number.isFinite))
      assert.ok(Math.min(Math.abs(f.targetX),Math.abs(width-f.targetX),Math.abs(f.targetY),Math.abs(height-f.targetY)) <= Math.max(width,height)*.15)
    }
    const xs=flights.map(f=>f.targetX),ys=flights.map(f=>f.targetY)
    assert.ok(Math.max(...xs)-Math.min(...xs)>=width*.90)
    assert.ok(Math.max(...ys)-Math.min(...ys)>=height*.90)
  }
  assert.ok(WORK_MOTION.open<=750 && WORK_MOTION.close<=750)
})

test('world fracture paths are deterministic and span the viewport', () => {
  for (const [width,height,x,y] of [[1440,900,990,420],[390,844,195,540],[390,844,195,-20],[1920,1080,0,0]]) {
    const flight={width,height,x,y}
    const paths=worldFracturePaths(flight)
    assert.equal(paths.length,24)
    assert.equal(new Set(paths.map(p=>p.id)).size,24)
    assert.deepEqual(paths,worldFracturePaths(flight))
    for(const {d} of paths) {
      const numbers=d.match(/-?\d+(?:\.\d+)?/g).map(Number)
      for(let i=0;i<numbers.length;i+=2) {
        assert.ok(numbers[i]>=0 && numbers[i]<=width+.01)
        assert.ok(numbers[i+1]>=0 && numbers[i+1]<=height+.01)
      }
    }
    const ends=paths.filter(p=>!p.branch).map(p=>p.d.split(' L').at(-1).split(' ').map(Number))
    assert.equal(ends.length,12)
    assert.ok(ends.every(([a,b])=>a===0||a===width||b===0||b===height))
  }
  assert.deepEqual(worldFracturePaths({width:0,height:1,x:0,y:0}),[])
})
