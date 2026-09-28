import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const origin = 'http://127.0.0.1:4173'
const output = 'artifacts/galaxy-visual'
const views = [
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'laptop', width: 1280, height: 800, mobile: false },
  { name: 'phone', width: 390, height: 844, mobile: true },
]

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

try {
  for (const view of views) {
    const context = await browser.newContext({
      viewport: { width: view.width, height: view.height },
      deviceScaleFactor: 1,
      isMobile: view.mobile,
      hasTouch: view.mobile,
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text())
    })

    try {
      await page.goto(`${origin}/galaxy`, { waitUntil: 'networkidle' })
      await page.locator('.GalaxyScene canvas').waitFor()
      await page.locator('.GalaxyLoading').waitFor({ state: 'hidden' })
      if (await page.locator('.GalaxyFallbackNote').count()) throw new Error('WebGL fallback was displayed')

      await page.screenshot({ path: `${output}/${view.name}-overview.png`, fullPage: true })
      await page.getByRole('button', { name: 'Projects', exact: true }).click()
      await page.waitForFunction(() => document.querySelector('.GalaxyMapHeading span:last-child')?.textContent === 'Signal locked')
      await page.screenshot({ path: `${output}/${view.name}-projects.png`, fullPage: true })
      await page.getByRole('button', { name: 'Core', exact: true }).click()
      await page.locator('.CoreIdentity.is-revealed').waitFor()
      await page.screenshot({ path: `${output}/${view.name}-core.png`, fullPage: true })

      const layout = await page.evaluate(() => ({
        width: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        canvasWidth: document.querySelector('.GalaxyScene canvas')?.width,
        canvasHeight: document.querySelector('.GalaxyScene canvas')?.height,
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
} finally {
  await browser.close()
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2))
}

if (failed) {
  console.error(JSON.stringify(results, null, 2))
  process.exitCode = 1
} else console.log(JSON.stringify(results, null, 2))
