import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const origin = process.env.GALAXY_PREVIEW_ORIGIN || 'http://127.0.0.1:4173'
const output = 'artifacts/galaxy-visual'
const views = [
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'phone', width: 390, height: 844, mobile: true },
]

await mkdir(output, { recursive: true })

let ready = false
for (let attempt = 0; attempt < 40; attempt++) {
  try {
    if ((await fetch(origin)).ok) {
      ready = true
      break
    }
  } catch {
    // Vite preview is still starting.
  }
  await new Promise(resolve => setTimeout(resolve, 250))
}
if (!ready) throw new Error('Galaxy preview did not start within 10 seconds')

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })
const results = []
let failed = false

async function openRoute(page, path, selector) {
  await page.goto(origin + path, { waitUntil: 'networkidle' })
  await page.locator('.GalaxyScene canvas').waitFor()
  await page.locator('.GalaxyLoading').waitFor({ state: 'hidden' })
  await page.locator(selector).waitFor()
  assert.equal(new URL(page.url()).pathname, path)
}

async function assertNoOverflow(page) {
  const layout = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
  }))
  assert.ok(
    layout.documentWidth <= layout.viewport + 1,
    `horizontal overflow: ${layout.documentWidth} > ${layout.viewport}`,
  )
  return layout
}

try {
  for (const view of views) {
    const context = await browser.newContext({
      viewport: { width: view.width, height: view.height },
      deviceScaleFactor: 1,
      isMobile: view.mobile,
      hasTouch: view.mobile,
      reducedMotion: 'reduce',
    })

    if (!view.mobile) {
      await context.addInitScript(() => {
        Object.defineProperty(navigator, 'deviceMemory', { configurable: true, get: () => 8 })
        Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, get: () => 8 })
      })
    }

    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text())
    })

    try {
      // Journey -> project detail -> Projects -> Journey.
      await openRoute(page, '/galaxy/journey', '.JourneyContent.is-revealed')
      await page.locator('.JourneyPath').getByRole('button', { name: /Research & Exploration/ }).click()

      const journeyLinks = page.locator('.GalaxyEvidenceLinks a')
      assert.equal(await journeyLinks.count(), 2)
      assert.deepEqual(
        await journeyLinks.evaluateAll(nodes => nodes.map(node => new URL(node.href).pathname)),
        ['/galaxy/projects/statescout', '/galaxy/projects/reality-archive'],
      )

      await page.screenshot({
        path: `${output}/${view.name}-journey-project-crosslinks.png`,
        fullPage: true,
      })

      await journeyLinks.filter({ hasText: 'StateScout' }).click()
      await page.waitForURL(origin + '/galaxy/projects/statescout')
      await page.locator('.ProjectCaseStudy').waitFor()
      assert.equal(await page.locator('#project-case-title').textContent(), 'StateScout')

      await page.goBack()
      await page.waitForURL(origin + '/galaxy/projects')
      await page.locator('.ProjectsContent.is-revealed').waitFor()
      assert.equal(await page.locator('.ProjectCaseStudy').count(), 0)

      await page.goBack()
      await page.waitForURL(origin + '/galaxy/journey')
      await page.locator('.JourneyContent.is-revealed').waitFor()

      // Lab internal evidence keeps the repository link but prefers a readable
      // in-Galaxy case study when G4A has one.
      await openRoute(page, '/galaxy/lab', '.LabContent.is-revealed')
      await page.locator('.LabConsole').getByRole('button', { name: /Interface State Exploration/ }).click()

      const labActions = page.locator('.LabEvidenceActions a')
      assert.equal(await labActions.count(), 2)
      assert.equal(
        new URL(await labActions.nth(0).getAttribute('href'), origin).pathname,
        '/galaxy/projects/statescout',
      )
      assert.match(await labActions.nth(1).getAttribute('href'), /github\.com\/SanamRai001\/StateScout/)

      await page.screenshot({
        path: `${output}/${view.name}-lab-project-crosslink.png`,
        fullPage: true,
      })

      await labActions.nth(0).click()
      await page.waitForURL(origin + '/galaxy/projects/statescout')
      await page.locator('.ProjectCaseStudy').waitFor()

      await page.goBack()
      await page.waitForURL(origin + '/galaxy/projects')
      await page.goBack()
      await page.waitForURL(origin + '/galaxy/lab')
      await page.locator('.LabContent.is-revealed').waitFor()

      // Experiments without a G4A case study must not invent an internal route.
      await page.locator('.LabConsole').getByRole('button', { name: /Vector Reconstruction/ }).click()
      assert.equal(await page.locator('.LabEvidenceActions a').count(), 1)
      assert.match(
        await page.locator('.LabEvidenceActions a').getAttribute('href'),
        /github\.com\/SanamRai001\/ScanSketch/,
      )
      assert.equal(
        await page.locator('.LabEvidenceActions a[href^="/galaxy/projects/"]').count(),
        0,
      )

      const layout = await assertNoOverflow(page)
      if (errors.length) throw new Error('Browser errors: ' + errors.join('; '))

      results.push({ view, status: 'passed', layout, errors })
    } catch (error) {
      failed = true
      results.push({ view, status: 'failed', message: error.message, errors })
    } finally {
      await context.close()
    }
  }
} finally {
  await browser.close()
  await writeFile(
    output + '/crosslink-results.json',
    JSON.stringify(results, null, 2),
  )
}

console.log(JSON.stringify(results, null, 2))
if (failed) process.exitCode = 1
