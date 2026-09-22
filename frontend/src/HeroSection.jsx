import { useState } from 'react'
import axios from 'axios'
import { ArrowDownRight, Activity, Download, ExternalLink } from 'lucide-react'
import API from "./config/api";
import LivingForge from './LivingForge'

const HeroSection = () => {
  const [status, setStatus] = useState(null);

  const getData = async () => {
    try {
      setStatus("Pinging backend...");
      const res = await axios.get(API + "/api/system");
      setStatus(res.data?.success ? "Backend online ✓" : "Backend responded without a success state");
    } catch (error) {
      console.log("Error", error);
      setStatus("Backend connection failed");
    }
  }

  return (
    <section className="HeroSection" id="top" aria-labelledby="hero-title">
      <div className="HeroGrid" aria-hidden="true" />

      <div className="HeroInner">
        <div className="HeroCopy">
          <div className="Eyebrow">
            <span className="StatusDot" aria-hidden="true" />
            Backend-focused full stack developer
          </div>

          <h1 id="hero-title">
            <span>Sanam Rai</span>
            <strong>I build the systems behind the interface.</strong>
          </h1>

          <p className="HeroLead">
            I design APIs, data flows, authentication, and reliable backend behavior, then connect them to interfaces that make the system easy to understand and use.
          </p>

          <div className="HeroActions">
            <a href="#system-controls" className="Button ButtonPrimary">
              Open Backend Lab
              <ArrowDownRight size={18} aria-hidden="true" />
            </a>

            <a href="#projects" className="Button ButtonSecondary">
              View Projects
              <ExternalLink size={17} aria-hidden="true" />
            </a>

            <a href="/Sanam_Rai_resume.pdf" target="_blank" rel="noreferrer" className="Button ButtonGhost">
              Resume
              <Download size={16} aria-hidden="true" />
            </a>
          </div>

          <div className="HeroSystemRow" aria-label="Primary engineering stack">
            <span>Node.js</span>
            <span>Express</span>
            <span>MongoDB</span>
            <span>JWT</span>
            <span>API architecture</span>
          </div>

          <div className="BackendPing">
            <button type="button" className="BackendPingButton" onClick={getData}>
              <Activity size={17} aria-hidden="true" />
              Ping live backend
            </button>
            <span className="BackendPingStatus" aria-live="polite">
              {status || "Runtime check available"}
            </span>
          </div>
        </div>

        <aside className="HeroPanel" aria-label="Engineering focus">
          <div className="HeroPanelHead">
            <span className="TerminalDots" aria-hidden="true"><i /><i /><i /></span>
            <span>builder.profile</span>
          </div>

          <div className="HeroPanelBody">
            <div className="CodeLine"><span>focus</span><strong>backend systems</strong></div>
            <div className="CodeLine"><span>default</span><strong>simple + maintainable</strong></div>
            <div className="CodeLine"><span>method</span><strong>build → inspect → improve</strong></div>
            <div className="CodeLine"><span>learning</span><strong>architecture + AI systems</strong></div>
          </div>

          <div className="HeroPanelNote">
            <span className="PanelPulse" aria-hidden="true" />
            The backend lab below changes the running application, not a fake dashboard.
          </div>
        </aside>
      </div>

      <LivingForge />
    </section>
  )
}

export default HeroSection
