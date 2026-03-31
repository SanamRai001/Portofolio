import React from 'react'

const NavBar = () => {
  return (
    <>
        <nav className='Nav'>
            <a href="" className='NavItem'>Logo Image</a>
            <ul>
                <li><a href="" className='NavItem'>System Controls</a></li>
                <li><a href="" className='NavItem'>Projects</a></li>
                <li><a href="" className='NavItem'>Resume</a></li>
                <button>Fetch Data</button>  
            </ul>
        </nav>
    </>
)
}

export default NavBar