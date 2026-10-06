import {
  LAB_CONTENT,
  LAB_EXPERIMENTS,
  labExperimentById,
} from '../data/lab.js'
import { projectById } from '../data/projects.js'

export default function LabContent({ revealed, state, navigation, onReturn }) {
  const selected = labExperimentById(state.selectedLabId)
  const relatedProject = selected?.relatedProjectId ? projectById(selected.relatedProjectId) : null

  return <section
    className={`LabContent${revealed ? ' is-revealed' : ''}`}
    aria-labelledby="lab-title"
    aria-hidden={!revealed}
    inert={!revealed}
  >
    <p className="GalaxyEyebrow">Lab / Research console</p>
    <h2 id="lab-title">{LAB_CONTENT.title}</h2>
    <p className="LabIntro">{LAB_CONTENT.intro}</p>

    <div className="LabConsole" role="group" aria-label="Research experiments">
      {LAB_EXPERIMENTS.map(experiment => <button
        key={experiment.id}
        type="button"
        aria-pressed={state.selectedLabId === experiment.id}
        aria-controls="lab-detail"
        onClick={() => navigation.selectLab(experiment.id)}
        onFocus={() => navigation.setLabHover(experiment.id, 'keyboard')}
        onBlur={() => navigation.setLabHover(null, 'keyboard')}
        onPointerEnter={event => {
          if (event.pointerType !== 'touch') navigation.setLabHover(experiment.id)
        }}
        onPointerLeave={() => navigation.setLabHover(null)}
        style={{ '--lab-color': experiment.color }}
      >
        <span>{experiment.code}</span>
        <span>
          <strong>{experiment.label}</strong>
          <small>{experiment.status}</small>
        </span>
      </button>)}
    </div>

    <div className="LabDetail" id="lab-detail" aria-live="polite" aria-atomic="true">
      {selected ? <>
        <p className="GalaxyEyebrow">{selected.code} / {selected.status}</p>
        <h3>{selected.label}</h3>
        <p className="LabQuestion">{selected.question}</p>
        <p className="LabEvidence">Current evidence: <strong>{selected.evidence}</strong></p>
        <ul aria-label={`${selected.label} research focus`}>
          {selected.focus.map(item => <li key={item}>{item}</li>)}
        </ul>
        <div className="LabDetailLinks">
          <a href={selected.href} target="_blank" rel="noreferrer">
            Inspect evidence <span aria-hidden="true">↗</span>
          </a>
          {relatedProject && <a className="GalaxySemanticLink" href={`/galaxy/projects/${relatedProject.id}`}>
            Open {relatedProject.label} case study <span aria-hidden="true">→</span>
          </a>}
        </div>
      </> : <>
        <p className="GalaxyEyebrow">Open questions</p>
        <p>{LAB_CONTENT.prompt}</p>
      </>}
    </div>

    <button className="IdentityReturn" type="button" onClick={onReturn}>
      ← Return to system
    </button>
  </section>
}
