import { ArrowUpRight } from 'lucide-react'
import { FaGithub } from 'react-icons/fa'
import initialProjects from './data/initialproject'
import './ProjectStory.css'

const engineering = {
  '1': { category: 'Commerce / data flows', problem: 'Connect Nepali farmers with buyers through a direct produce marketplace.', architecture: 'JWT authentication → cart state → checkout → MongoDB', decision: 'Keep Cart and Buy Now flows distinct while persisting cart state in MongoDB.' },
  '2': { category: 'API / runtime behavior', problem: 'Make backend capabilities visible and testable through one portfolio.', architecture: 'Configuration → authentication → safe logging → cache / MongoDB', decision: 'Validate configuration changes, synchronize the UI with the API, and revert failed updates.' },
  '3': { category: 'Realtime / identity', problem: 'Support private conversations and presence across connected users.', architecture: 'JWT handshake → Socket.IO → private messages → MongoDB', decision: 'Verify identity on the server during the WebSocket handshake.' },
}

export default function ProjectStory() {
  return (
    <section className="ProjectStory" id="selected-work" aria-labelledby="selected-work-title">
      <div className="SectionShell">
        <div className="SectionHeading SectionHeadingSplit">
          <div><p className="SectionKicker">Selected systems</p><h2 id="selected-work-title">Projects, through an engineering lens.</h2></div>
          <p>The problem, the data path, and the decisions behind the interface.</p>
        </div>
        <div className="CaseStudies">
          {initialProjects.slice(0, 3).map((project, index) => {
            const detail = engineering[project._id]
            return (
              <article className="CaseStudy" key={project._id}>
                <div className="CaseStudySummary">
                  <p className="CaseStudyMeta">{String(index + 1).padStart(2, '0')} / {detail.category}</p>
                  <h3>{project.name}</h3>
                  <p>{detail.problem}</p>
                  <div className="CaseStudyLinks">
                    {project.github && <a href={project.github} target="_blank" rel="noopener noreferrer"><FaGithub aria-hidden="true" />Source<span className="VisuallyHidden"> for {project.name}</span></a>}
                    {project.liveDemo && <a href={project.liveDemo} target="_blank" rel="noopener noreferrer">Live demo<span className="VisuallyHidden"> of {project.name}</span><ArrowUpRight size={16} aria-hidden="true" /></a>}
                  </div>
                </div>
                <div className="CaseStudyDetails">
                  <dl>
                    <div><dt>Architecture</dt><dd><code>{detail.architecture}</code></dd></div>
                    <div><dt>Engineering decision</dt><dd>{detail.decision}</dd></div>
                  </dl>
                  <ul className="ProjectTags" aria-label={project.name + ' technologies'}>{project.techStacks.map((technology) => <li key={technology}>{technology}</li>)}</ul>
                </div>
                <img className="CaseStudyImage" src={project.imageUrl} alt={project.name + ' interface'} loading="lazy" width="640" height="400" onError={(event) => { event.currentTarget.style.display = 'none' }} />
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
