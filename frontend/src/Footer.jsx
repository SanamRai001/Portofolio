import React from 'react'
import { FaGithub } from "react-icons/fa";
import { FaLinkedin } from "react-icons/fa";
import { MdEmail } from "react-icons/md";

const Footer = () => {
  return (
    <>
        <div className='MainFooter'>
            <div className='UpperFooter'>
                <div>
                    <h1>System Core</h1>
                    <p>Specialized in building high-availablity distributed systems, secure APIs gateways, and scalable microservices architecture.</p>
                </div>
                <div>
                    <h1>Quick Access</h1>
                    <ul>
                        <li><a href="#system-controls">SystemControl</a></li>
                        <li><a href="#Project">Projects</a></li>
                        <li><a href="/Sanam_Rai_resume.pdf" target='_blank' rel='noreferrer' download="Sanam_Rai_resume.pdf" className='NavItem'>Resume</a></li>
                    </ul>
                </div>
                <div>
                    <h1>Status</h1>
                    <h4>All systems operational</h4>
                    <ul className="social-icons">
                        <li>
                            <a href="https://github.com/SanamRai001" target="_blank">
                            <FaGithub></FaGithub>
                            </a>
                        </li>

                        <li>
                            <a href="https://www.linkedin.com/in/sanam-rai-6b2149212/" target="_blank">
                            <FaLinkedin></FaLinkedin>
                            </a>
                        </li>

                        <li>
                            <a href="mailto:sanamr571@outlook.com">
                            <MdEmail></MdEmail>
                            </a>
                        </li>
                        </ul>
                </div>
            </div>
            <hr />
            <div className='LowerFooter'>
                <div>© 2026 Backend Developer Portfolio. Built for scale.</div>
            </div>
        </div>
    </>
  )
}

export default Footer