import React from 'react'
import logo  from './assets/logo.png'
const NavBar = () => {
  return (
    <>
        <nav className='Nav'>
            <a href="" className='NavItem'> <img className= 'img' src={logo} alt="my logo"  /> </a>
            <ul>
                <li><a href="" className='NavItem'>System Controls</a></li>
                <li><a href="" className='NavItem'>Projects</a></li>
                <li><a href="/Sanam_Rai_resume.pdf" target='_blank' rel='noreferrer' download="Sanam_Rai_resume.pdf" className='NavItem'>Resume</a></li>
            </ul>
        </nav>
    </>
)
}

export default NavBar