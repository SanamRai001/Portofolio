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

const App = () => {
  const [systemToggle, setSystemToggle] = useState({});

  const handleToggle = useCallback((toggle) => {
    setSystemToggle(toggle);
  }, []);

  const showAuthOverlay = systemToggle.auth && !localStorage.getItem("token");

  return (
    <>
      {showAuthOverlay && (
        <div className="AuthOverlay" role="dialog" aria-modal="true" aria-label="Backend lab authentication">
          <Form systemToggle={systemToggle} />
        </div>
      )}

      <NavBar />

      <div className={"SiteShell" + (showAuthOverlay ? " Blurred" : "")} aria-hidden={showAuthOverlay || undefined}>
        <main>
          <HeroSection />
          <ArchitectureStory />
          <InfoSection />

          <div id="system-controls">
            <SystemControl handleToggle={handleToggle} />
          </div>

          <Logs systemToggle={systemToggle} />

          <div id="projects">
            <Projects systemToggle={systemToggle} />
          </div>

          <TechStack />
        </main>

        <Footer />
      </div>
    </>
  )
}

export default App
