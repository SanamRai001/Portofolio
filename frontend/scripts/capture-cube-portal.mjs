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
await mkdir(output, { recursive: true })
let ready = false
for (let attempt = 0; attempt < 50; attempt++) {
  try {
    if ((await fetch(origin + '/cube-preview')).ok) { ready = true; break }
  } catch { /* server starting */ }
  await new Promise(resolve => setTimeout(resolve, 250))
}
assert.ok(ready, 'Preview server did not start')
const browser = await chromium.launch()
const results = []
try {
  for (const view of views) {
    const context = await browser.newContext({
      viewport: view.viewport, deviceScaleFactor: 1, isMobile: view.isMobile, hasTouch: view.isMobile,
      reducedMotion: view.reducedMotion,
      recordVideo: view.reducedMotion === 'reduce' ? undefined : {dir: output, size: view.viewport},
    })
    context.setDefaultTimeout(10000)
    context.setDefaultNavigationTimeout(15000)
    const page = await context.newPage()
    const errors = [], modelRequests = [], artworkResponses = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('request', request => { if (/\.glb(?:\?|$)/i.test(request.url())) modelRequests.push(request.url()) })
    page.on('response', response => {
      if (/reference-cube[^/]*\.png$/i.test(new URL(response.url()).pathname))
        artworkResponses.push({status: response.status(), url: response.url()})
    })
    let evidence = {}
    try {
      console.log('[cube:' + view.name + '] load original artwork')
      await page.goto(origin + '/cube-preview', {waitUntil: 'networkidle'})
      const cube = page.locator('.CubePortalModel')
      const artwork = page.locator('.CubeArtwork')
      await artwork.waitFor({state: 'visible'})
      assert.equal(await cube.getAttribute('data-model-revision'), 'original-artwork-v1')
      assert.equal(await cube.getAttribute('data-renderer'), 'layered-artwork')
      assert.equal(await cube.getAttribute('data-split'), 'false')
      assert.equal(await page.locator('.CubeArtworkBody').getAttribute('clip-path'), null)
      assert.equal(await page.locator('.CubePortalModel canvas').count(), 0)
      assert.ok(artworkResponses.some(r => r.status === 200), 'Original image was not loaded')
      assert.deepEqual(modelRequests, [], 'GLB request unexpectedly made')
      assert.equal(await page.locator('.CubeArtworkBody').getAttribute('href'),
        await page.locator('.CubeArtworkLid image').getAttribute('href'))
      await page.screenshot({path: output + '/' + view.name + '-home.png'})
      const before = await artwork.screenshot({path: output + '/' + view.name + '-idle.png'})
      const box = await artwork.boundingBox()
      await page.mouse.move(box.x + box.width/2, box.y + box.height/2)
      await page.waitForTimeout(250)
      assert.deepEqual(await artwork.screenshot(), before, 'Direct cube hover changed the original artwork')
      if (view.name === 'desktop') {
        await page.locator('.CubeDestinationWork').hover()
        await page.waitForFunction(() => document.querySelector('.CubeUniverse')?.dataset.highlight === 'work')
        await page.waitForTimeout(260)
        assert.notDeepEqual(await artwork.screenshot({path: output + '/desktop-destination-hover.png'}), before)
        await page.mouse.move(3, 3)
        await page.waitForTimeout(260)
        assert.deepEqual(await artwork.screenshot(), before, 'Destination hover did not restore the idle cube')
      }
      console.log('[cube:' + view.name + '] theme and Work reveal')
      await page.locator('.CubeThemeButton').click()
      await page.waitForFunction(() => document.querySelector('.CubePortal')?.dataset.theme === 'dark')
      await page.waitForTimeout(600)
      await page.screenshot({path: output + '/' + view.name + '-dark.png'})
      await page.locator('.CubeDestinationWork').click()
      if (view.reducedMotion !== 'reduce') {
        await page.waitForTimeout(260)
        evidence = await page.evaluate(() => ({
          phase: document.querySelector('.CubePortal')?.dataset.phase,
          lidOpen: document.querySelector('.CubePortalModel')?.dataset.lidOpen,
          lidTransform: getComputedStyle(document.querySelector('.CubeArtworkLid')).transform,
          bodyTransform: getComputedStyle(document.querySelector('.CubeArtworkBody')).transform,
          split: document.querySelector('.CubePortalModel')?.dataset.split,
          clipPath: getComputedStyle(document.querySelector('.CubePortalReveal')).clipPath,
        }))
        assert.equal(evidence.phase, 'opening')
        assert.equal(evidence.lidOpen, 'true')
        assert.equal(evidence.split, 'true')
        assert.notEqual(evidence.lidTransform, 'none')
        assert.notEqual(evidence.lidTransform, 'matrix(1, 0, 0, 1, 0, 0)')
        assert.equal(evidence.bodyTransform, 'none', 'Body must stay in place')
        assert.ok(evidence.clipPath.startsWith('circle('))
        await page.screenshot({path: output + '/' + view.name + '-opening.png'})
      }
      await page.waitForFunction(() => document.querySelector('.CubePortal')?.dataset.phase === 'work')
      await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.CubeWork')).opacity) >= .98)
      assert.equal(await page.locator('.CubeProject').count(), 3)
      assert.equal(await page.locator('#cube-work-title').isVisible(), true)
      await page.screenshot({path: output + '/' + view.name + '-work.png'})
      await page.keyboard.press('Escape')
      await page.waitForFunction(() => document.querySelector('.CubePortal')?.dataset.phase === 'home')
      assert.equal(await cube.getAttribute('data-lid-open'), 'false')
      assert.equal(await cube.getAttribute('data-split'), 'false')
      assert.equal(await page.locator('.CubeArtworkBody').getAttribute('clip-path'), null)
      await page.locator('.CubeDestinationWork').click()
      await page.waitForFunction(() => document.querySelector('.CubePortal')?.dataset.phase === 'work')
      await page.goBack({waitUntil: 'domcontentloaded'})
      await page.waitForFunction(() => document.querySelector('.CubePortal')?.dataset.phase === 'home')
      assert.equal(await cube.getAttribute('data-split'), 'false')
      const layout = await page.evaluate(() => ({viewport: innerWidth, document: document.documentElement.scrollWidth}))
      assert.ok(layout.document <= layout.viewport + 1, 'Horizontal overflow')
      assert.deepEqual(modelRequests, [], 'GLB requests are not permitted in artwork mode')
      assert.deepEqual(errors, [], 'Browser errors')
      results.push({view: view.name, status: 'pass', artworkResponses, evidence, layout, errors})
    } catch (error) {
      results.push({view: view.name, status: 'fail', reason: error.message, artworkResponses, evidence, errors})
    } finally {
      await writeFile(output + '/results.json', JSON.stringify(results, null, 2) + '\n')
      console.log(JSON.stringify(results.at(-1)))
      const video = page.video()
      await context.close()
      if (video) await rename(await video.path(), output + '/' + view.name + '-motion.webm')
    }
  }
} finally { await browser.close() }
if (results.some(result => result.status !== 'pass')) process.exitCode = 1
