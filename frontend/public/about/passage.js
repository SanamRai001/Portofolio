// A native-document handoff, independent of the React router and WebGL.
const DURATION = 260
const media = () => window.matchMedia('(prefers-reduced-motion: reduce)')
const route = () => window.location.pathname.replace(/\/+$/, '')
const from = () => new URLSearchParams(window.location.search).get('from')

function makeVeil() {
  const dark = document.documentElement.dataset.theme === 'dark' ||
    document.querySelector('.CubePortal, .LabChapter')?.dataset.theme === 'dark'
  const veil = document.createElement('div')
  veil.className = 'AboutPassageVeil'
  veil.setAttribute('aria-hidden', 'true')
  Object.assign(veil.style, {
    position:'fixed', inset:'0', zIndex:'2147483000',
    background:dark ? '#0a1119' : '#f6f3ec', pointerEvents:'auto',
    overflow:'hidden',
  })
  const line = document.createElement('div')
  Object.assign(line.style, {
    position:'absolute', left:'0', right:'0', top:'50%', height:'1px',
    background:dark ? '#e8bc83' : '#94662c', opacity:'.75',
  })
  veil.append(line)
  document.body.append(veil)
  return veil
}

let arrivalPlayed = false
export function installAboutPassage() {
  let veil = null
  let animation = null
  let timer = null
  let pending = null
  let trigger = null
  const preference = media()
  const clear = (restore = false) => {
    clearTimeout(timer)
    timer = null
    pending = null
    animation?.cancel()
    animation = null
    veil?.remove()
    veil = null
    if (restore) trigger?.focus({preventScroll:true})
    trigger = null
  }
  const arrive = () => {
    if (arrivalPlayed || preference.matches || typeof Element.prototype.animate !== 'function') return
    if (!((['/about', '/lab-preview'].includes(route()) && from() === 'cube') ||
          (route() === '/cube-preview' && ['about', 'lab'].includes(from())))) return
    arrivalPlayed = true
    veil = makeVeil()
    veil.dataset.phase = 'arrival'
    animation = veil.animate([
      {opacity:1, clipPath:'inset(0 0 0 0)'},
      {opacity:0, clipPath:'inset(0 0 0 0)'},
    ], {duration:DURATION, easing:'ease-out',fill:'forwards'})
    animation.finished.then(() => clear(), () => {})
    timer = setTimeout(clear, DURATION + 100)
  }
  const commit = () => {
    if (!pending) return
    const destination = pending
    pending = null
    clearTimeout(timer)
    timer = null
    window.location.assign(destination)
  }
  const click = event => {
    const link = event.target.closest?.('a[data-about-passage]')
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey ||
      event.ctrlKey || event.shiftKey || event.altKey || link.hasAttribute('download') ||
      (link.target && link.target !== '_self')) return
    const url = new URL(link.href, location.href)
    if (url.origin !== location.origin ||
      !((route() === '/cube-preview' && ['/about', '/lab-preview'].includes(url.pathname) && url.searchParams.get('from') === 'cube') ||
        (route() === '/about' && url.pathname === '/cube-preview' && url.searchParams.get('from') === 'about') ||
        (route() === '/lab-preview' && url.pathname === '/cube-preview' && url.searchParams.get('from') === 'lab'))) return
    if (preference.matches || typeof Element.prototype.animate !== 'function') return
    event.preventDefault()
    if (pending) return
    clear()
    trigger = link
    pending = url.href
    veil = makeVeil()
    veil.dataset.phase = 'departure'
    animation = veil.animate([
      {clipPath:'inset(50% 0 50% 0)',opacity:.8},
      {clipPath:'inset(0 0 0 0)',opacity:1},
    ], {duration:DURATION,easing:'cubic-bezier(.45,0,.25,1)',fill:'forwards'})
    animation.finished.then(commit, () => {})
    timer = setTimeout(commit, DURATION + 100)
  }
  const key = event => {
    if (event.key === 'Escape' && veil) {event.preventDefault();clear(true)}
  }
  const onShow = event => { if (event.persisted) clear() }
  const onPreference = () => { if (preference.matches) { if (pending) commit(); else clear() } }
  document.addEventListener('click',click)
  window.addEventListener('keydown',key)
  window.addEventListener('pageshow',onShow)
  preference.addEventListener('change',onPreference)
  arrive()
  return () => {
    clear()
    document.removeEventListener('click',click)
    window.removeEventListener('keydown',key)
    window.removeEventListener('pageshow',onShow)
    preference.removeEventListener('change',onPreference)
  }
}
