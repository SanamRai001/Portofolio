import React from 'react'
import logo from './assets/logo.png'

const NavBar = () => {
  return (
    <nav className='Nav' aria-label="Primary navigation">
      <a href="/" className='NavItem flex items-center gap-3' aria-label="Sanam Rai home">
        <img className='img' src={logo} alt="Sanam Rai logo" />
        <span className='hidden sm:inline font-mono text-sm text-gray-300'>SANAM RAI</span>
      </a>
      <ul>
        <li><a href="#system-controls" className='NavItem'>Backend Lab</a></li>
        <li><a href="#projects" className='NavItem'>Projects</a></li>
        <li><a href="/Sanam_Rai_resume.pdf" target='_blank' rel='noreferrer' className='NavItem'>Resume</a></li>
      </ul>
    </nav>
  )
}

export default NavBar