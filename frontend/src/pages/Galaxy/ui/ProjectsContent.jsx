import { PROJECTS, PROJECT_NODES, projectById } from '../data/projects.js'

export default function ProjectsContent({ revealed, state, navigation, onReturn }) {
  const selected = projectById(state.selectedProjectId)

  return <section
    className={`ProjectsContent${revealed ? ' is-revealed' : ''}`}
    aria-labelledby="projects-title"
    aria-hidden={!revealed}
    inert={!revealed}
  >
    <p className="GalaxyEyebrow">Projects / Selected systems</p>
    <h2 id="projects-title">{PROJECTS.title}</h2>
    <p className="ProjectsIntro">{PROJECTS.intro}</p>

    <div className="ProjectsDirectory" role="group" aria-label="Project signals">
      {PROJECT_NODES.map((project, index) => <button
        key={project.id}
        type="button"
        aria-pressed={state.selectedProjectId === project.id}
        aria-controls="project-detail"
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
          <small>{project.category}</small>
        </span>
      </button>)}
    </div>

    <div className="ProjectSignalDetail" id="project-detail" aria-live="polite" aria-atomic="true">
      {selected ? <>
        <p className="GalaxyEyebrow">{selected.category} / Selected project</p>
        <h3>{selected.label}</h3>
        <p>{selected.summary}</p>
        <ul aria-label={`${selected.label} engineering focus`}>
          {selected.focus.map(item => <li key={item}>{item}</li>)}
        </ul>
        <a href={selected.href} target="_blank" rel="noreferrer">
          View repository <span aria-hidden="true">↗</span>
        </a>
      </> : <>
        <p className="GalaxyEyebrow">Explore the work</p>
        <p>{PROJECTS.prompt}</p>
      </>}
    </div>

    <button className="IdentityReturn" type="button" onClick={onReturn}>
      ← Return to system
    </button>
  </section>
}
