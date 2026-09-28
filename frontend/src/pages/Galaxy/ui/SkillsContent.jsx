import { SKILLS, SKILL_NODES, skillById } from '../data/skills.js'

export default function SkillsContent({ revealed, state, navigation, onReturn }) {
  const selected = skillById(state.selectedSkillId)
  return <section className={`SkillsContent${revealed ? ' is-revealed' : ''}`} aria-labelledby="skills-title" aria-hidden={!revealed} inert={!revealed}>
    <p className="GalaxyEyebrow">Skills / Orbital toolkit</p>
    <h2 id="skills-title">{SKILLS.title}</h2>
    <p className="SkillsIntro">{SKILLS.intro}</p>
    <div className="SkillsDirectory" role="group" aria-label="Technology satellites">
      {SKILL_NODES.map((skill, index) => <button key={skill.id} type="button" aria-pressed={state.selectedSkillId === skill.id}
        aria-controls="skill-detail" onClick={() => navigation.selectSkill(skill.id)}
        onFocus={() => navigation.setSkillHover(skill.id, 'keyboard')} onBlur={() => navigation.setSkillHover(null, 'keyboard')}
        onPointerEnter={event => { if (event.pointerType !== 'touch') navigation.setSkillHover(skill.id) }} onPointerLeave={() => navigation.setSkillHover(null)}>
        <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span>{skill.label}</span>
      </button>)}
    </div>
    <div className="SkillDetail" id="skill-detail" aria-live="polite" aria-atomic="true">
      {selected ? <>
        <p className="GalaxyEyebrow">{selected.category} / Selected signal</p>
        <h3>{selected.label}</h3><p>{selected.summary}</p>
        <ul aria-label={`${selected.label} focus areas`}>{selected.focus.map(item => <li key={item}>{item}</li>)}</ul>
      </> : <><p className="GalaxyEyebrow">Explore the toolkit</p><p>{SKILLS.prompt}</p></>}
    </div>
    <button className="IdentityReturn" type="button" onClick={onReturn}>← Return to system</button>
  </section>
}
