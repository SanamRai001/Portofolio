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
      results.push({ view: `${view.name} normal-motion hero Sun + primary planets`, bodies: ['Core', ...rotatingBodies], sampleSeconds: 8, errors })
    } catch (error) {
      results.push({ view: `${view.name} normal-motion primary planets`, errors: [...errors, error.message] })
    } finally {
      await context.close()
    }
    if (results.at(-1).errors.length) failed = true
  }

  // Preserve the surface-spike seam proof: observe Projects over approximately
  // one axial turn so a longitude join cannot hide in one flattering frame.
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
} finally {
  await browser.close()
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2))
}

if (failed) {
  console.error(JSON.stringify(results, null, 2))
  process.exitCode = 1
} else console.log(JSON.stringify(results, null, 2))
