import { useLayoutEffect, useRef, useState } from 'react'
import axios from 'axios'
import { ArrowDownRight, Activity, Download, ExternalLink } from 'lucide-react'
import API from "./config/api";
import LivingForge from './LivingForge'
import { gsap, MOTION } from './motion'
import useReducedMotion from './motion/useReducedMotion'

const HeroSection = () => {
  const [status, setStatus] = useState(null);
  const heroRef = useRef(null);
  const reducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const hero = heroRef.current;
    if (!hero || reducedMotion) return undefined;

    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: {
          ease: MOTION.ease.enter,
          duration: MOTION.duration.base,
        },
      });

      timeline
        .from('.Eyebrow', {
          autoAlpha: 0,
          y: MOTION.distance.sm,
          duration: MOTION.duration.fast,
        })
        .from('#hero-title > span', {
          autoAlpha: 0,
          y: MOTION.distance.md,
        }, '-=0.12')
        .from('#hero-title > strong', {
          autoAlpha: 0,
          y: MOTION.distance.lg,
        }, '-=0.3')
        .from('.HeroLead', {
          autoAlpha: 0,
          y: MOTION.distance.sm,
        }, '-=0.3')
        .from('.HeroActions .Button', {
          autoAlpha: 0,
          y: MOTION.distance.sm,
          stagger: MOTION.stagger.tight,
          duration: MOTION.duration.fast,
        }, '-=0.3')
        .from('.HeroSystemRow > span', {
          autoAlpha: 0,
          y: MOTION.distance.xs,
          stagger: MOTION.stagger.tight,
          duration: MOTION.duration.fast,
        }, '-=0.24')
        .from('.BackendPing', {
          autoAlpha: 0,
          y: MOTION.distance.xs,
          duration: MOTION.duration.fast,
        }, '-=0.2')
        .from('.HeroPanel', {
          autoAlpha: 0,
          x: MOTION.distance.md,
          duration: MOTION.duration.slow,
        }, '-=0.7');
    }, hero);

    return () => context.revert();
  }, [reducedMotion]);

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
    <section className="HeroSection" id="top" aria-labelledby="hero-title" ref={heroRef}>
      <div className="HeroGrid" aria-hidden="true" />

      <div className="HeroInner">
        <div className="HeroCopy">
          <div className="Eyebrow" data-motion-reveal>
            <span className="StatusDot" aria-hidden="true" />
            Backend-focused full stack developer
          </div>

          <h1 id="hero-title">
            <span data-motion-reveal>Sanam Rai</span>
            <strong data-motion-reveal>I build the systems behind the interface.</strong>
          </h1>

          <p className="HeroLead" data-motion-reveal>
            I design APIs, data flows, authentication, and reliable backend behavior, then connect them to interfaces that make the system easy to understand and use.
          </p>

          <div className="HeroActions" data-motion-reveal>
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

          <div className="HeroSystemRow" aria-label="Primary engineering stack" data-motion-reveal>
            <span>Node.js</span>
            <span>Express</span>
            <span>MongoDB</span>
            <span>JWT</span>
            <span>API architecture</span>
          </div>

          <div className="BackendPing" data-motion-reveal>
            <button type="button" className="BackendPingButton" onClick={getData}>
              <Activity size={17} aria-hidden="true" />
              Ping live backend
            </button>
            <span className="BackendPingStatus" aria-live="polite">
              {status || "Runtime check available"}
            </span>
          </div>
        </div>

        <aside className="HeroPanel" aria-label="Engineering focus" data-motion-reveal>
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
