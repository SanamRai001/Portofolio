import assert from 'node:assert/strict'
import { mkdir, writeFile, rename } from 'node:fs/promises'
import { chromium } from 'playwright'

const origin = 'http://127.0.0.1:4187'
const output = 'artifacts/cube-portal-visual'
const allViews = [
  { name: 'desktop', viewport: { width: 1440, height: 900 }, isMobile: false, reducedMotion: 'no-preference' },
  { name: 'mobile', viewport: { width: 390, height: 844 }, isMobile: true, reducedMotion: 'no-preference' },
  { name: 'reduced', viewport: { width: 1280, height: 800 }, isMobile: false, reducedMotion: 'reduce' },
]
const views = process.env.CUBE_VIEW ? allViews.filter(view => view.name === process.env.CUBE_VIEW) : allViews
assert.ok(views.length, 'Unknown CUBE_VIEW')
const checkpoint = (view, stage) => console.log(`[cube:${view.name}] ${stage}`)

await mkdir(output, { recursive: true })
let ready = false
for (let attempt = 0; attempt < 50; attempt++) {
  try {
    if ((await fetch(origin + '/cube-preview')).ok) { ready = true; break }
  } catch { /* preview server starting */ }
  await new Promise(resolve => setTimeout(resolve, 250))
}
if (!ready) throw new Error('Vite preview server did not start within 12.5 seconds')

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })
const results = []

try {
  for (const view of views) {
    const context = await browser.newContext({
      viewport: view.viewport, deviceScaleFactor: 1,
      isMobile: view.isMobile, hasTouch: view.isMobile,
      reducedMotion: view.reducedMotion,
      recordVideo: view.reducedMotion === 'reduce' ? undefined : { dir: output, size: view.viewport },
    })
    context.setDefaultTimeout(10000)
    context.setDefaultNavigationTimeout(15000)
    const page = await context.newPage()
    const errors = []
    const assetResponses = []
    let openingProbe = null

    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('response', response => {
      if (/stone-cube[^/]*\.glb$/i.test(new URL(response.url()).pathname)) {
        assetResponses.push({ status: response.status(), url: response.url() })
      }
    })

    try {
      checkpoint(view, 'load canonical model')
      await page.goto(origin + '/cube-preview', { waitUntil: 'networkidle' })
      await page.locator('.CubePortalCanvas canvas').waitFor({ state: 'visible', timeout: 15000 })
      await page.waitForFunction(() => document.querySelector('.CubePortalModel')?.dataset.renderer === 'webgl', null, { timeout: 15000 })
      await page.waitForTimeout(350)

      const model = await page.evaluate(() => {
        const canvas = document.querySelector('.CubePortalCanvas canvas')
        return {
          width: canvas?.width, height: canvas?.height,
          webgl2: !!canvas?.getContext('webgl2'),
          fallback: !!document.querySelector('.CubePortalFallback'),
          theme: document.querySelector('.CubePortal')?.dataset.theme,
        }
      })
      assert.ok(model.width > 0 && model.height > 0, '3D canvas has zero size')
      assert.equal(model.webgl2, true, 'No real WebGL2 context; fallback is not sufficient')
      assert.equal(model.fallback, false, 'GLB not ready: fallback still displayed')
      assert.ok(assetResponses.some(entry => entry.status === 200), 'No successful GLB request')
      await page.screenshot({ path: output + '/' + view.name + '-home.png' })
      // Compare the SAME GLB with and without its backing shells (diagnostic only).
      // If screenshots match, backing shells are not visible and cannot explain the defect.
      const normalCubePng = await page.locator('.CubePortalCanvas canvas')
        .screenshot({ path: output + '/' + view.name + '-full-shells.png' })
      checkpoint(view, 'compare shell visibility')
      // No second video encoder on the software-WebGL runner.
      const comparisonContext = await browser.newContext({
        viewport: view.viewport, deviceScaleFactor: 1,
        isMobile: view.isMobile, hasTouch: view.isMobile, reducedMotion: view.reducedMotion,
      })
      comparisonContext.setDefaultTimeout(10000)
      comparisonContext.setDefaultNavigationTimeout(15000)
      const comparison = await comparisonContext.newPage()
      let stoneOnlyMatches = null
      try {
        await comparison.goto(origin + '/cube-preview?cubeDebug=1&cubeMode=stone-only', { waitUntil: 'networkidle' })
        await comparison.waitForFunction(() => document.querySelector('.CubePortalModel')?.dataset.renderer === 'webgl', null, { timeout: 15000 })
        await comparison.waitForTimeout(350)
        await comparison.waitForFunction(() => document.querySelector('.CubePortalCanvas')?.dataset.hiddenShellCount === '6')
        assert.equal(await comparison.locator('.CubePortalModel').getAttribute('data-renderer'), 'webgl')
        assert.equal(await comparison.locator('.CubePortalModel').getAttribute('data-cube-mode'), 'stone-only')
        const stoneOnlyPng = await comparison.locator('.CubePortalCanvas canvas')
          .screenshot({ path: output + '/' + view.name + '-stone-only.png' })
        stoneOnlyMatches = normalCubePng.equals(stoneOnlyPng)
        await comparison.screenshot({ path: output + '/' + view.name + '-stone-only-page.png' })
      } finally {
        await comparisonContext.close()
      }
      checkpoint(view, 'hover invariance')
      // Reproduce the owner's exact action: move the pointer over the rendered cube.
      // There is no hover material handler; the loaded GLB should not change its pixels.
      const canvas = page.locator('.CubePortalCanvas canvas')
      const bounds = await canvas.boundingBox()
      assert.ok(bounds && bounds.width > 0 && bounds.height > 0, 'Cube missing from page')
      await page.mouse.move(3, 3)
      await page.waitForTimeout(100)
      const beforeHover = await canvas.screenshot({ path: output + '/' + view.name + '-cube-before-hover.png' })
      await page.mouse.move(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.5)
      await page.waitForTimeout(180)
      const afterHover = await canvas.screenshot({ path: output + '/' + view.name + '-cube-after-hover.png' })
      assert.deepEqual(afterHover, beforeHover, '3D cube pixels changed when hovering over cube')
      assert.equal(await page.locator('.CubePortalModel').getAttribute('data-model-revision'), 'canonical-stone-v1')
      assert.equal(await page.locator('.CubePortalModel').getAttribute('data-renderer'), 'webgl')
      assert.equal(await page.locator('.CubePortalCanvas').getAttribute('data-moving-panel-count'), '3')
      if (view.name === 'desktop') {
        await page.locator('.CubeDestinationWork').hover()
        await page.waitForFunction(() => document.querySelector('.CubeUniverse')?.dataset.highlight === 'work')
        await page.waitForTimeout(220)
        const lit = await canvas.screenshot({ path: output + '/desktop-destination-hover.png' })
        assert.notDeepEqual(lit, beforeHover, 'Destination hover should illuminate the same cube')
        await page.mouse.move(3, 3)
        await page.waitForFunction(() => document.querySelector('.CubeUniverse')?.dataset.highlight === '')
        await page.waitForTimeout(120)
        assert.deepEqual(await canvas.screenshot(), beforeHover, 'Cube must return to identical idle appearance')
        checkpoint(view, 'slow load and forced fallback')
        const fallbackContext = await browser.newContext({ viewport: view.viewport, deviceScaleFactor: 1 })
        fallbackContext.setDefaultTimeout(10000)
        fallbackContext.setDefaultNavigationTimeout(15000)
        const fallbackPage = await fallbackContext.newPage()
        let release
        const gate = new Promise(resolve => { release = resolve })
        try {
          await fallbackPage.route(/stone-cube[^/]*\.glb$/, async route => { await gate; await route.abort() })
          await fallbackPage.goto(origin + '/cube-preview', { waitUntil: 'domcontentloaded' })
          await fallbackPage.waitForFunction(() => document.querySelector('.CubePortalModel')?.dataset.renderer === 'loading')
          assert.equal(await fallbackPage.locator('.CubePortalFallback').count(), 0)
          await fallbackPage.screenshot({path: output + '/desktop-loading.png', timeout: 5000})
          release()
          await fallbackPage.waitForFunction(() => document.querySelector('.CubePortalModel')?.dataset.renderer === 'fallback')
          assert.equal(await fallbackPage.locator('.CubePortalFallback').count(), 1)
          await fallbackPage.waitForTimeout(350)
          await fallbackPage.screenshot({path: output + '/desktop-fallback.png'})
        } finally { release(); await fallbackContext.close() }
      }

      checkpoint(view, 'theme and Work reveal')
      await page.locator('.CubeThemeButton').click()
      await page.waitForFunction(() => document.querySelector('.CubePortal')?.dataset.theme === 'dark')
      await page.waitForTimeout(400)
      await page.screenshot({ path: output + '/' + view.name + '-dark.png' })

      await page.locator('.CubeDestinationWork').click()
      if (view.reducedMotion !== 'reduce') {
        // Verify the portal itself; a settled Work screenshot alone can hide a broken opening.
        await page.waitForTimeout(320)
        openingProbe = await page.evaluate(() => {
          const overlay = document.querySelector('.CubePortalReveal')
          const glimpse = document.querySelector('.CubePortalGlimpse')
          const clipPath = getComputedStyle(overlay).clipPath
          const radius = Number(/circle\(([\d.]+)px/.exec(clipPath)?.[1] || NaN)
          const x = Number.parseFloat(overlay.style.getPropertyValue('--portal-x'))
          const y = Number.parseFloat(overlay.style.getPropertyValue('--portal-y'))
          const maxRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 48
          return {
            phase: document.querySelector('.CubePortal')?.dataset.phase,
            clipPath, radius, coverRatio: radius / maxRadius,
            glimpseOpacity: Number(getComputedStyle(glimpse).opacity),
          }
        })
        assert.equal(openingProbe.phase, 'opening', 'Opening phase was skipped')
        assert.ok(openingProbe.clipPath.startsWith('circle('), 'Opening mask is not circular')
        assert.ok(Number.isFinite(openingProbe.coverRatio) && openingProbe.coverRatio >= 0 && openingProbe.coverRatio < 0.68,
          'Opening mask expands too far before the stone has opened: ' + openingProbe.coverRatio)
        await page.screenshot({ path: output + '/' + view.name + '-opening.png' })
      }
      await page.waitForFunction(() => document.querySelector('.CubePortal')?.dataset.phase === 'work')
      // Phase changes before the CSS reveal finishes. Do not capture a half-transparent page.
      await page.waitForFunction(() => {
        const panel = document.querySelector('.CubeWork')
        return panel && Number(getComputedStyle(panel).opacity) >= 0.98
      })
      assert.equal(await page.locator('.CubeProject').count(), 3, 'Work project index not shown')
      assert.equal(await page.locator('#cube-work-title').isVisible(), true, 'Work heading not visible')
      await page.screenshot({ path: output + '/' + view.name + '-work.png' })

      checkpoint(view, 'Escape and browser Back')
      await page.keyboard.press('Escape')
      await page.waitForFunction(() => document.querySelector('.CubePortal')?.dataset.phase === 'home')
      await page.locator('.CubeDestinationWork').click()
      await page.waitForFunction(() => document.querySelector('.CubePortal')?.dataset.phase === 'work')
      await page.goBack({ waitUntil: 'domcontentloaded' })
      await page.waitForFunction(() => document.querySelector('.CubePortal')?.dataset.phase === 'home')

      const layout = await page.evaluate(() => ({
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        phase: document.querySelector('.CubePortal')?.dataset.phase,
      }))
      assert.ok(layout.documentWidth <= layout.viewportWidth + 1,
        'Horizontal overflow: ' + layout.documentWidth + ' > ' + layout.viewportWidth)
      assert.deepEqual(errors, [], 'Browser console/page errors')
      results.push({ view: view.name, status: 'pass', model, layout, assetResponses, openingProbe, stoneOnlyMatches, errors })
    } catch (error) {
      results.push({ view: view.name, status: 'fail', reason: error.message, errors, assetResponses })
    } finally {
      // Save result before video finalization; cancellation must not erase completed assertions.
      await writeFile(output + '/results.json', JSON.stringify(results, null, 2) + '\n')
      checkpoint(view, results.at(-1)?.status || 'incomplete')
      const video = page.video()
      await context.close()
      if (video) await rename(await video.path(), output + '/' + view.name + '-motion.webm')
    }
  }
} finally {
  await browser.close()
}
await writeFile(output + '/results.json', JSON.stringify(results, null, 2) + '\n')
console.log(JSON.stringify(results, null, 2))
if (results.some(result => result.status !== 'pass')) process.exitCode = 1
