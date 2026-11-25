// A luminous straight-line slit shared by About and Lab.
// Galaxy retains its separate, already accepted same-document journey.
const EASE = 'cubic-bezier(.45,0,.22,1)'
export const PASSAGE_TIMING = Object.freeze({
  about: Object.freeze({ departure: 540, arrival: 420 }),
  lab: Object.freeze({ departure: 600, arrival: 430 }),
})
const media = () => window.matchMedia('(prefers-reduced-motion: reduce)')
const route = () => window.location.pathname.replace(/\/+$/, '')
const from = () => new URLSearchParams(window.location.search).get('from')

export function passageKind(source, target, context) {
  if (source === '/cube-preview' && context === 'cube') {
    if (target === '/about') return 'about'
    if (target === '/lab-preview') return 'lab'
  }
  if (target === '/cube-preview') {
    if (source === '/about' && context === 'about') return 'about'
    if (source === '/lab-preview' && context === 'lab') return 'lab'
  }
  return null
}

export function passageGeometry(rect, width, height) {
  const x = Math.max(0, Math.min(width, rect ? rect.left + rect.width / 2 : width / 2))
  const y = Math.max(0, Math.min(height, rect ? rect.top + rect.height / 2 : height / 2))
  return { x, y, radius: Math.ceil(Math.hypot(Math.max(x,width-x), Math.max(y,height-y))) + 32 }
}

function makeVeil(kind, returning) {
  const dark = document.documentElement.dataset.theme === 'dark' ||
    document.querySelector('.CubePortal, .LabChapter')?.dataset.theme === 'dark'
  const veil = document.createElement('div')
  veil.className = 'AboutPassageVeil'
  veil.dataset.kind = kind
  veil.dataset.direction = returning ? 'return' : 'outbound'
  veil.setAttribute('aria-hidden', 'true')
  Object.assign(veil.style, {position:'fixed',inset:'0',zIndex:'2147483000',pointerEvents:'auto',overflow:'hidden',isolation:'isolate'})
  const element = (name,style,parent=veil) => {
    const el = document.createElement('div')
    el.className = name
    Object.assign(el.style,style)
    parent.append(el)
    return el
  }
  const shade = element('ChapterPassageShade',{position:'absolute',inset:'0',background:dark?'#0a1119':'#f6f3ec'})
  const line = element('ChapterPassageLine',{
    position:'absolute',left:0,right:0,top:'50%',height:'2px',marginTop:'-1px',
    transformOrigin:returning?'right center':'left center',
    background:'linear-gradient(90deg,#b98038,#ffcf84 30%,#fff2cb 55%,#d49443)',
    boxShadow:'0 0 7px #ffd18c,0 0 22px #e9a94b99,0 0 52px #e9a94b44',
  })
  const bloom = element('ChapterPassageBloom',{
    position:'absolute',inset:'0',pointerEvents:'none',
    background:'radial-gradient(ellipse 75% 11% at 50% 50%,#ffc46d44,transparent 90%)',
  })
  const pulse = element('ChapterPassagePulse',{
    position:'absolute',top:'50%',left:0,width:kind==='lab'?'12%':'24%',height:'3px',marginTop:'-1px',
    background:'linear-gradient(90deg,transparent,#fff4d7,transparent)',
    boxShadow:'0 0 16px #ffcf84',pointerEvents:'none',
  })
  document.body.append(veil)
  return {veil,shade,line,bloom,pulse}
}

function playPassage(parts, kind, phase, returning) {
  const arriving = phase === 'arrival'
  const duration = PASSAGE_TIMING[kind][phase]
  const {shade,line,bloom,pulse} = parts
  const animations = []
  const play = (el, frames, extra={}) => {
    const a = el.animate(frames,{duration,easing:EASE,fill:'both',...extra})
    a.finished.catch(() => {})
    animations.push(a)
    return a
  }
  const slit = 'inset(50% 0 50% 0)'
  const full = 'inset(0 0 0 0)'
  const cover = play(shade, arriving
    ? [{clipPath:full},{clipPath:full,offset:.08},{clipPath:slit,offset:.78},{clipPath:slit}]
    : [{clipPath:slit},{clipPath:slit,offset:.30},{clipPath:full,offset:.94},{clipPath:full}])
  play(line, arriving
    ? [{transform:'scaleX(1)',opacity:0},{transform:'scaleX(1)',opacity:.9,offset:.65},{transform:'scaleX(0)',opacity:0}]
    : [{transform:'scaleX(0)',opacity:0},{transform:'scaleX(1)',opacity:1,offset:.30},{transform:'scaleX(1)',opacity:.7,offset:.65},{transform:'scaleX(1)',opacity:0}])
  play(bloom,arriving
    ? [{opacity:0},{opacity:.85,offset:.70},{opacity:0}]
    : [{opacity:0},{opacity:kind==='lab'?.9:.65,offset:.37},{opacity:0}])
  const start = returning?'translateX(830%)':'translateX(-110%)'
  const end = returning?'translateX(-110%)':'translateX(830%)'
  play(pulse,[{transform:start,opacity:0},{opacity:arriving?.5:1,offset:.18},{opacity:.65,offset:.43},{transform:end,opacity:0,offset:.68},{transform:end,opacity:0}])
  return {cover,animations,duration}
}

let arrivalPlayed = false
export function installAboutPassage() {
  let veil = null
  let animations = []
  let timer = null
  let pending = null
  let trigger = null
  let inertNodes = []
  let committed = false
  let generation = 0
  const preference = media()
  const blockPage = () => {
    inertNodes = [...document.body.children].filter(node =>
      node !== veil && !node.inert && !['SCRIPT','STYLE','LINK'].includes(node.tagName))
    inertNodes.forEach(node => { node.inert = true })
  }
  const clear = (restore = false) => {
    generation += 1
    clearTimeout(timer)
    timer = null
    pending = null
    committed = false
    inertNodes.forEach(node => { node.inert = false })
    inertNodes = []
    animations.forEach(animation => animation.cancel())
    animations = []
    veil?.remove()
    veil = null
    if (restore) trigger?.focus({preventScroll:true})
    trigger = null
  }
  const start = (kind, phase, returning, finish) => {
    const parts = makeVeil(kind, returning)
    veil = parts.veil
    veil.dataset.phase = phase
    blockPage()
    const token = ++generation
    const motion = playPassage(parts, kind, phase, returning)
    animations = motion.animations
    const settle = () => { if (generation === token) finish() }
    motion.cover.finished.then(settle, () => {})
    timer = setTimeout(settle, motion.duration + 100)
  }
  const arrive = () => {
    if (arrivalPlayed || preference.matches || typeof Element.prototype.animate !== 'function') return
    const returning = route() === '/cube-preview'
    const kind = returning ? passageKind(from() === 'about' ? '/about' : '/lab-preview', route(), from())
      : passageKind('/cube-preview', route(), from())
    if (!kind) return
    arrivalPlayed = true
    try { start(kind,'arrival',returning,() => clear()) }
    catch { clear() }
  }
  const commit = () => {
    if (!pending) return
    const destination = pending
    pending = null
    clearTimeout(timer)
    timer = null
    committed = true
    timer = setTimeout(() => clear(true), 1800)
    try { window.location.assign(destination) } catch { clear(true) }
  }
  const click = event => {
    const link = event.target.closest?.('a[data-about-passage]')
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey ||
      event.ctrlKey || event.shiftKey || event.altKey || link.hasAttribute('download') ||
      (link.target && link.target !== '_self')) return
    const url = new URL(link.href, location.href)
    const kind = url.origin === location.origin && passageKind(route(),url.pathname,url.searchParams.get('from'))
    if (!kind || preference.matches || typeof Element.prototype.animate !== 'function') return
    event.preventDefault()
    if (pending || committed) return
    clear()
    trigger = link
    pending = url.href
    const returning = url.pathname === '/cube-preview'
    try { start(kind,'departure',returning,commit) }
    catch { clear(); window.location.assign(url.href) }
  }
  const key = event => {
    if (event.key === 'Escape' && veil && !committed) {event.preventDefault();clear(true)}
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
