import { useCallback, useState } from 'react'
import NavBar from './NavBar'
import HeroSection from './HeroSection'
import ArchitectureStory from './ArchitectureStory'
import SystemControl from './SystemControl'
import Footer from './Footer'
import TechStack from './TechStack'
import Projects from './Projects'
import Form from './Form'
import InfoSection from './InfoSection'
import Logs from './Logs'
import { deriveAuthRuntimeState } from './authRuntime'

const App = () => {
  const [systemToggle, setSystemToggle] = useState({});

  const handleToggle = useCallback((toggle) => {
    setSystemToggle(toggle);
  }, []);

  const authRuntime = deriveAuthRuntimeState(
    systemToggle.auth,
    localStorage.getItem("token"),
  );
  const showAuthOverlay = authRuntime.showAuthOverlay;

  return (
    <>
      {showAuthOverlay && (
        <div className="AuthOverlay" role="dialog" aria-modal="true" aria-label="Backend lab authentication">
          <Form systemToggle={systemToggle} />
        </div>
      )}

      <div
        className="AppBackground"
        inert={showAuthOverlay ? "" : undefined}
        aria-hidden={showAuthOverlay || undefined}
      >
        <a className="SkipLink" href="#main-content">Skip to content</a>
        <NavBar />

        <div className={"SiteShell" + (showAuthOverlay ? " Blurred" : "")}>
          <main id="main-content" tabIndex="-1">
            <HeroSection suspended={showAuthOverlay} />
            <ArchitectureStory />
            <InfoSection />

            <div id="system-controls">
              <SystemControl handleToggle={handleToggle} />
            </div>

            <Logs systemToggle={systemToggle} suspended={showAuthOverlay} />

            <div id="projects">
              <Projects systemToggle={systemToggle} />
            </div>

            <TechStack />
          </main>

          <Footer />
        </div>
      </div>
    </>
  )
}

export default App
