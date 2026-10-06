import {
  SKILLS,
  SKILL_GROUPS,
  SKILL_NODES,
  skillById,
} from '../data/skills.js'

export default function SkillsContent({ revealed, state, navigation, onReturn }) {
  const selected = skillById(state.selectedSkillId)

  return <section
    className={`SkillsContent${revealed ? ' is-revealed' : ''}`}
    aria-labelledby="skills-title"
    aria-hidden={!revealed}
    inert={!revealed}
  >
    <p className="GalaxyEyebrow">Skills / Capability system</p>
    <h2 id="skills-title">{SKILLS.title}</h2>
    <p className="SkillsIntro">{SKILLS.intro}</p>

    <div className="SkillsDirectory" aria-label="Engineering capability groups">
      {SKILL_GROUPS.map((group, groupIndex) => {
        const skills = SKILL_NODES.filter(skill => skill.groupId === group.id)
        return <section
          className="SkillGroup"
          key={group.id}
          aria-labelledby={`skill-group-${group.id}`}
          style={{ '--skill-group-color': group.color }}
        >
          <header>
            <span aria-hidden="true">{String(groupIndex + 1).padStart(2, '0')}</span>
            <div>
              <h3 id={`skill-group-${group.id}`}>{group.label}</h3>
              <p>{group.summary}</p>
            </div>
          </header>

          <div className="SkillGroupSignals" role="group" aria-label={`${group.label} technologies`}>
            {skills.map(skill => <button
              key={skill.id}
              type="button"
              aria-pressed={state.selectedSkillId === skill.id}
              aria-controls="skill-detail"
              onClick={() => navigation.selectSkill(skill.id)}
              onFocus={() => navigation.setSkillHover(skill.id, 'keyboard')}
              onBlur={() => navigation.setSkillHover(null, 'keyboard')}
              onPointerEnter={event => {
                if (event.pointerType !== 'touch') navigation.setSkillHover(skill.id)
              }}
              onPointerLeave={() => navigation.setSkillHover(null)}
            >
              <span aria-hidden="true">●</span>
              <span>{skill.label}</span>
            </button>)}
          </div>
        </section>
      })}
    </div>

    <div className="SkillDetail" id="skill-detail" aria-live="polite" aria-atomic="true">
      {selected ? <>
        <p className="GalaxyEyebrow">{selected.groupLabel} / {selected.category}</p>
        <h3>{selected.label}</h3>
        <p>{selected.summary}</p>
        <ul aria-label={`${selected.label} focus areas`}>
          {selected.focus.map(item => <li key={item}>{item}</li>)}
        </ul>
      </> : <>
        <p className="GalaxyEyebrow">Explore the system</p>
        <p>{SKILLS.prompt}</p>
      </>}
    </div>

    <button className="IdentityReturn" type="button" onClick={onReturn}>
      ← Return to system
    </button>
  </section>
}
