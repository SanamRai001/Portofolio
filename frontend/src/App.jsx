import React from 'react'
import NavBar from './NavBar'
import HeroSection from './HeroSection'
import SystemControl from './SystemControl'
import Footer from './Footer'
import TechStack from './TechStack'
import Projects from './Projects'
import  Form from './Form'
const App = () => {
  return (
    <>
      <div className='Header'>
        <NavBar className="NavB"></NavBar>
        <HeroSection className="HeroS" ></HeroSection>
      </div>
      <SystemControl ></SystemControl>
      <Projects></Projects>
      <Form></Form>
      <TechStack></TechStack>
      <Footer></Footer>
    </>
  )
}

export default App