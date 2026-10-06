import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

// Browser proof for the direct Black Hole portal. Selecting Black Hole is now
// the explicit user action: the existing cinematic begins automatically after
// camera arrival and still cannot commit the route before opaque blackout.
const origin = process.env.GALAXY_PREVIEW_ORIGIN || 'http://127.0.0.1:4173'
const output = 'artifacts/galaxy-visual'
await mkdir(output, { recursive: true })

let previewReady = false
for (let attempt = 0; attempt < 40; attempt++) {
  try {
    if ((await fetch(origin)).ok) {
      previewReady = true
      break
    }
  } catch {
    // Dedicated Vite preview is still starting.
  }
  await new Promise(resolve => setTimeout(resolve, 250))
}
if (!previewReady) throw new Error('Portal preview did not start within 10 seconds')

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })
const results = []
const cases = [
  { name: 'desktop-portal', width: 1440, height: 900, mobile: false, reduced: false, cancelFirst: true },
  { name: 'phone-portal', width: 390, height: 844, mobile: true, reduced: false },
  { name: 'phone-reduced-portal', width: 390, height: 844, mobile: true, reduced: true },
]
let failed = false

async function triggerBlackHole(page) {
  const stage = page.locator('.GalaxyStage')
  await stage.focus()
  await page.keyboard.press('End')
  await page.keyboard.press('Enter')
  assert.equal(await page.locator('.GalaxyPortalEnter').count(), 0, 'no redundant horizon CTA')
}

try {
  for (const variant of cases) {
    const context = await browser.newContext({
      viewport: { width: variant.width, height: variant.height },
      deviceScaleFactor: 1,
      isMobile: variant.mobile,
      hasTouch: variant.mobile,
      reducedMotion: variant.reduced ? 'reduce' : 'no-preference',
    })

    if (!variant.mobile) {
      await context.addInitScript(() => {
        Object.defineProperty(navigator, 'deviceMemory', {
          configurable: true,
          get: () => 8,
        })
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          configurable: true,
          get: () => 8,
        })
      })
    }

    const page = await context.newPage()
    const errors = []
    const coverage = []
    let handoff = null
    let requests = 0

    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text())
    })

    try {
      await page.goto(origin + '/galaxy', { waitUntil: 'networkidle' })
      await page.locator('.GalaxyScene canvas').waitFor()
      await page.locator('.GalaxyLoading').waitFor({ state: 'hidden' })
      assert.equal(page.url(), origin + '/galaxy')
      assert.equal(await page.locator('.GalaxySystemMap').count(), 0, 'visible system-map button strip is removed')
      assert.match(
        await page.locator('.GalaxyInteractionHint').textContent(),
        /Click the sun and planets to explore/i,
      )

      if (variant.cancelFirst) {
        await triggerBlackHole(page)
        await page.waitForURL(origin + '/galaxy/black-hole')
        await page.locator('.GalaxyPortalVeil.is-approach').waitFor()
        await page.waitForTimeout(200)
        await page.screenshot({
          path: `${output}/${variant.name}-approach.png`,
          fullPage: true,
        })

        await page.keyboard.press('Escape')
        await page.locator('.GalaxyPortalVeil.is-idle').waitFor()
        await page.waitForURL(origin + '/galaxy')
        await page.locator('.GalaxyBack').waitFor({ state: 'detached' })
      }

      await page.exposeFunction('__recordGalaxyPortalCoverage', info => coverage.push(info))
      await page.evaluate(() => {
        const veil = document.querySelector('.GalaxyPortalVeil')
        veil.addEventListener('transitionend', event => {
          if (event.propertyName !== 'opacity' || veil.dataset.portalPhase !== 'blackout') return
          void window.__recordGalaxyPortalCoverage({
            phase: veil.dataset.portalPhase,
            opacity: Number.parseFloat(getComputedStyle(veil).opacity),
            bounds: (() => {
              const box = veil.getBoundingClientRect()
              return { x: box.x, y: box.y, width: box.width, height: box.height }
            })(),
          })
        }, { capture: true, once: false })
      })

      await page.route(origin + '/', async route => {
        requests++
        handoff = { target: route.request().url() }
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<!doctype html><title>Portal destination reached</title><h1 id="portal-arrived">Portal destination reached</h1>',
        })
      })

      await triggerBlackHole(page)

      if (!variant.reduced) {
        await page.waitForURL(origin + '/galaxy/black-hole')
        await page.locator('.GalaxyPortalVeil.is-approach').waitFor()
        await page.locator('.GalaxyPortalVeil.is-plunge').waitFor({ timeout: 16000 })

        const stage = await page.locator('.GalaxyStage').boundingBox()
        assert.ok(
          stage && stage.width >= variant.width - 1 && stage.height >= variant.height - 1,
          'the cinematic plunge must use a full-viewport Galaxy canvas',
        )

        const chromeOpacity = await page.locator('.GalaxyHeader')
          .evaluate(node => Number.parseFloat(getComputedStyle(node).opacity))
        assert.ok(chromeOpacity < .01, 'ordinary page chrome must leave before plunge')
        assert.equal(
          await page.getByRole('button', { name: /Return to system/i }).isVisible(),
          true,
          'visitors retain a visible cancel action until blackout',
        )

        await page.screenshot({
          path: `${output}/${variant.name}-plunge.png`,
          fullPage: true,
        })
        assert.equal(requests, 0, 'the plunge cannot navigate before blackout')
      }

      await page.waitForURL(origin + '/', { timeout: 20000 })
      assert.equal(
        await page.locator('#portal-arrived').textContent(),
        'Portal destination reached',
      )
      assert.equal(requests, 1, 'navigate to the destination exactly once')
      assert.equal(handoff.target, origin + '/')

      const proof = coverage.find(entry => entry.opacity >= .999)
      assert.ok(proof, 'observe an opaque veil during route handoff')
      assert.ok(
        ['blackout', 'committed'].includes(proof.phase),
        'navigation requires blackout phase',
      )
      assert.ok(proof.opacity >= .999, 'black veil must be fully opaque before route commit')
      assert.ok(
        proof.bounds.width >= variant.width - 1
          && proof.bounds.height >= variant.height - 1,
        'blackout must cover the entire viewport',
      )

      if (errors.length) throw new Error('Browser errors: ' + errors.join('; '))
      results.push({
        view: variant.name,
        status: 'passed',
        requests,
        handoff,
        opacityTransitionObserved: coverage.length > 0,
        errors,
      })
    } catch (error) {
      failed = true
      results.push({
        view: variant.name,
        status: 'failed',
        message: error.message,
        requests,
        handoff,
        coverage,
        errors,
      })
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
