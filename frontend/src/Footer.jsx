import { FaGithub, FaLinkedin } from "react-icons/fa";
import { MdEmail } from "react-icons/md";

const Footer = () => {
  return (
    <footer className="MainFooter" id="contact">
      <div className="SectionShell">
        <div className="FooterTop">
          <div className="FooterIntro">
            <span className="BrandMark" aria-hidden="true">SR</span>
            <div>
              <p className="SectionKicker">Sanam Rai</p>
              <h2>Build useful systems. Keep learning how they work.</h2>
              <p>Backend-focused full stack developer exploring architecture, reliable products, and modern AI systems.</p>
            </div>
          </div>

          <div className="FooterLinks">
            <div>
              <h3>Navigate</h3>
              <a href="#about">About</a>
              <a href="#system-controls">Backend Lab</a>
              <a href="#projects">Projects</a>
              <a href="/Sanam_Rai_resume.pdf" target="_blank" rel="noreferrer">Resume</a>
            </div>

            <div>
              <h3>Connect</h3>
              <a href="https://github.com/SanamRai001" target="_blank" rel="noopener noreferrer"><FaGithub aria-hidden="true" />GitHub</a>
              <a href="https://www.linkedin.com/in/sanam-rai-6b2149212/" target="_blank" rel="noopener noreferrer"><FaLinkedin aria-hidden="true" />LinkedIn</a>
              <a href="mailto:sanamr571@outlook.com"><MdEmail aria-hidden="true" />Email</a>
            </div>
          </div>
        </div>

        <div className="FooterBottom">
          <span>© 2026 Sanam Rai</span>
          <span>Backend · Systems · AI · Full Stack</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
