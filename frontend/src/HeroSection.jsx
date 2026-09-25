import { useState } from 'react'
import axios from 'axios'
import { ArrowDownRight, Activity, Download, ArrowUpRight } from 'lucide-react'
import API from './config/api'

const HeroSection = () => {
  const [status, setStatus] = useState(null)

  const getData = async () => {
    try {
      setStatus('Pinging backend...')
      const res = await axios.get(API + '/api/system')
      setStatus(res.data?.success ? 'Backend online ✓' : 'Backend responded without a success state')
    } catch (error) {
      console.error('Backend ping failed:', error.message)
      setStatus('Backend connection failed')
    }
  }

  return (
    <section className="HeroSection" id="top" aria-labelledby="hero-title">
      <div className="HeroGrid" aria-hidden="true" />
      <div className="HeroInner">
        <div className="HeroCopy">
          <p className="Eyebrow">Backend-focused · Full-stack developer</p>
          <h1 id="hero-title">
            <span>Sanam Rai</span>
            <strong>I build the systems behind the interface.</strong>
          </h1>
          <p className="HeroLead">
            APIs that move data. Rules that protect it. Systems that remain understandable when something goes wrong.
            I work with Node.js, TypeScript, and databases to turn product needs into clear backend behavior.
          </p>
          <div className="HeroActions">
            <a href="#system-controls" className="Button ButtonPrimary">Open Backend Lab <ArrowDownRight size={18} aria-hidden="true" /></a>
            <a href="#selected-work" className="Button ButtonSecondary">View Projects <ArrowUpRight size={17} aria-hidden="true" /></a>
            <a href="/Sanam_Rai_resume.pdf" target="_blank" rel="noreferrer" className="Button ButtonGhost">Resume <Download size={16} aria-hidden="true" /></a>
          </div>
          <div className="HeroSystemRow" aria-label="Engineering focus">
            <span>API contracts</span><span>Authentication</span><span>Data integrity</span><span>Architecture</span>
          </div>
          <div className="BackendPing">
            <button type="button" className="BackendPingButton" onClick={getData}><Activity size={17} aria-hidden="true" />Ping live backend</button>
            <span className="BackendPingStatus" aria-live="polite">{status || 'Runtime check available'}</span>
          </div>
        </div>
        <aside className="HeroPanel" aria-labelledby="hero-contract-title">
          <div className="HeroPanelHead"><span id="hero-contract-title">portfolio / request contract</span><span>01</span></div>
          <div className="ContractBody">
            <p className="ContractMethod"><span>GET</span> /api/projects</p>
            <ol className="ContractSteps">
              <li><span>01</span><div><strong>Define the boundary</strong><p>Validate inputs and verify identity when auth is enabled.</p></div></li>
              <li><span>02</span><div><strong>Resolve the data</strong><p>Check configuration, use the cache, or query MongoDB.</p></div></li>
              <li><span>03</span><div><strong>Make the result explicit</strong><p>Return a predictable response. Keep failures observable.</p></div></li>
            </ol>
          </div>
          <div className="HeroPanelNote">A map of the live demo below. Use the lab to change its behavior.</div>
        </aside>
        <a className="GalaxyInvitation" href="/galaxy"><span>The experimental side</span>Explore Galaxy <ArrowUpRight size={16} aria-hidden="true" /></a>
      </div>
    </section>
  )
}
export default HeroSection
