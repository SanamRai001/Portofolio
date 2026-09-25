import { useCallback, useRef, useState } from 'react'
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

const App = () => {
  const [systemToggle, setSystemToggle] = useState({});
  const mainRef = useRef(null);

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
    <>
      {showAuthOverlay && (
        <div
          className="AuthOverlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-dialog-title"
          aria-describedby="auth-dialog-description"
        >
          <Form systemToggle={systemToggle} />
        </div>
      )}

      <div
        className="AppBackground"
        inert={showAuthOverlay}
        aria-hidden={showAuthOverlay || undefined}
      >
        <a className="SkipLink" href="#main-content">Skip to content</a>
        <NavBar />

        <div className={"SiteShell" + (showAuthOverlay ? " Blurred" : "")}>
          <main id="main-content" tabIndex="-1" ref={mainRef}>
            <HeroSection />
            <div data-reveal><InfoSection /></div>
            <div data-reveal><ArchitectureStory /></div>

            <div id="system-controls" data-reveal>
              <SystemControl handleToggle={handleToggle} />
            </div>

            <Logs systemToggle={systemToggle} suspended={suspendBackground} />

            <div data-reveal><ProjectStory /></div>

            <div id="projects" data-reveal>
              <Projects systemToggle={systemToggle} />
            </div>

            <div data-reveal><TechStack /></div>
          </main>

          <Footer />
        </div>
      </div>
    </>
  )
}

export default App
