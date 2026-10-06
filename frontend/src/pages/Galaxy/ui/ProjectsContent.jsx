import { PROJECTS, PROJECT_NODES, projectById } from '../data/projects.js'

function ProjectCaseStudy({ project, onClose }) {
  const study = project.caseStudy

  return <article className="ProjectCaseStudy" aria-labelledby="project-case-title">
    <div className="ProjectCaseHeader">
      <div>
        <p className="GalaxyEyebrow">{study.status}</p>
        <h3 id="project-case-title">{project.label}</h3>
      </div>
      <button type="button" onClick={onClose}>← Projects</button>
    </div>

    <p className="ProjectCaseQuestion">{study.question}</p>

    <section aria-labelledby="project-architecture-title">
      <p className="GalaxyEyebrow" id="project-architecture-title">Architecture / Approach</p>
      <ol className="ProjectArchitecture">
        {study.architecture.map((item, index) => <li key={item}>
          <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <p>{item}</p>
        </li>)}
      </ol>
    </section>

    <section className="ProjectCaseColumns">
      <div>
        <p className="GalaxyEyebrow">Engineering lesson</p>
        <p>{study.lesson}</p>
      </div>
      <div>
        <p className="GalaxyEyebrow">Current state</p>
        <p>{study.current}</p>
      </div>
    </section>

    <div className="ProjectCaseFooter">
      <ul aria-label={`${project.label} engineering focus`}>
        {project.focus.map(item => <li key={item}>{item}</li>)}
      </ul>
      <a href={project.href} target="_blank" rel="noreferrer">
        Inspect repository <span aria-hidden="true">↗</span>
      </a>
    </div>
  </article>
}

export default function ProjectsContent({ revealed, state, navigation, onReturn }) {
  const selected = projectById(state.selectedProjectId)

  return <section
    className={`ProjectsContent${revealed ? ' is-revealed' : ''}${selected ? ' has-case-study' : ''}`}
    aria-labelledby={selected ? "project-case-title" : "projects-title"}
    aria-hidden={!revealed}
    inert={!revealed}
  >
    {!selected && <>
      <p className="GalaxyEyebrow">Projects / Selected systems</p>
      <h2 id="projects-title">{PROJECTS.title}</h2>
      <p className="ProjectsIntro">{PROJECTS.intro}</p>
    </>}

    <div className={`ProjectsDirectory${selected ? ' is-condensed' : ''}`} role="group" aria-label="Project signals">
      {PROJECT_NODES.map((project, index) => <button
        key={project.id}
        type="button"
        aria-pressed={state.selectedProjectId === project.id}
        aria-controls={state.selectedProjectId === project.id ? 'project-case-title' : 'project-detail'}
        onClick={() => navigation.selectProject(project.id)}
        onFocus={() => navigation.setProjectHover(project.id, 'keyboard')}
        onBlur={() => navigation.setProjectHover(null, 'keyboard')}
        onPointerEnter={event => {
          if (event.pointerType !== 'touch') navigation.setProjectHover(project.id)
        }}
        onPointerLeave={() => navigation.setProjectHover(null)}
      >
        <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <span>
          <strong>{project.label}</strong>
          {!selected && <small>{project.category}</small>}
        </span>
      </button>)}
    </div>

    {selected ? <ProjectCaseStudy
      project={selected}
      onClose={() => navigation.clearProjectSelection()}
    /> : <div className="ProjectSignalDetail" id="project-detail" aria-live="polite" aria-atomic="true">
      <p className="GalaxyEyebrow">Explore the work</p>
      <p>{PROJECTS.prompt}</p>
    </div>}

    <button className="IdentityReturn" type="button" onClick={onReturn}>
      ← Return to system
    </button>
  </section>
}
