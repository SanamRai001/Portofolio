import { useCallback, useEffect, useRef, useState } from 'react'
import LabChapterHeader from './LabChapterHeader.jsx'
import './LabChapter.css'
import './index.css'
import NavBar from './NavBar'
import HeroSection from './HeroSection'
import ArchitectureStory from './ArchitectureStory'
import SystemControl from './SystemControl'
import Footer from './Footer'
import TechStack from './TechStack'
import Projects from './Projects'
import ProjectStory from './ProjectStory'
import Form from './Form'
import InfoSection from './InfoSection'
import Logs from './Logs'
import { deriveAuthRuntimeState } from './authRuntime'
import useSectionReveals from './motion/useSectionReveals'

const App = ({ labPreview = false }) => {
  const [systemToggle, setSystemToggle] = useState({});
  const mainRef = useRef(null);
  const [theme, setTheme] = useState(() => {
    if (!labPreview) return 'dark'
    try { return localStorage.getItem('sanam-cube-theme') === 'dark' ? 'dark' : 'light' }
    catch { return 'light' }
  })
  useEffect(() => {
    if (!labPreview) return
    try { localStorage.setItem('sanam-cube-theme', theme) } catch { /* storage unavailable */ }
  }, [labPreview, theme])
  useEffect(() => {
    if (!labPreview) return
    const title = document.title
    const robots = document.querySelector('meta[name="robots"]')
    const previous = robots?.getAttribute('content')
    document.title = 'Backend Lab Preview | Sanam Rai'
    robots?.setAttribute('content', 'noindex, nofollow')
    let disposed = false
    let cleanup
    const moduleUrl = new URL('/about/passage.js', window.location.origin).href
    import(/* @vite-ignore */ moduleUrl).then(({ installAboutPassage }) => {
      if (!disposed) cleanup = installAboutPassage()
    }).catch(() => { /* native links work without motion */ })
    return () => {
      disposed = true
      cleanup?.()
      document.title = title
      if (previous !== null && previous !== undefined) robots?.setAttribute('content', previous)
    }
  }, [labPreview])

  const handleToggle = useCallback((toggle) => {
    setSystemToggle(toggle);
  }, []);

  const authRuntime = deriveAuthRuntimeState(
    systemToggle.auth,
    localStorage.getItem("token"),
  );
  const showAuthOverlay = authRuntime.showAuthOverlay;
  const suspendBackground = authRuntime.suspendBackground;
  useSectionReveals(mainRef, suspendBackground);

  return (
    <div className={labPreview ? 'LabChapter' : undefined} data-theme={labPreview ? theme : undefined}>
      {showAuthOverlay && (
        <div
          className="AuthOverlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-dialog-title"
          aria-describedby="auth-dialog-description"
        >
          <Form systemToggle={systemToggle} />
          {labPreview && <a className="LabAuthExit" href="/cube-preview?from=lab" data-about-passage>← Return to cube</a>}
        </div>
      )}

      <div
        className="AppBackground"
        inert={showAuthOverlay}
        aria-hidden={showAuthOverlay || undefined}
      >
        <a className="SkipLink" href="#main-content">Skip to content</a>
        {labPreview ? <LabChapterHeader theme={theme} onTheme={() => setTheme(value => value === 'dark' ? 'light' : 'dark')} /> : <NavBar />}

        <div className={"SiteShell" + (showAuthOverlay ? " Blurred" : "")}>
          <main id="main-content" tabIndex="-1" ref={mainRef}>
            {labPreview ? <section className="LabChapterIntro SectionShell" aria-labelledby="lab-chapter-title">
              <svg className="LabChapterOrbit" viewBox="0 0 500 180" aria-hidden="true" focusable="false"><path d="M8 90H110L146 34H254L290 145H390L422 90H492" /><circle cx="146" cy="34" r="4"/><circle cx="290" cy="145" r="4"/><circle cx="422" cy="90" r="3"/></svg>
              <p className="SectionKicker">02 / THE LAB</p>
              <h1 id="lab-chapter-title">Beyond the <em>interface.</em></h1>
              <p>Explore the running backend. Change a configuration, inspect its request path, and observe the real API response.</p>
              <div className="LabChapterRule" aria-hidden="true"/>
            </section> : <>
              <HeroSection />
              <div data-reveal><InfoSection /></div>
              <div data-reveal><ArchitectureStory /></div>
            </>}

            <div id="system-controls" data-reveal>
              <SystemControl handleToggle={handleToggle} />
            </div>

            <Logs systemToggle={systemToggle} suspended={suspendBackground} />

            {!labPreview && <div data-reveal><ProjectStory /></div>}

            <div id="projects" data-reveal>
              <Projects systemToggle={systemToggle} />
            </div>

            {!labPreview && <div data-reveal><TechStack /></div>}
          </main>

          {labPreview ? <footer className="LabChapterFooter SectionShell"><a href="/cube-preview?from=lab" data-about-passage>← Return to cube</a><span>Live configuration · Shared backend</span></footer> : <Footer />}
        </div>
      </div>
    </div>
  )
}

export default App
