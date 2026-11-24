import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Moon, Sun, ArrowLeft } from 'lucide-react'
import useReducedMotion from '../../motion/useReducedMotion.js'
import { canAnimateLink } from '../../motion/useJourneyTransition.js'
import CubeScene from './CubeScene.jsx'
import CubeWorkProjects from './CubeWorkProjects.jsx'
import { cubeUrl, portalDuration, readCubeView } from './cubePortalNavigation.js'
import './CubePortal.css'

function readTheme() {
  try { return localStorage.getItem('sanam-cube-theme') === 'dark' ? 'dark' : 'light' }
  catch { return 'light' }
}

export default function CubePortal({ journey }) {
  const reducedMotion = useReducedMotion()
  useEffect(() => {
    // Standalone About owns a native document navigation; use the same
    // lightweight passage module on each end without replacing its HTML.
    let disposed = false
    let cleanup
    const moduleUrl = new URL('/about/passage.js', window.location.origin).href
    import(/* @vite-ignore */ moduleUrl).then(({ installAboutPassage }) => {
      if (!disposed) cleanup = installAboutPassage()
    }).catch(() => { /* native anchors remain functional */ })
    return () => { disposed = true; cleanup?.() }
  }, [])
  const [theme, setTheme] = useState(readTheme)
  const [hoveredDestination, setHoveredDestination] = useState('')
  const [focusedDestination, setFocusedDestination] = useState('')
  const [phase, setPhase] = useState(() => readCubeView(window.location.hash))
  const stageRef = useRef(null)
  const cubeRef = useRef(null)
  const workLinkRef = useRef(null)
  const workHeadingRef = useRef(null)
  const epochRef = useRef(0)
  const animationRef = useRef(null)
  const goalRef = useRef(readCubeView(window.location.hash))
  const phaseRef = useRef(phase)
  const priorOrigin = useRef({ x: 0, y: 0 })

  useEffect(() => {
    // A temporary review route should not enter search indexes as a second homepage.
    const originalTitle = document.title
    const robots = document.querySelector('meta[name="robots"]')
    const oldRobots = robots?.getAttribute('content')
    document.title = 'Cube Portal Preview | Sanam Rai'
    robots?.setAttribute('content', 'noindex, nofollow')
    return () => {
      document.title = originalTitle
      if (robots && oldRobots !== null) robots.setAttribute('content', oldRobots)
    }
  }, [])

  useEffect(() => {
    try { localStorage.setItem('sanam-cube-theme', theme) } catch { /* storage unavailable */ }
  }, [theme])

  const navigate = useCallback((next, { push = true, focus = true } = {}) => {
    const view = next === 'work' ? 'work' : 'home'
    if (goalRef.current === view && phaseRef.current === view) return
    if (push) window.history.pushState({ cubeView: view }, '', cubeUrl(view))
    goalRef.current = view
    const epoch = ++epochRef.current
    animationRef.current?.cancel()
    animationRef.current = null
    const overlay = stageRef.current
    const element = cubeRef.current
    const rect = element?.getBoundingClientRect()
    const origin = rect ? { x: rect.left + rect.width * 0.52, y: rect.top + rect.height * 0.5 }
      : priorOrigin.current
    priorOrigin.current = origin
    const maxDistance = Math.ceil(Math.hypot(
      Math.max(origin.x, window.innerWidth - origin.x),
      Math.max(origin.y, window.innerHeight - origin.y),
    )) + 48
    const circle = radius => `circle(${radius}px at ${origin.x}px ${origin.y}px)`
    const duration = portalDuration(view, reducedMotion)

    const finish = () => {
      if (epoch !== epochRef.current) return
      phaseRef.current = view
      setPhase(view)
      if (overlay) overlay.style.clipPath = view === 'work' ? 'none' : circle(0)
      if (focus) window.requestAnimationFrame(() => {
        if (epoch === epochRef.current) (view === 'work' ? workHeadingRef : workLinkRef).current?.focus({ preventScroll: true })
      })
    }

    const opening = view === 'work'
    if (opening && overlay) overlay.scrollTop = 0
    phaseRef.current = opening ? 'opening' : 'closing'
    setPhase(phaseRef.current)
    if (!overlay || duration === 0 || typeof overlay.animate !== 'function') {
      finish(); return
    }
    const start = circle(opening ? 0 : maxDistance)
    const end = circle(opening ? maxDistance : 0)
    overlay.style.setProperty('--portal-x', origin.x + 'px')
    overlay.style.setProperty('--portal-y', origin.y + 'px')
    overlay.style.clipPath = start
    const animation = overlay.animate([{ clipPath: start }, { clipPath: end }], {
      duration, delay: opening ? 100 : 0,
      easing: 'cubic-bezier(0.45,0,0.25,1)', fill: 'forwards',
    })
    animationRef.current = animation
    animation.finished.then(() => {
      if (epoch !== epochRef.current) return
      animation.cancel()
      animationRef.current = null
      finish()
    }).catch(() => { /* interrupted by a newer navigation */ })
  }, [reducedMotion])

  useEffect(() => {
    const onPop = () => navigate(readCubeView(window.location.hash), { push: false, focus: true })
    const onKey = event => { if (event.key === 'Escape' && !document.querySelector('.AboutPassageVeil') && goalRef.current === 'work') navigate('home') }
    window.addEventListener('popstate', onPop)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('keydown', onKey)
      epochRef.current += 1
      animationRef.current?.cancel()
    }
  }, [navigate])

  const highlightedDestination = phase === 'home' ? (hoveredDestination || focusedDestination) : ''
  const isWork = phase === 'work'
  const isTransitioning = phase === 'opening' || phase === 'closing'
  return (
    <div className="CubePortal" data-theme={theme} data-phase={phase}>
      <a className="CubeSkip" href={isWork ? '#cube-work-title' : '#cube-title'} onClick={event => {
        if (!canAnimateLink(event)) return
        event.preventDefault()
        document.getElementById(isWork ? 'cube-work-title' : 'cube-title')?.focus()
      }}>Skip to content</a>
      <header className="CubeHeader">
        <a href="#home" className="CubeIdentity" onClick={event => { if (canAnimateLink(event)) { event.preventDefault(); navigate('home') } }} aria-label="Sanam Rai — return to cube home">
          <strong>SR</strong><span aria-hidden="true">/</span><span>SANAM RAI</span>
        </a>
        <div className="CubeHeaderActions">
          <span className="CubeLocation">Software engineer · Nepal</span>
          <button type="button" className="CubeThemeButton" onClick={() => setTheme(current => current === 'light' ? 'dark' : 'light')}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'} aria-pressed={theme === 'dark'}>
            {theme === 'light' ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
          </button>
          <a className="CubeContact" href="mailto:sanamr571@outlook.com">Contact <ArrowUpRight size={15} aria-hidden="true" /></a>
        </div>
      </header>
      <main className="CubeHome" id="cube-main" aria-hidden={isWork} inert={isWork}>
        <section className="CubeIntro" aria-labelledby="cube-title">
          <p className="CubeEyebrow">SOFTWARE ENGINEER</p>
          <h1 id="cube-title" tabIndex="-1">Ideas into <em>systems.</em></h1>
          <p>I design and build reliable software that solves real problems.</p>
          <div className="CubeAccent" aria-hidden="true" />
        </section>
        <div className="CubeUniverse" ref={cubeRef} data-highlight={highlightedDestination}>
          <svg className="CubeOrbit" viewBox="0 0 700 560" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <ellipse cx="350" cy="278" rx="320" ry="169" transform="rotate(-17 350 278)" />
            <ellipse className="CubeOrbitHighlight" cx="350" cy="278" rx="320" ry="169" pathLength="100" transform="rotate(-17 350 278)" />
            <circle cx="100" cy="416" r="3" /><circle cx="522" cy="124" r="3" /><circle cx="625" cy="317" r="3" />
          </svg>
          <CubeScene phase={phase} theme={theme} reducedMotion={reducedMotion} highlighted={Boolean(highlightedDestination)} onJourneyReady={journey?.ready} />
          <nav className="CubeDestinations" aria-label="Explore the portfolio">
            <a className="CubeDestination CubeDestinationWork" onPointerEnter={event => { if (event.pointerType !== 'touch') setHoveredDestination('work') }} onPointerLeave={() => setHoveredDestination('')} onFocus={() => setFocusedDestination('work')} onBlur={() => setFocusedDestination('')} ref={workLinkRef} href="#work" onClick={event => { if (canAnimateLink(event)) { event.preventDefault(); navigate('work') } }}>
              <span aria-hidden="true">▱</span><strong>Work</strong><small>Selected projects</small>
            </a>
            <a className="CubeDestination CubeDestinationLab" onPointerEnter={event => { if (event.pointerType !== 'touch') setHoveredDestination('lab') }} onPointerLeave={() => setHoveredDestination('')} onFocus={() => setFocusedDestination('lab')} onBlur={() => setFocusedDestination('')} href="/lab-preview?from=cube" data-about-passage><span aria-hidden="true">›_</span><strong>Lab</strong><small>Interactive backend</small></a>
            <a className="CubeDestination CubeDestinationGalaxy" onPointerEnter={event => { if (event.pointerType !== 'touch') setHoveredDestination('galaxy') }} onPointerLeave={() => setHoveredDestination('')} onFocus={() => setFocusedDestination('galaxy')} onBlur={() => setFocusedDestination('')} href="/galaxy" onClick={event => journey?.navigate(event, '/galaxy', cubeRef.current?.querySelector('.CubePortalModel'))}><span aria-hidden="true">◌</span><strong>Galaxy</strong><small>Explore</small></a>
            <a className="CubeDestination CubeDestinationAbout" onPointerEnter={event => { if (event.pointerType !== 'touch') setHoveredDestination('about') }} onPointerLeave={() => setHoveredDestination('')} onFocus={() => setFocusedDestination('about')} onBlur={() => setFocusedDestination('')} href="/about?from=cube" data-about-passage><span aria-hidden="true">♙</span><strong>About</strong><small>My story</small></a>
          </nav>
        </div>
        <footer className="CubeHomeFooter">BUILD <span>/</span> EXPLORE <span>/</span> ITERATE</footer>
      </main>
      <main className="CubePortalReveal" ref={stageRef} aria-hidden={!isWork} inert={!isWork}>
        <div className="CubePortalGlimpse" aria-hidden="true">
          <span>01 / SELECTED WORK</span>
          <strong>Built with intention.</strong>
        </div>
        <section className="CubeWork" aria-labelledby="cube-work-title">
          <button type="button" className="CubeWorkBack" onClick={() => navigate('home')}>
            <ArrowLeft size={16} aria-hidden="true" /> Return to cube
          </button>
          <div className="CubeWorkIntro">
            <svg className="WorkChapterOrbit" viewBox="0 0 520 280" aria-hidden="true" focusable="false">
              <ellipse className="WorkOrbitBase" cx="260" cy="140" rx="234" ry="84" transform="rotate(-17 260 140)" />
              <ellipse className="WorkOrbitArc" cx="260" cy="140" rx="234" ry="84" transform="rotate(-17 260 140)" pathLength="100" />
              <ellipse className="WorkOrbitInner" cx="260" cy="140" rx="103" ry="52" transform="rotate(-17 260 140)" />
              <circle className="WorkOrbitNode" cx="260" cy="140" r="4" />
              <circle className="WorkOrbitNode" cx="474" cy="68" r="3" />
              <circle className="WorkOrbitNode" cx="65" cy="211" r="2" />
            </svg>
            <div className="WorkIntroCopy">
              <p className="CubeWorkEyebrow">01 / SELECTED ENGINEERING WORK</p>
              <h1 id="cube-work-title" ref={workHeadingRef} tabIndex="-1">Built with <em>intention.</em></h1>
              <p className="CubeWorkLead">Software systems, developer tools and experiments, each driven by a real problem.</p>
              <div className="WorkChapterRule" aria-hidden="true"><span /></div>
            </div>
          </div>
          <CubeWorkProjects active={isWork} />
          <button type="button" className="CubeWorkBack WorkReturnBottom" onClick={() => navigate('home')}>
            <ArrowLeft size={16} aria-hidden="true" /> Return to cube
          </button>
          <p className="CubeWorkFootnote">Interactive design preview · Existing portfolio and Lab remain unchanged.</p>
        </section>
      </main>
      {isTransitioning && <span className="CubeSrOnly" role="status">{phase === 'opening' ? 'Opening selected work' : 'Returning to portfolio home'}</span>}
    </div>
  )
}
