import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { GALAXY_TEXTURES } from '../src/pages/Galaxy/data/photorealAssets.js'

const origin = 'http://127.0.0.1:4173'
const output = 'artifacts/galaxy-visual'
const views = [
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'laptop', width: 1280, height: 800, mobile: false },
  { name: 'phone', width: 390, height: 844, mobile: true },
]
const motionViews = [
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'phone', width: 390, height: 844, mobile: true },
]
const rotatingBodies = ['Identity', 'Skills', 'Projects', 'Journey']
const runLongProjectsRotation = process.env.GALAXY_LONG_ROTATION === 'true'

await mkdir(output, { recursive: true })
let serverReady = false
for (let attempt = 0; attempt < 40; attempt++) {
  try {
    if ((await fetch(origin)).ok) { serverReady = true; break }
  } catch { /* Preview is still starting. */ }
  await new Promise(resolve => setTimeout(resolve, 250))
}
if (!serverReady) throw new Error('Vite preview did not start within 10 seconds')

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })
const results = []
let failed = false

// Screenshots alone can silently accept a procedural fallback after an HTTP 404.
// Require the real tier-specific NASA texture payloads in each fresh browser context.
function watchEarthTextureResponses(page, mobile) {
  const earth = GALAXY_TEXTURES.earth
  const expected = mobile
    ? [earth.dayLow, earth.night, earth.cloud]
    : [earth.dayHigh, earth.night, earth.cloud, earth.water, earth.elevation]
  const found = new Map()
  page.on('response', response => {
    const pathname = new URL(response.url()).pathname
    if (expected.includes(pathname)) {
      found.set(pathname, {
        status: response.status(),
        type: response.headers()['content-type'] || '',
      })
    }
  })
  return () => {
    const invalid = expected.filter(path => {
      const response = found.get(path)
      const expectedType = path.endsWith('.png') ? 'image/png' : 'image/jpeg'
      return !response || response.status !== 200 || !response.type.toLowerCase().startsWith(expectedType)
    })
    if (invalid.length) throw new Error('NASA Earth image loads missing/invalid: '
      + invalid.map(path => path + ' ' + JSON.stringify(found.get(path) || 'no response')).join('; '))
    return expected.map(path => ({ path, ...found.get(path) }))
  }
}

// Prove the Journey screenshot contains the vendored Saturn atlas, not merely
// a successfully rendered deterministic fallback after a 404.
function watchSaturnTextureResponse(page) {
  const path = GALAXY_TEXTURES.journey
  let found = null
  page.on('response', response => {
    if (new URL(response.url()).pathname === path) {
      found = { path, status: response.status(), type: response.headers()['content-type'] || '' }
    }
  })
  return () => {
    if (!found || found.status !== 200 || !found.type.toLowerCase().startsWith('image/jpeg')) {
      throw new Error('Saturn photographic atlas missing/invalid: ' + JSON.stringify(found || path))
    }
    return found
  }
}

// Prove Mars art direction actually uses the vendored photographic atlas.
function watchMarsTextureResponse(page) {
  const path = GALAXY_TEXTURES.projects
  let found = null
  page.on('response', response => {
    if (new URL(response.url()).pathname === path) {
      found = { path, status: response.status(), type: response.headers()['content-type'] || '' }
    }
  })
  return () => {
    if (!found || found.status !== 200 || !found.type.toLowerCase().startsWith('image/jpeg')) {
      throw new Error('Mars photographic atlas missing/invalid: ' + JSON.stringify(found || path))
    }
    return found
  }
}

// Prove the Skills globe uses the actual locally credited Mercury atlas.
// A successful WebGL fallback is NOT evidence that the photographic map loaded.
function watchMercuryTextureResponse(page) {
  const path = GALAXY_TEXTURES.skills
  let found = null
  page.on('response', response => {
    if (new URL(response.url()).pathname === path) {
      found = { path, status: response.status(), type: response.headers()['content-type'] || '' }
    }
  })
  return () => {
    if (!found || found.status !== 200 || !found.type.toLowerCase().startsWith('image/jpeg')) {
      throw new Error('Mercury photographic atlas missing/invalid: ' + JSON.stringify(found || path))
    }
    return found
  }
}

function attachErrors(page, errors) {
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
}

async function openGalaxy(page) {
  await page.goto(`${origin}/galaxy`, { waitUntil: 'networkidle' })
  await page.locator('.GalaxyScene canvas').waitFor()
  await page.locator('.GalaxyLoading').waitFor({ state: 'hidden' })
  if (await page.locator('.GalaxyFallbackNote').count()) throw new Error('WebGL fallback was displayed')
}

const bodyOrder = [
  ['Core', 'core'],
  ['Identity', 'identity'],
  ['Skills', 'skills'],
  ['Projects', 'projects'],
  ['Journey', 'journey'],
  ['The Lab', 'lab'],
  ['Black Hole', 'black-hole'],
]

async function selectBody(page, name) {
  const index = bodyOrder.findIndex(([label]) => label === name)
  if (index < 0) throw new Error('Unknown Galaxy body: ' + name)

  const stage = page.locator('.GalaxyStage')
  await stage.focus()
  await page.keyboard.press('Home')
  for (let step = 0; step < index; step++) await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Enter')

  const [, id] = bodyOrder[index]
  await page.waitForFunction(expected => window.location.pathname === '/galaxy/' + expected, id)
  await page.waitForFunction(() => document.querySelector('.GalaxyTargetLabel .GalaxyEyebrow')?.textContent === 'Signal locked')
}

async function createCaptureContext(view, reducedMotion) {
  const context = await browser.newContext({
    viewport: { width: view.width, height: view.height },
    deviceScaleFactor: 1,
    isMobile: view.mobile,
    hasTouch: view.mobile,
    reducedMotion,
  })
  // Hosted runners often expose <=4 logical CPUs, which legitimately selects
  // the app's low-power profile. For visual acceptance we need the named
  // desktop/laptop captures to exercise the high-quality path deliberately.
  if (!view.mobile) {
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'deviceMemory', { configurable: true, get: () => 8 })
      Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, get: () => 8 })
    })
  }
  return context
}

try {
  for (const view of views) {
    const context = await createCaptureContext(view, 'reduce')
    if (view.name === 'desktop') {
      await context.addInitScript(() => {
        const NativeContext = window.AudioContext
        window.__galaxyAudioCreated = 0
        if (NativeContext) {
          window.AudioContext = class ObservedAudioContext extends NativeContext {
            constructor(...args) {
              super(...args)
              window.__galaxyAudioCreated++
            }
          }
        }
      })
    }
    const page = await context.newPage()
    const errors = []
    attachErrors(page, errors)
    const verifyEarthAssets = watchEarthTextureResponses(page, view.mobile)
    const verifyMarsAsset = watchMarsTextureResponse(page)
    const verifyMercuryAsset = watchMercuryTextureResponse(page)
    const verifySaturnAsset = watchSaturnTextureResponse(page)

    try {
      await openGalaxy(page)
      const earthAssets = verifyEarthAssets()
      const marsAsset = verifyMarsAsset()
      const mercuryAsset = verifyMercuryAsset()
      const saturnAsset = verifySaturnAsset()
      await page.screenshot({ path: `${output}/${view.name}-overview.png`, fullPage: true })

      if (view.name === 'desktop') {
        const sound = page.locator('.GalaxySoundGlyph')
        assert.equal(await sound.getAttribute('aria-pressed'), 'false')
        assert.equal(await page.evaluate(() => window.__galaxyAudioCreated), 0,
          'Galaxy must create no AudioContext before a user gesture')
      }

      await selectBody(page, 'Identity')

      if (view.name === 'desktop') {
        const sound = page.locator('.GalaxySoundGlyph')
        await page.waitForFunction(() =>
          document.querySelector('.GalaxySoundGlyph')?.getAttribute('aria-pressed') === 'true')
        assert.equal(await page.evaluate(() => window.__galaxyAudioCreated), 1,
          'first world interaction creates exactly one AudioContext')
        await page.screenshot({ path: `${output}/desktop-sound-active.png`, fullPage: true })

        await sound.click()
        await page.waitForFunction(() =>
          document.querySelector('.GalaxySoundGlyph')?.getAttribute('aria-pressed') === 'false')
        await sound.click()
        await page.waitForFunction(() =>
          document.querySelector('.GalaxySoundGlyph')?.getAttribute('aria-pressed') === 'true')
        assert.equal(await page.evaluate(() => window.__galaxyAudioCreated), 1,
          'mute/re-enable must reuse the existing AudioContext')
      }

      await page.screenshot({ path: `${output}/${view.name}-identity-reduced.png`, fullPage: true })
      await selectBody(page, 'Projects')
      await page.locator('.ProjectsContent.is-revealed').waitFor()
      await page.screenshot({ path: `${output}/${view.name}-projects.png`, fullPage: true })
      await page.locator('.ProjectsDirectory').getByRole('button', { name: /StateScout/ }).click()
      await page.screenshot({ path: `${output}/${view.name}-projects-statescout.png`, fullPage: true })
      // Mercury also needs direct reduced-motion focus proof; previous visual
      // captures only recorded its normal-motion pass through rotatingBodies.
      await selectBody(page, 'Skills')
      await page.waitForTimeout(350)
      await page.screenshot({ path: `${output}/${view.name}-skills-reduced.png`, fullPage: true })
      await selectBody(page, 'Core')
      await page.locator('.CoreIdentity.is-revealed').waitFor()
      await page.screenshot({ path: `${output}/${view.name}-core-immediate.png`, fullPage: true })
      // A paused WebGL canvas can be captured before the compositor presents
      // the frame scheduled by the resize/layout change. Keep both captures
      // so a true blank Core remains distinguishable from a screenshot race.
      await page.waitForTimeout(500)
      await page.screenshot({ path: `${output}/${view.name}-core.png`, fullPage: true })
      // G2R.6: retain the ring-focused reduced-motion evidence at each size.
      await selectBody(page, 'Journey')
      await page.locator('.JourneyContent.is-revealed').waitFor()
      await page.screenshot({ path: `${output}/${view.name}-journey-reduced.png`, fullPage: true })
      await page.locator('.JourneyPath').getByRole('button', { name: /Production Systems/ }).click()
      await page.screenshot({ path: `${output}/${view.name}-journey-production-systems.png`, fullPage: true })
      await page.locator('.JourneyPath').getByRole('button', { name: /Research & Exploration/ }).click()
      assert.deepEqual(
        await page.locator('.JourneyConnections a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href'))),
        ['/galaxy/projects/statescout', '/galaxy/projects/reality-archive'],
      )
      await page.screenshot({ path: `${output}/${view.name}-journey-research-links.png`, fullPage: true })
      await selectBody(page, 'The Lab')
      await page.locator('.LabContent.is-revealed').waitFor()
      await page.screenshot({ path: `${output}/${view.name}-lab-reduced.png`, fullPage: true })
      await page.locator('.LabConsole').getByRole('button', { name: /Interface State Exploration/ }).click()
      assert.equal(
        await page.locator('.LabDetail .GalaxySemanticLink').getAttribute('href'),
        '/galaxy/projects/statescout',
      )
      await page.screenshot({ path: `${output}/${view.name}-lab-state-space.png`, fullPage: true })

      const layout = await page.evaluate(() => ({
        width: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        canvasWidth: document.querySelector('.GalaxyScene canvas')?.width,
        canvasHeight: document.querySelector('.GalaxyScene canvas')?.height,
        deviceMemory: navigator.deviceMemory,
        hardwareConcurrency: navigator.hardwareConcurrency,
        coarsePointer: window.matchMedia('(pointer: coarse)').matches,
      }))
      if (layout.documentWidth > layout.width + 1) errors.push(`Horizontal overflow: ${layout.documentWidth} > ${layout.width}`)
      if (!layout.canvasWidth || !layout.canvasHeight) errors.push('Blank canvas dimensions')
      results.push({ view, layout, earthAssets, saturnAsset, marsAsset, mercuryAsset, errors })
    } catch (error) {
      results.push({ view, errors: [...errors, error.message] })
    } finally {
      await context.close()
    }
    if (results.at(-1).errors.length) failed = true
  }

  // G3 release gate: prove the stable semantic URLs work after a fresh browser
  // navigation, not only after in-app selection. Black Hole is covered by the
  // dedicated portal browser suite because direct focus intentionally commits.
  {
    const context = await createCaptureContext({ name: 'desktop', width: 1440, height: 900, mobile: false }, 'reduce')
    const page = await context.newPage()
    const errors = []
    attachErrors(page, errors)

    const routes = [
      ['core', '.CoreIdentity.is-revealed'],
      ['identity', '.IdentityContent.is-revealed'],
      ['skills', '.SkillsContent.is-revealed'],
      ['projects', '.ProjectsContent.is-revealed'],
      ['journey', '.JourneyContent.is-revealed'],
      ['lab', '.LabContent.is-revealed'],
    ]

    try {
      for (const [id, selector] of routes) {
        await page.goto(`${origin}/galaxy/${id}`, { waitUntil: 'networkidle' })
        await page.locator('.GalaxyScene canvas').waitFor()
        await page.locator('.GalaxyLoading').waitFor({ state: 'hidden' })
        await page.locator(selector).waitFor()
        assert.equal(new URL(page.url()).pathname, `/galaxy/${id}`)
        assert.equal(
          await page.locator('.GalaxyTargetLabel .GalaxyEyebrow').textContent(),
          'Signal locked',
          `direct route ${id} must settle on the semantic destination`,
        )
      }

      // G4A defines project-detail URLs as first-class semantic routes.
      await page.goto(`${origin}/galaxy/projects/statescout`, { waitUntil: 'networkidle' })
      await page.locator('.ProjectCaseStudy').waitFor()
      assert.equal(new URL(page.url()).pathname, '/galaxy/projects/statescout')
      assert.equal(
        await page.locator('#project-case-title').textContent(),
        'StateScout',
      )
      assert.equal(await page.title(), 'StateScout | Galaxy | Sanam Rai')
      assert.match(
        await page.locator('meta[name="description"]').getAttribute('content'),
        /semantic state-graph explorer/,
      )
      await page.screenshot({
        path: `${output}/desktop-project-detail-direct-statescout.png`,
        fullPage: true,
      })

      // Real browser history retains compact world retargeting, while project
      // detail adds exactly one nested level: Back returns to Mars, Forward
      // restores the case study, and Escape/System returns to overview.
      await openGalaxy(page)
      await selectBody(page, 'Skills')
      await selectBody(page, 'Projects')
      assert.equal(new URL(page.url()).pathname, '/galaxy/projects')
      const projectHistoryLength = await page.evaluate(() => history.length)

      await page.locator('.ProjectsDirectory').getByRole('button', { name: /StateScout/ }).click()
      await page.waitForURL(`${origin}/galaxy/projects/statescout`)
      await page.locator('.ProjectCaseStudy').waitFor()
      assert.equal(
        await page.evaluate(() => history.length),
        projectHistoryLength + 1,
        'project detail adds one nested browser-history entry',
      )

      await page.locator('.ProjectsDirectory').getByRole('button', { name: /Reality Archive/ }).click()
      await page.waitForURL(`${origin}/galaxy/projects/reality-archive`)
      assert.equal(
        await page.evaluate(() => history.length),
        projectHistoryLength + 1,
        'switching projects must replace the detail entry',
      )

      await page.goBack()
      await page.waitForURL(`${origin}/galaxy/projects`)
      await page.locator('.ProjectsContent.is-revealed').waitFor()
      assert.equal(await page.locator('.ProjectCaseStudy').count(), 0)

      await page.goForward()
      await page.waitForURL(`${origin}/galaxy/projects/reality-archive`)
      await page.locator('.ProjectCaseStudy').waitFor()

      await page.keyboard.press('Escape')
      await page.waitForURL(`${origin}/galaxy`)
      assert.equal(await page.locator('.GalaxyBack').count(), 0)

      if (errors.length) throw new Error('Browser errors: ' + errors.join('; '))
      results.push({
        view: 'G4 direct project routes + nested browser history',
        routes: routes.map(([id]) => `/galaxy/${id}`),
        projectRoute: '/galaxy/projects/statescout',
        projectRetarget: 'StateScout -> Reality Archive replaces detail history',
        nestedHistory: 'detail Back -> /galaxy/projects; Forward -> detail; Escape -> /galaxy',
        errors,
      })
    } catch (error) {
      results.push({ view: 'G4 direct project routes + nested browser history', errors: [...errors, error.message] })
    } finally {
      await context.close()
    }
    if (results.at(-1).errors.length) failed = true
  }

  // G2R.1: prove every primary planet has visible local motion in both desktop
  // and phone compositions. Eight seconds is long enough to expose movement
  // without turning the visual gate into a long-running animation test.
  for (const view of motionViews) {
    const context = await createCaptureContext(view, 'no-preference')
    const page = await context.newPage()
    const errors = []
    attachErrors(page, errors)
    const verifyEarthAssets = watchEarthTextureResponses(page, view.mobile)
    const verifyMarsAsset = watchMarsTextureResponse(page)
    const verifyMercuryAsset = watchMercuryTextureResponse(page)
    try {
      await openGalaxy(page)
      const earthAssets = verifyEarthAssets()
      const marsAsset = verifyMarsAsset()
      const mercuryAsset = verifyMercuryAsset()
      // G2R.5: normal-motion overview is essential for comparing near/far
      // star depth; reduced-motion overview is already captured above.
      await page.screenshot({ path: `${output}/${view.name}-overview-normal.png`, fullPage: true })
      // Distinguish overview revolution from mere surface spin: matched
      // before/after camera captures while no planet is selected.
      await page.waitForTimeout(8_000)
      await page.screenshot({ path: `${output}/${view.name}-overview-revolution-after-8s.png`, fullPage: true })
      await selectBody(page, 'Core')
      await page.locator('.CoreIdentity.is-revealed').waitFor()
      await page.screenshot({ path: `${output}/${view.name}-core-motion-start.png`, fullPage: true })
      await page.waitForTimeout(8_000)
      await page.screenshot({ path: `${output}/${view.name}-core-motion-after-8s.png`, fullPage: true })
      for (const body of rotatingBodies) {
        await selectBody(page, body)
        const slug = body.toLowerCase()
        await page.screenshot({ path: `${output}/${view.name}-${slug}-motion-start.png`, fullPage: true })
        await page.waitForTimeout(8_000)
        await page.screenshot({ path: `${output}/${view.name}-${slug}-motion-after-8s.png`, fullPage: true })
      }
      results.push({ view: `${view.name} normal-motion hero Sun + primary planets`, bodies: ['Core', ...rotatingBodies], earthAssets, marsAsset, mercuryAsset, sampleSeconds: 8, errors })
    } catch (error) {
      results.push({ view: `${view.name} normal-motion primary planets`, errors: [...errors, error.message] })
    } finally {
      await context.close()
    }
    if (results.at(-1).errors.length) failed = true
  }

  // The full-turn Projects seam proof is intentionally expensive. Preserve it
  // as a manual verification option instead of re-running ~140 seconds on
  // unrelated Sun/Identity/Skills/Journey commits.
  if (runLongProjectsRotation) {
    const context = await createCaptureContext({ name: 'desktop', width: 1440, height: 900, mobile: false }, 'no-preference')
    const page = await context.newPage()
    const errors = []
    attachErrors(page, errors)
    try {
      await openGalaxy(page)
      await selectBody(page, 'Projects')
      for (let phase = 0; phase < 8; phase++) {
        if (phase) await page.waitForTimeout(20_000)
        await page.screenshot({ path: `${output}/projects-turn-${phase}.png`, fullPage: true })
      }
      results.push({ view: 'desktop animated Projects, eight frames over 140 seconds', errors })
    } catch (error) {
      results.push({ view: 'desktop animated Projects', errors: [...errors, error.message] })
    } finally {
      await context.close()
    }
    if (results.at(-1).errors.length) failed = true
  } else {
    results.push({ view: 'Projects long rotation proof', skipped: true, reason: 'manual long_rotation option not requested', errors: [] })
  }
} finally {
  await browser.close()
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2))
}

if (failed) {
  console.error(JSON.stringify(results, null, 2))
  process.exitCode = 1
} else console.log(JSON.stringify(results, null, 2))
