// Native-document choreography for the editorial and technical chapters.
// Galaxy retains its separate, already accepted same-document journey.
const EASE = 'cubic-bezier(.45,0,.22,1)'
const SVG = 'http://www.w3.org/2000/svg'
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

function originFor(element) {
  return passageGeometry(element?.getBoundingClientRect(), innerWidth, innerHeight)
}

function svgNode(tag, attrs, parent) {
  const node = document.createElementNS(SVG, tag)
  for (const [key,value] of Object.entries(attrs)) node.setAttribute(key, String(value))
  if (parent) parent.append(node)
  return node
}

function makeVeil(kind, returning) {
  const dark = document.documentElement.dataset.theme === 'dark' ||
    document.querySelector('.CubePortal, .LabChapter')?.dataset.theme === 'dark'
  const bg = dark ? '#0a1119' : '#f6f3ec'
  const gold = dark ? '#e8bc83' : '#94662c'
  const veil = document.createElement('div')
  veil.className = 'AboutPassageVeil'
  veil.dataset.kind = kind
  veil.dataset.direction = returning ? 'return' : 'outbound'
  veil.setAttribute('aria-hidden', 'true')
  Object.assign(veil.style, {
    position:'fixed', inset:'0', zIndex:'2147483000', pointerEvents:'auto',
    overflow:'hidden', isolation:'isolate',
  })
  const shade = document.createElement('div')
  shade.className = 'ChapterPassageShade'
  Object.assign(shade.style, {position:'absolute',inset:'0',background:bg})
  veil.append(shade)

  const motif = document.createElement('div')
  motif.className = 'ChapterPassageMotif'
  Object.assign(motif.style, {
    position:'absolute',left:'50%',top:'50%',width:'min(350px, 78vw)',aspectRatio:'360 / 210',
    transform:'translate(-50%,-50%)',pointerEvents:'none',color:gold,
  })
  const svg = svgNode('svg',{viewBox:'0 0 360 210',width:'100%',height:'100%',fill:'none','aria-hidden':'true'},motif)
  const traces = [], nodes = []
  const trace = (d, width=1.4) => {
    const p = svgNode('path',{d,stroke:gold,'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round',pathLength:100,'stroke-dasharray':100,'stroke-dashoffset':100},svg)
    traces.push(p)
    return p
  }
  const dot = (cx,cy,r=3) => {
    const el = svgNode('circle',{cx,cy,r,fill:gold},svg)
    el.style.opacity = '0'
    nodes.push(el)
  }
  let emblem
  if (kind === 'about') {
    svgNode('ellipse',{cx:180,cy:105,rx:158,ry:56,transform:'rotate(-17 180 105)',stroke:gold,'stroke-width':.7,opacity:.22},svg)
    svgNode('ellipse',{cx:180,cy:105,rx:91,ry:37,transform:'rotate(-17 180 105)',stroke:gold,'stroke-width':.6,opacity:.18,'stroke-dasharray':'2 6'},svg)
    trace('M29 141 C-9 116 78 52 163 49 C245 23 333 48 339 77 C346 116 255 161 171 165 C100 174 50 164 29 141',1.6)
    trace('M92 126 C121 78 216 60 266 84 C303 106 240 143 180 142',.9)
    dot(29,141,3);dot(339,77,3);dot(266,84,2.5)
    emblem = svgNode('text',{x:180,y:119,'text-anchor':'middle',fill:gold,'font-family':'Georgia,serif','font-size':45,'letter-spacing':-4},svg)
    emblem.textContent = 'SR'
  } else {
    const paths = [
      'M12 105 H71 L112 54 H174',
      'M71 105 H174',
      'M71 105 L112 156 H174',
      'M186 54 H246 L289 105 H348',
      'M186 105 H289',
      'M186 156 H246 L289 105',
    ]
    paths.forEach(d => svgNode('path',{d,stroke:gold,'stroke-width':.65,opacity:.18},svg))
    paths.forEach(d => trace(d))
    ;[[12,105],[71,105],[180,54],[180,105],[180,156],[289,105],[348,105]].forEach(([x,y]) => dot(x,y,3))
    emblem = svgNode('g',{stroke:gold,'stroke-width':1.35,'stroke-linecap':'round','stroke-linejoin':'round'},svg)
    svgNode('rect',{x:160,y:85,width:40,height:40,rx:8,fill:bg},emblem)
    svgNode('path',{d:'M170 99 L176 105 L170 111 M182 111 H190'},emblem)
  }
  emblem.style.opacity = '0'
  veil.append(motif)
  document.body.append(veil)
  return {veil,shade,motif,traces,nodes,emblem}
}

function playPassage(parts, kind, phase, returning, origin) {
  const arriving = phase === 'arrival'
  const duration = PASSAGE_TIMING[kind][phase]
  const {shade,motif,traces,nodes,emblem} = parts
  const animations = []
  const play = (el, frames, extra={}) => {
    const a = el.animate(frames,{duration,easing:EASE,fill:'both',...extra})
    // Every animation can be interrupted during Escape, history or cleanup.
    a.finished.catch(() => {})
    animations.push(a)
    return a
  }
  const circle = radius => 'circle(' + radius + 'px at ' + origin.x + 'px ' + origin.y + 'px)'
  const cover = play(shade, arriving
    ? [{clipPath:circle(origin.radius)}, {clipPath:circle(origin.radius),offset:.18}, {clipPath:circle(0)}]
    : [{clipPath:circle(0)}, {clipPath:circle(origin.radius)}])
  const center = 'translate(-50%,-50%) scale(1)'
  const displaced = 'translate(calc(-50% + ' + (origin.x-innerWidth/2) + 'px),calc(-50% + ' + (origin.y-innerHeight/2) + 'px)) scale(.28)'
  // A single shared motif crosses the page boundary; return resolves toward the cube.
  play(motif, arriving
    ? [{transform:center,opacity:1},{transform:center,opacity:1,offset:.22},{transform:returning ? displaced : 'translate(-50%,-50%) scale(1.10)',opacity:0}]
    : [{transform:returning ? 'translate(-50%,-50%) scale(1.10)' : displaced,opacity:0},{transform:center,opacity:1,offset:.72},{transform:center,opacity:1}])
  traces.forEach((path,i) => {
    const offset = kind === 'lab' && i >= 3 ? .24 : .06
    play(path, arriving
      ? [{strokeDashoffset:0},{strokeDashoffset:0,offset:.18},{strokeDashoffset:100}]
      : [{strokeDashoffset:returning ? -100 : 100},{strokeDashoffset:returning ? -100 : 100,offset},{strokeDashoffset:0,offset:.86},{strokeDashoffset:0}])
  })
  nodes.forEach((node,i) => {
    const offset = Math.min(.65,.20+i*.055)
    play(node, arriving
      ? [{opacity:1},{opacity:1,offset:.22},{opacity:0}]
      : [{opacity:0},{opacity:0,offset},{opacity:1,offset:Math.min(.90,offset+.16)},{opacity:1}])
  })
  play(emblem, arriving
    ? [{opacity:1},{opacity:1,offset:.20},{opacity:0}]
    : [{opacity:0},{opacity:0,offset:.38},{opacity:1,offset:.82},{opacity:1}])
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
  const start = (kind, phase, returning, origin, finish) => {
    const parts = makeVeil(kind, returning)
    veil = parts.veil
    veil.dataset.phase = phase
    blockPage()
    const token = ++generation
    const motion = playPassage(parts, kind, phase, returning, origin)
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
    const cube = returning && location.hash !== '#work' ? document.querySelector('.CubePortalModel') : null
    try { start(kind,'arrival',returning,originFor(cube),() => clear()) }
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
    const cube = !returning && document.querySelector('.CubePortal[data-phase="home"] .CubePortalModel')
    try { start(kind,'departure',returning,originFor(cube || null),commit) }
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
