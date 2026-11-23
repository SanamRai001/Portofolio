import assert from 'node:assert/strict'
import { mkdir, writeFile, rename } from 'node:fs/promises'
import { chromium } from 'playwright'

const origin = 'http://127.0.0.1:4187'
const output = 'artifacts/cube-portal-visual'
const views = [
  { name: 'desktop', viewport: { width: 1440, height: 900 }, isMobile: false, reducedMotion: 'no-preference' },
  { name: 'mobile', viewport: { width: 390, height: 844 }, isMobile: true, reducedMotion: 'no-preference' },
  { name: 'reduced', viewport: { width: 1280, height: 800 }, isMobile: false, reducedMotion: 'reduce' },
]

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
      await page.goto(origin + '/cube-preview', { waitUntil: 'networkidle' })
      await page.locator('.CubePortalCanvas canvas').waitFor({ state: 'visible', timeout: 15000 })
      await page.locator('.CubePortalFallback').waitFor({ state: 'detached', timeout: 15000 })

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
          return {
            phase: document.querySelector('.CubePortal')?.dataset.phase,
            clipPath: getComputedStyle(overlay).clipPath,
            glimpseOpacity: Number(getComputedStyle(glimpse).opacity),
          }
        })
        assert.equal(openingProbe.phase, 'opening', 'Opening phase was skipped')
        assert.ok(openingProbe.clipPath.startsWith('circle('), 'Opening mask is not circular')
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
      results.push({ view: view.name, status: 'pass', model, layout, assetResponses, openingProbe, errors })
    } catch (error) {
      results.push({ view: view.name, status: 'fail', reason: error.message, errors, assetResponses })
    } finally {
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
