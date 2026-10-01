import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

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

async function selectBody(page, name) {
  await page.getByRole('button', { name, exact: true }).click()
  await page.waitForFunction(() => document.querySelector('.GalaxyMapHeading span:last-child')?.textContent === 'Signal locked')
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
    const page = await context.newPage()
    const errors = []
    attachErrors(page, errors)

    try {
      await openGalaxy(page)
      await page.screenshot({ path: `${output}/${view.name}-overview.png`, fullPage: true })
      await selectBody(page, 'Projects')
      await page.screenshot({ path: `${output}/${view.name}-projects.png`, fullPage: true })
      await selectBody(page, 'Core')
      await page.locator('.CoreIdentity.is-revealed').waitFor()
      await page.screenshot({ path: `${output}/${view.name}-core-immediate.png`, fullPage: true })
      // A paused WebGL canvas can be captured before the compositor presents
      // the frame scheduled by the resize/layout change. Keep both captures
      // so a true blank Core remains distinguishable from a screenshot race.
      await page.waitForTimeout(500)
      await page.screenshot({ path: `${output}/${view.name}-core.png`, fullPage: true })
      // G2R.7: reduced-motion black-hole focus is selectable with no portal.
      await selectBody(page, 'Black Hole')
      await page.screenshot({ path: `${output}/${view.name}-black-hole-reduced.png`, fullPage: true })
      // G2R.6: retain the ring-focused reduced-motion evidence at each size.
      await selectBody(page, 'Journey')
      await page.screenshot({ path: `${output}/${view.name}-journey-reduced.png`, fullPage: true })

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
      results.push({ view, layout, errors })
    } catch (error) {
      results.push({ view, errors: [...errors, error.message] })
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
    try {
      await openGalaxy(page)
      // G2R.5: normal-motion overview is essential for comparing near/far
      // star depth; reduced-motion overview is already captured above.
      await page.screenshot({ path: `${output}/${view.name}-overview-normal.png`, fullPage: true })
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
      // G2R.7: dedicated normal-motion focus evidence (no G2R.8 plunge yet).
      await selectBody(page, 'Black Hole')
      await page.screenshot({ path: `${output}/${view.name}-black-hole-motion-start.png`, fullPage: true })
      await page.waitForTimeout(8_000)
      await page.screenshot({ path: `${output}/${view.name}-black-hole-motion-after-8s.png`, fullPage: true })
      results.push({ view: `${view.name} normal-motion hero Sun, primary planets + black hole`, bodies: ['Core', ...rotatingBodies, 'Black Hole'], sampleSeconds: 8, errors })
    } catch (error) {
      results.push({ view: `${view.name} normal-motion primary planets`, errors: [...errors, error.message] })
    } finally {
      await context.close()
    }
    if (results.at(-1).errors.length) failed = true
  }

  // G2R.8B: exercise the *actual* Enter action and hold the destination
  // response briefly. This leaves the original document alive long enough
  // to prove the covering veil is opaque BEFORE the browser changes routes.
  for (const scenario of [
    { view: motionViews[0], reducedMotion: 'no-preference', staticView: false },
    { view: views[2], reducedMotion: 'reduce', staticView: true },
  ]) {
    const { view, reducedMotion, staticView } = scenario
    const context = await createCaptureContext(view, reducedMotion)
    const page = await context.newPage()
    const errors = []
    attachErrors(page, errors)
    let releaseRoot = () => {}
    try {
      await openGalaxy(page)
      if (staticView) await page.getByRole('button', { name: 'Still view' }).click()
      await page.getByRole('button', { name: 'Black Hole', exact: true }).click()
      const enter = page.getByRole('button', { name: /Enter the horizon/i })
      await enter.waitFor()

      let routeCount = 0
      let routeResolve
      const routeRequested = new Promise(resolve => { routeResolve = resolve })
      const routeGate = new Promise(resolve => { releaseRoot = resolve })
      await page.route(`${origin}/`, async route => {
        if (route.request().isNavigationRequest()) {
          routeCount += 1
          routeResolve(route.request().url())
          await routeGate
        }
        await route.continue()
      })

      await enter.click({ noWaitAfter: true })
      if (!staticView) {
        await page.locator('.GalaxyPortalVeil.is-approach').waitFor()
        await page.locator('.GalaxyPortalVeil.is-plunge').waitFor()
        if (new URL(page.url()).pathname !== '/galaxy') errors.push('Portal navigated before the plunge/blackout')
        await page.screenshot({ path: `${output}/${view.name}-portal-plunge.png`, fullPage: true })
      }
      await page.waitForFunction(() => {
        const veil = document.querySelector('.GalaxyPortalVeil')
        return veil && ['blackout', 'committed'].includes(veil.dataset.portalPhase)
          && Number.parseFloat(getComputedStyle(veil).opacity) >= .999
      }, null, { timeout: 10_000 })
      const coverage = await page.evaluate(() => {
        const veil = document.querySelector('.GalaxyPortalVeil')
        const box = veil.getBoundingClientRect()
        return {
          phase: veil.dataset.portalPhase,
          opacity: Number.parseFloat(getComputedStyle(veil).opacity),
          covers: box.left <= 0 && box.top <= 0
            && box.width >= innerWidth && box.height >= innerHeight,
        }
      })
      await page.screenshot({ path: `${output}/${view.name}-portal-blackout.png`, fullPage: true })
      const request = await Promise.race([
        routeRequested,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Portal never requested destination route')), 7_000)),
      ])
      if (new URL(request).pathname !== '/') errors.push(`Unexpected destination: ${request}`)
      if (coverage.opacity < .999 || !coverage.covers) errors.push('Destination was requested before full opaque coverage')
      releaseRoot()
      await page.waitForURL(`${origin}/`, { timeout: 10_000 })
      await page.locator('.GalaxyPage').waitFor({ state: 'detached', timeout: 5_000 })
      if (routeCount !== 1) errors.push(`Expected one portal route request, received ${routeCount}`)
      results.push({ view: `${view.name} portal ${staticView ? 'static/reduced' : 'cinematic'}`,
        destination: page.url(), coverage, routeCount, errors })
    } catch (error) {
      results.push({ view: `${view.name} portal ${staticView ? 'static/reduced' : 'cinematic'}`,
        errors: [...errors, error.message] })
    } finally {
      releaseRoot()
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
