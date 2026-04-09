import React, {useState} from 'react'
import NavBar from './NavBar'
import HeroSection from './HeroSection'
import SystemControl from './SystemControl'
import Footer from './Footer'
import TechStack from './TechStack'
import Projects from './Projects'
import  Form from './Form'
import Logs from './Logs'
const App = () => {
  const [systemToggle, setSystemToggle] = useState({});
  const handleToggle = (toggle)=>{
    setSystemToggle(toggle);
  }
  return (
    <>
        <NavBar className="NavB"></NavBar>
      <div className='Header'>
        <HeroSection className="HeroS" ></HeroSection>
      </div>
      <div id='system-controls'>
        <SystemControl handleToggle = {handleToggle}></SystemControl>
      </div>
      <Logs systemToggle={systemToggle}></Logs>
      <div id='projects'>
        <Projects systemToggle={systemToggle}></Projects>
      </div>
      <Form systemToggle={systemToggle}></Form>
      <TechStack></TechStack>
      <Footer></Footer>
    </>
  )
}

export default App