const NavBar = () => {
  return (
    <nav className="Nav" aria-label="Primary navigation">
      <div className="NavInner">
        <a href="#top" className="Brand" aria-label="Sanam Rai home">
          <span className="BrandMark" aria-hidden="true">SR</span>
          <span className="BrandCopy">
            <strong>Sanam Rai</strong>
            <small>Backend · Systems · Full Stack</small>
          </span>
        </a>

        <ul className="NavLinks">
          <li><a href="#about" className="NavItem">About</a></li>
          <li><a href="#system-controls" className="NavItem NavItemPrimary">Backend Lab</a></li>
          <li><a href="#projects" className="NavItem">Projects</a></li>
          <li><a href="/Sanam_Rai_resume.pdf" target="_blank" rel="noreferrer" className="NavItem">Resume</a></li>
        </ul>
      </div>
    </nav>
  )
}

export default NavBar
