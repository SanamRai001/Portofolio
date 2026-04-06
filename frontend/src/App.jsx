import React, {useState} from 'react'
import NavBar from './NavBar'
import HeroSection from './HeroSection'
import SystemControl from './SystemControl'
import Footer from './Footer'
import TechStack from './TechStack'
import Projects from './Projects'
import  Form from './Form'
const App = () => {
  const [systemToggle, setSystemToggle] = useState({});
  const handleToggle = (toggle)=>{
    setSystemToggle(toggle);
  }
  return (
    <>
      <div className='Header'>
        <NavBar className="NavB"></NavBar>
        <HeroSection className="HeroS" ></HeroSection>
      </div>
      <SystemControl handleToggle = {handleToggle}></SystemControl>
      <Projects systemToggle={systemToggle}></Projects>
      <Form systemToggle={systemToggle}></Form>
      <TechStack></TechStack>
      <Footer></Footer>
    </>
  )
}

export default App