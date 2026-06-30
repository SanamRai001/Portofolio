import React, { useState } from 'react'
import NavBar from './NavBar'
import HeroSection from './HeroSection'
import SystemControl from './SystemControl'
import Footer from './Footer'
import TechStack from './TechStack'
import Projects from './Projects'
import Form from './Form'
import InfoSection from './InfoSection'
import Logs from './Logs'

const App = () => {
  const [systemToggle, setSystemToggle] = useState({});
  const handleToggle = (toggle) => {
    setSystemToggle(toggle);
  }

  const showAuthOverlay = systemToggle.auth && !localStorage.getItem("token");

  return (
    <>
      {showAuthOverlay && (
        <div className='AuthOverlay'>
          <Form systemToggle={systemToggle}></Form>
        </div>
      )}
      <NavBar></NavBar>
      <div className={showAuthOverlay ? "Blurred" : ""}>
        <div className='Header'>
          <HeroSection></HeroSection>
        </div>
        <div>
          <InfoSection></InfoSection>
        </div>
        <div id='system-controls'>
          <SystemControl handleToggle={handleToggle}></SystemControl>
        </div>
        <Logs systemToggle={systemToggle}></Logs>
        <div id='projects'>
          <Projects systemToggle={systemToggle}></Projects>
        </div>
        <TechStack></TechStack>
        <Footer></Footer>
      </div>
    </>
  )
}
export default App