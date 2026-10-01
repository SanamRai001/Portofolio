import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

// G2R.8C: verify actual user interaction and route handoff without modifying
// production location.assign or guessing that a black screenshot means success.
const origin = process.env.GALAXY_PREVIEW_ORIGIN || 'http://127.0.0.1:4173'
const output = 'artifacts/galaxy-visual'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })
const results = []
const cases = [
  { name: 'desktop-portal', width: 1440, height: 900, mobile: false, reduced: false, cancelFirst: true },
  { name: 'phone-portal', width: 390, height: 844, mobile: true, reduced: false },
  { name: 'phone-reduced-portal', width: 390, height: 844, mobile: true, reduced: true },
  { name: 'desktop-static-portal', width: 1440, height: 900, mobile: false, reduced: false, staticView: true },
]
let failed = false
try {
  for (const variant of cases) {
    const context = await browser.newContext({
      viewport: { width: variant.width, height: variant.height },
      deviceScaleFactor: 1, isMobile: variant.mobile, hasTouch: variant.mobile,
      reducedMotion: variant.reduced ? 'reduce' : 'no-preference',
    })
    if (!variant.mobile) await context.addInitScript(() => {
      Object.defineProperty(navigator, 'deviceMemory', { configurable: true, get: () => 8 })
      Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, get: () => 8 })
    })
    const page = await context.newPage()
    const errors = [], coverage = []
    let handoff = null, requests = 0
    page.on('pageerror', e => errors.push(e.message))
    page.on('console', e => { if (e.type() === 'error') errors.push(e.text()) })
    try {
      await page.goto(origin + '/galaxy', { waitUntil: 'networkidle' })
      await page.locator('.GalaxyScene canvas').waitFor()
      await page.locator('.GalaxyLoading').waitFor({ state: 'hidden' })
      assert.equal(page.url(), origin + '/galaxy')
      if (variant.staticView) {
        await page.getByRole('button', { name: 'Still view' }).click()
        await page.locator('.GalaxyFallback').waitFor()
      }
      const focus = async () => {
        await page.getByRole('button', { name: 'Black Hole', exact: true }).click()
        await page.locator('.GalaxyPortalEnter').waitFor({ state: 'visible' })
        assert.equal(page.url(), origin + '/galaxy', 'mere focus must not navigate')
        assert.equal(await page.locator('.GalaxyPortalVeil').getAttribute('data-portal-phase'), 'idle')
      }
      await focus()
      await page.screenshot({ path: `${output}/${variant.name}-focused.png`, fullPage: true })
      if (variant.cancelFirst) {
        await page.getByRole('button', { name: /Enter the horizon/ }).click({ noWaitAfter: true })
        await page.locator('.GalaxyPortalVeil.is-approach').waitFor()
        await page.waitForTimeout(200)
        await page.screenshot({ path: `${output}/${variant.name}-approach.png`, fullPage: true })
        await page.keyboard.press('Escape')
        await page.locator('.GalaxyPortalVeil.is-idle').waitFor()
        await page.waitForFunction(() => document.querySelector('.GalaxyMapHeading span:last-child')?.textContent === 'Overview')
        assert.equal(page.url(), origin + '/galaxy', 'Escape before blackout must cancel')
        await focus()
      }

      // Observe a native opacity transition at the veil target before the
      // React delegated transition-end handler initiates location.assign.
      await page.exposeFunction('__recordGalaxyPortalCoverage', info => coverage.push(info))
      await page.evaluate(() => {
        const veil = document.querySelector('.GalaxyPortalVeil')
        veil.addEventListener('transitionend', event => {
          if (event.propertyName !== 'opacity' || veil.dataset.portalPhase !== 'blackout') return
          void window.__recordGalaxyPortalCoverage({
            phase: veil.dataset.portalPhase,
            opacity: Number.parseFloat(getComputedStyle(veil).opacity),
            bounds: (() => { const box = veil.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height } })(),
          })
        }, { capture: true, once: false })
      })

      await page.route(origin + '/', async route => {
        requests++
        // Never call page.evaluate() from the top-level navigation route.
        // The old document cannot answer while navigation waits for this
        // handler to fulfil the response; doing so deadlocks the browser.
        // The capture-phase transitionend listener independently records
        // blackout coverage *before* the host calls location.assign().
        handoff = { target: route.request().url() }
        await route.fulfill({ status: 200, contentType: 'text/html',
          body: '<!doctype html><title>Portal destination reached</title><h1 id="portal-arrived">Portal destination reached</h1>' })
      })
      await page.getByRole('button', { name: /Enter the horizon/ }).click({ noWaitAfter: true })
      if (!variant.reduced && !variant.staticView) {
        await page.locator('.GalaxyPortalVeil.is-plunge').waitFor({ timeout: 16000 })
        await page.screenshot({ path: `${output}/${variant.name}-plunge.png`, fullPage: true })
        assert.equal(requests, 0, 'the plunge cannot navigate before blackout')
      }
      await page.waitForURL(origin + '/', { timeout: 20000 })
      assert.equal(await page.locator('#portal-arrived').textContent(), 'Portal destination reached')
      assert.equal(requests, 1, 'navigate to the destination exactly once')
      assert.equal(handoff.target, origin + '/')
      const proof = coverage.find(entry => entry.opacity >= .999)
      assert.ok(proof, 'observe an opaque veil during route handoff')
      assert.ok(['blackout', 'committed'].includes(proof.phase), 'navigation requires blackout phase')
      assert.ok(proof.opacity >= .999, 'black veil must be fully opaque before route commit')
      assert.ok(proof.bounds.width >= variant.width - 1 && proof.bounds.height >= variant.height - 1,
        'blackout must cover the entire viewport')
      if (errors.length) throw new Error('Browser errors: ' + errors.join('; '))
      results.push({ view: variant.name, status: 'passed', requests, handoff,
        opacityTransitionObserved: coverage.length > 0, errors })
    } catch (error) {
      failed = true
      results.push({ view: variant.name, status: 'failed', message: error.message, requests,
        handoff, coverage, errors })
    } finally {
      await context.close()
    }
  }
} finally {
  await browser.close()
  await writeFile(output + '/portal-results.json', JSON.stringify(results, null, 2))
}
console.log(JSON.stringify(results, null, 2))
if (failed) process.exitCode = 1
