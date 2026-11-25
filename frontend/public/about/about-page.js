import { installAboutPassage } from './passage.js'

const root = document.documentElement
const button = document.querySelector('.theme-toggle')
const meta = document.querySelector('meta[name="theme-color"]')
function readTheme() {
  try { return localStorage.getItem('sanam-cube-theme') === 'dark' ? 'dark' : 'light' }
  catch { return 'light' }
}
function applyTheme(theme) {
  root.dataset.theme = theme
  meta?.setAttribute('content',theme === 'dark' ? '#0a1119' : '#f6f3ec')
  if (button) {
    button.setAttribute('aria-label',theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode')
    button.setAttribute('aria-pressed',String(theme === 'dark'))
  }
}
applyTheme(readTheme())
if (button) {
  button.hidden = false
  button.addEventListener('click',() => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    try { localStorage.setItem('sanam-cube-theme',next) } catch { /* storage unavailable */ }
  })
}
if (new URLSearchParams(location.search).get('from') === 'cube') {
  document.querySelectorAll('[data-about-return]').forEach(link => {
    link.href = '/?from=about'
    link.dataset.aboutPassage = ''
    link.textContent = link.closest('footer') ? '← Return to cube' : 'Return to cube'
  })
  const work = document.querySelector('[data-about-work]')
  if (work) {
    work.href = '/?from=about#work'
    work.dataset.aboutPassage = ''
  }
  const brand = document.querySelector('.brand')
  if (brand) {
    brand.href = '/?from=about'
    brand.dataset.aboutPassage = ''
    brand.setAttribute('aria-label','Sanam Rai — return to cube')
  }
}
installAboutPassage()
