import { useRef } from 'react'
import { ArrowRight, ArrowUpRight, Plus } from 'lucide-react'
import useSectionReveals from '../../motion/useSectionReveals.js'
import { WORK_PROJECTS } from './workProjects.js'
import './CubeWorkProjects.css'

function SystemFlow({ project }) {
  return (
    <figure className="WorkSystemFlow">
      <figcaption>System path <span>Conceptual architecture</span></figcaption>
      <ol aria-label={project.name + ' system path'}>
        {project.architecture.map((step, i) => (
          <li key={step}>
            <span className="WorkFlowIndex">{String(i + 1).padStart(2, '0')}</span>
            <span>{step}</span>
            {i < project.architecture.length - 1 && <ArrowRight size={14} aria-hidden="true" />}
          </li>
        ))}
      </ol>
    </figure>
  )
}

function ResearchEvidence({ metric }) {
  return (
    <figure className="WorkResearchEvidence">
      <figcaption>Controlled benchmark <span>{metric.note}</span></figcaption>
      {metric.rows.map(row => (
        <div className="WorkMetricRow" key={row.label}>
          <div><span>{row.label}</span><strong>{row.value}/{metric.denominator}</strong></div>
          <div className="WorkMetricTrack" aria-hidden="true"><span style={{width: (row.value / metric.denominator * 100) + '%'}} /></div>
        </div>
      ))}
      <p>Correctly identified pairs, not general web accuracy.</p>
    </figure>
  )
}

function ProjectLinks({ project }) {
  return (
    <div className="WorkLinks">
      <a href={project.repository} target="_blank" rel="noopener noreferrer">Source code <ArrowUpRight size={15} aria-hidden="true" /></a>
      {project.demo && <a href={project.demo} data-about-passage={project.id === 'backend-lab' ? '' : undefined}>{project.demoLabel} <ArrowUpRight size={15} aria-hidden="true" /></a>}
    </div>
  )
}

function ProjectStudy({ project, index }) {
  return (
    <article className={'CubeCaseStudy' + (project.featured ? ' WorkFeatured' : '')} aria-labelledby={'work-' + project.id} data-reveal>
      <span className="WorkOrbitSignal" aria-hidden="true"><span /></span>
      <div className="WorkStudyMeta"><span>{String(index + 1).padStart(2, '0')} / {project.category}</span><span>{project.status}</span></div>
      <div className="WorkStudyMain">
        <div className="WorkStudyCopy">
          <h2 id={'work-' + project.id}>{project.name}</h2>
          <p className="WorkHeadline">{project.headline}</p>
          <p className="WorkSummary">{project.summary}</p>
          <ul className="WorkTech" aria-label={project.name + ' technologies'}>{project.tech.map(item => <li key={item}>{item}</li>)}</ul>
          <ProjectLinks project={project} />
        </div>
        <div className="WorkExhibit">
          {project.metric ? <ResearchEvidence metric={project.metric} /> : project.image ? (
            <figure className="WorkImage">
              <img src={project.image} alt={project.imageAlt} loading="lazy" decoding="async" />
              <figcaption>Existing project capture</figcaption>
            </figure>
          ) : <SystemFlow project={project} />}
        </div>
      </div>
      <details className="WorkDetails">
        <summary>Engineering case study <Plus size={19} aria-hidden="true" /></summary>
        <div className="WorkDetailBody">
          {(project.metric || project.image) && <SystemFlow project={project} />}
          <dl>
            <div><dt>Problem</dt><dd>{project.problem}</dd></div>
            <div><dt>Engineering decision</dt><dd>{project.decision}</dd></div>
            <div><dt>What the implementation demonstrates</dt><dd>{project.outcome}</dd></div>
            <div><dt>Limits &amp; scope</dt><dd>{project.limitation}</dd></div>
          </dl>
          <a className="WorkEvidenceLink" href={project.evidence} target="_blank" rel="noopener noreferrer">{project.evidenceLabel} <ArrowUpRight size={15} aria-hidden="true" /></a>
        </div>
      </details>
    </article>
  )
}

export default function CubeWorkProjects({ active }) {
  const rootRef = useRef(null)
  useSectionReveals(rootRef, !active)
  return (
    <div className="CubeWorkProjects" ref={rootRef}>
      {WORK_PROJECTS.filter(project => project.featured).map((project, i) => <ProjectStudy key={project.id} project={project} index={i} />)}
      <div className="WorkArchiveHeading">
        <span>Additional work</span>
        <p>Earlier systems exploring commerce and realtime communication.</p>
      </div>
      {WORK_PROJECTS.filter(project => !project.featured).map((project, i) => <ProjectStudy key={project.id} project={project} index={i + 3} />)}
    </div>
  )
}
